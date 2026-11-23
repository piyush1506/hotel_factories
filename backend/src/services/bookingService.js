const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const config = require('../config/env');
const db = require('../config/database');
const pricingService = require('./pricingService');
const inventoryService = require('./inventoryService');
const { generateBookingCode, generateQRCode } = require('../utils/helpers');
const { BOOKING_STATUS, PAYMENT_STATUS, PAYOUT_STATUS } = require('../constants/bookingStatus');
const ROLES = require('../constants/roles');
const logger = require('../utils/logger');
const { assertConfirmable, assertCanCheckIn, assertCanCheckOut, assertCanMarkNoShow } = require('./bookingLifecycle');

// Compact tokens stay well under this; legacy tokens carrying the full guest
// profile were ~250 chars and produced QR codes too dense for camera scanners.
const VAULT_TOKEN_MAX_LENGTH = 140;

class BookingService {
  constructor() {
    this.getVaultSecretKey = this.getVaultSecretKey.bind(this);
    this.encryptBookingVaultToken = this.encryptBookingVaultToken.bind(this);
    this.decryptBookingVaultToken = this.decryptBookingVaultToken.bind(this);
    this.verifyBookingPass = this.verifyBookingPass.bind(this);
    this.generatePassSignature = this.generatePassSignature.bind(this);
  }

  /**
   * Step 1: Create a temporary held booking with 10-minute inventory lock
   */
  async holdBooking({
    roomId,
    checkInDate,
    checkOutDate,
    roomsCount = 1,
    guestName,
    guestEmail,
    guestPhone,
    guestCount = { adults: 2, children: 0 },
    specialRequests = '',
    couponCode = null,
    userId = null
  }) {
    return db.withWriteLock(() => db.transaction(async () => {
    const room = db.findById('rooms', roomId);
    if (!room) throw new Error('Room not found.');

    const hotel = db.findById('hotels', room.hotelId);
    if (!hotel) throw new Error('Hotel not found.');

    // Normalize guest breakdown (splitting adults into male and female for clear stay records)
    const normalizedGuests = typeof guestCount === 'object' && guestCount !== null
      ? {
          adults: Number(guestCount.adults) || ((Number(guestCount.adultsMale) || 0) + (Number(guestCount.adultsFemale) || 0)) || 2,
          adultsMale: guestCount.adultsMale !== undefined ? Number(guestCount.adultsMale) : Math.ceil((Number(guestCount.adults) || 2) / 2),
          adultsFemale: guestCount.adultsFemale !== undefined ? Number(guestCount.adultsFemale) : Math.floor((Number(guestCount.adults) || 2) / 2),
          children: Number(guestCount.children) || 0
        }
      : {
          adults: Number(guestCount) || 2,
          adultsMale: Math.ceil((Number(guestCount) || 2) / 2),
          adultsFemale: Math.floor((Number(guestCount) || 2) / 2),
          children: 0
        };

    // 1. Lock room inventory (prevents double-booking)
    const lock = inventoryService.lockRoomInventory({
      roomId,
      checkInDate,
      checkOutDate,
      roomsCount,
      userId
    });

    // 2. Calculate exact financial and GST quotation
    const quote = pricingService.calculateQuote({
      hotelId: hotel.id,
      roomId: room.id,
      checkInDate,
      checkOutDate,
      roomsCount,
      couponCode,
      guestCount: normalizedGuests
    });

    const bookingId = `BK-${uuidv4()}`;
    const bookingCode = generateBookingCode();

    const heldBooking = {
      id: bookingId,
      bookingCode,
      lockId: lock.id,
      hotelId: hotel.id,
      hotelName: hotel.name,
      hotelSlug: hotel.slug,
      hotelCity: hotel.city,
      hotelAddress: hotel.address,
      hotelImage: hotel.images[0],
      roomId: room.id,
      roomName: room.name,
      roomType: room.type,
      cancellationPolicy: room.cancellationPolicy || hotel.cancellationPolicy || null,
      amenities: room.amenities || hotel.amenities || [],
      allowPayAtHotel: hotel.allowPayAtHotel ?? true,
      userId: userId || 'guest',
      guestName,
      guestEmail,
      guestPhone,
      guestCount: normalizedGuests,
      specialRequests,
      checkInDate,
      checkOutDate,
      nights: quote.nights,
      roomsCount,
      baseRoomPrice: quote.baseRoomPrice,
      totalBaseTariff: quote.totalBaseTariff,
      discountAmount: quote.discountAmount,
      couponApplied: quote.appliedCoupon,
      discountedTariff: quote.discountedTariff,
      gstRatePercentage: quote.gstRatePercentage,
      hotelGstAmount: quote.hotelGstAmount,
      platformConvenienceFee: quote.platformConvenienceFee,
      convenienceFeeGst: quote.convenienceFeeGst,
      totalAmount: quote.totalPayableByCustomer,
      commissionRatePercentage: quote.commissionRatePercentage,
      platformCommissionGross: quote.platformCommissionGross,
      commissionGst: quote.commissionGst,
      gatewayFee: quote.gatewayFee,
      tdsDeduction: quote.tdsDeduction,
      netHotelPayout: quote.netHotelPayout,
      adminNetProfit: quote.adminNetProfit,
      paymentStatus: PAYMENT_STATUS.PENDING,
      paymentMethod: null,
      paymentTransactionId: null,
      payoutStatus: PAYOUT_STATUS.PENDING_ESCROW,
      status: BOOKING_STATUS.HELD,
      lockExpiresAt: lock.expiresAt,
      bookedAt: new Date().toISOString()
    };

    db.insert('bookings', heldBooking);
    return heldBooking;
    }));
  }

  /**
   * Step 2: Confirm booking upon successful payment
   */
  async confirmBooking({
    bookingId,
    paymentTransactionId = `pay_mock_${Date.now()}`,
    paymentMethod = 'RAZORPAY_UPI'
  }) {
    return db.withWriteLock(() => db.transaction(async () => {
    const booking = db.findById('bookings', bookingId);
    if (!booking) throw new Error('Booking reservation not found.');

    try {
      if (!assertConfirmable(booking, paymentTransactionId)) return booking;
    } catch (error) {
      if (booking.lockId) inventoryService.releaseLock(booking.lockId);
      if (booking.status !== BOOKING_STATUS.CONFIRMED) {
        db.update('bookings', bookingId, { status: BOOKING_STATUS.EXPIRED, lockId: null });
      }
      throw error;
    }

    // Release temporary inventory hold lock since booking is now permanently confirmed
    if (booking.lockId) {
      inventoryService.releaseLock(booking.lockId);
    }

    // Generate cryptographically signed & encrypted QR vault token for live digital check-in
    const frontendUrl = config.FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:3001';
    const passSignature = this.generatePassSignature(booking);
    const vaultToken = this.encryptBookingVaultToken(booking);
    const verifyUrl = `${frontendUrl}/?vault=${encodeURIComponent(vaultToken)}`;
    const qrCodeData = await generateQRCode(verifyUrl);

    const updates = {
      status: BOOKING_STATUS.CONFIRMED,
      paymentStatus: PAYMENT_STATUS.PAID,
      paymentMethod,
      paymentTransactionId,
      payoutStatus: PAYOUT_STATUS.PENDING_ESCROW,
      passSignature,
      vaultToken,
      verifyUrl,
      qrCodeData: qrCodeData || verifyUrl,
      lockId: null,
      confirmedAt: new Date().toISOString()
    };

    const confirmed = db.update('bookings', bookingId, updates);
    logger.info(`Booking confirmed successfully: ${booking.bookingCode} for ₹${booking.totalAmount}`);

    return confirmed;
    }));
  }

  /**
   * Check in guest at the hotel desk using QR pass or booking code
   */
  checkInGuest(bookingCode, hotelierUser) {
    const booking = db.findOne('bookings', (b) => b.bookingCode === bookingCode.trim().toUpperCase());
    if (!booking) throw new Error('Invalid booking reference code.');

    const hotel = db.findById('hotels', booking.hotelId);
    if (hotelierUser.role !== ROLES.ADMIN && hotel.ownerId !== hotelierUser.id) {
      throw new Error('Unauthorized. This reservation belongs to another hotel property.');
    }

    assertCanCheckIn(booking);

    const updated = db.update('bookings', booking.id, {
      status: BOOKING_STATUS.CHECKED_IN,
      payoutStatus: PAYOUT_STATUS.READY_FOR_PAYOUT,
      checkedInAt: new Date().toISOString()
    });

    return updated;
  }

  /**
   * Check out guest at departure and complete the stay
   */
  checkOutGuest(bookingCode, hotelierUser) {
    const cleanCode = bookingCode.trim().toUpperCase();
    const booking = db.findOne('bookings', (b) => b.bookingCode === cleanCode || b.id === cleanCode);
    if (!booking) throw new Error('Invalid booking reference code.');

    const hotel = db.findById('hotels', booking.hotelId);
    if (hotelierUser.role !== ROLES.ADMIN && hotel.ownerId !== hotelierUser.id) {
      throw new Error('Unauthorized. This reservation belongs to another hotel property.');
    }

    assertCanCheckOut(booking);

    const updated = db.update('bookings', booking.id, {
      status: BOOKING_STATUS.COMPLETED,
      payoutStatus: PAYOUT_STATUS.SETTLED,
      checkedOutAt: new Date().toISOString()
    });

    logger.info(`Guest checked out for booking ${booking.bookingCode}. Stay marked as COMPLETED.`);
    return updated;
  }

  /**
   * Mark booking as No-Show when guest fails to arrive
   */
  markNoShow(bookingCode, hotelierUser, reason = 'Guest failed to arrive by check-in date') {
    const cleanCode = bookingCode.trim().toUpperCase();
    const booking = db.findOne('bookings', (b) => b.bookingCode === cleanCode || b.id === cleanCode);
    if (!booking) throw new Error('Invalid booking reference code.');

    const hotel = db.findById('hotels', booking.hotelId);
    if (hotelierUser.role !== ROLES.ADMIN && hotel.ownerId !== hotelierUser.id) {
      throw new Error('Unauthorized. This reservation belongs to another hotel property.');
    }

    assertCanMarkNoShow(booking);

    if (booking.lockId) {
      inventoryService.releaseLock(booking.lockId);
    }

    const updated = db.update('bookings', booking.id, {
      status: BOOKING_STATUS.NO_SHOW,
      noShowReason: reason,
      noShowAt: new Date().toISOString(),
      payoutStatus: PAYOUT_STATUS.READY_FOR_PAYOUT
    });

    logger.info(`Booking ${booking.bookingCode} marked as NO_SHOW. Retention fee policy applied.`);
    return updated;
  }

  /**
   * Cancel booking with refund calculation
   */
  cancelBooking(bookingId, user, reason = 'User requested cancellation') {
    const booking = db.findById('bookings', bookingId);
    if (!booking) throw new Error('Booking not found.');

    const hotel = db.findById('hotels', booking.hotelId);

    // Permission check
    const isOwner = user.role === ROLES.ADMIN || hotel.ownerId === user.id || booking.userId === user.id;
    if (!isOwner) throw new Error('Unauthorized to cancel this booking.');

    if ([BOOKING_STATUS.CANCELLED, BOOKING_STATUS.REFUNDED].includes(booking.status)) {
      return booking;
    }

    // Release lock if it was held
    if (booking.lockId) {
      inventoryService.releaseLock(booking.lockId);
    }

    // Dynamic Refund & Cancellation Policy calculation based on actual hotel/room policy
    let refundAmount = booking.totalAmount;
    let cancellationFee = 0;

    const policy = booking.cancellationPolicy || hotel?.cancellationPolicy || {};
    const isRefundable = policy.refundable !== false && String(policy.type || '').toUpperCase() !== 'NON_REFUNDABLE';

    if (!isRefundable) {
      // Non-refundable reservation
      cancellationFee = booking.totalAmount;
      refundAmount = 0;
    } else {
      const windowHours = Number(policy.windowHours) || 24;
      const lateFeeRate = (Number(policy.lateFeePercentage) || 50) / 100;
      const checkInDate = new Date(booking.checkInDate);
      const now = new Date();
      const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);

      if (hoursUntilCheckIn < windowHours) {
        // Cancelled within non-free window
        cancellationFee = Math.round(booking.totalAmount * lateFeeRate * 100) / 100;
        refundAmount = Math.max(0, Math.round((booking.totalAmount - cancellationFee) * 100) / 100);
      } else {
        // Cancelled before window: 100% full refund
        cancellationFee = 0;
        refundAmount = booking.totalAmount;
      }
    }

    const wasPaid = booking.paymentStatus === PAYMENT_STATUS.PAID;
    const updated = db.update('bookings', bookingId, {
      status: BOOKING_STATUS.CANCELLED,
      paymentStatus: wasPaid ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PENDING,
      refundStatus: wasPaid && refundAmount > 0 ? 'PENDING_PROVIDER' : 'NOT_REQUIRED',
      cancellationReason: reason,
      refundAmount: Math.round(refundAmount * 100) / 100,
      cancellationFee: Math.round(cancellationFee * 100) / 100,
      cancelledAt: new Date().toISOString()
    });

    return updated;
  }

  getUserBookings(userId) {
    const list = db.find('bookings', (b) => b.userId === userId);
    return list.map((b) => {
      this.ensureVaultToken(b);
      return b;
    });
  }

  getBookingById(id) {
    const b = db.findById('bookings', id);
    if (b) this.ensureVaultToken(b);
    return b;
  }

  getBookingByCode(bookingCode) {
    const b = db.findOne('bookings', (x) => x.bookingCode === bookingCode.trim().toUpperCase());
    if (b) this.ensureVaultToken(b);
    return b;
  }

  getVaultSecretKey() {
    const secret = config.QR_VAULT_SECRET || config.JWT_SECRET || 'hotel_factories_qr_vault_master_key_2026';
    return crypto.createHash('sha256').update(secret).digest();
  }

  /**
   * Returns a compact, scannable vault token. Legacy tokens embedded the full
   * guest profile (~250 chars) which made the QR too dense for phone cameras.
   * They are transparently re-issued as short tokens when read.
   */
  ensureVaultToken(booking) {
    if (!booking) return '';
    const current = typeof booking.vaultToken === 'string' ? booking.vaultToken : '';
    const isCompactToken = current.startsWith('HF1.')
      && current.split('.').length === 4
      && current.length <= VAULT_TOKEN_MAX_LENGTH;
    if (isCompactToken) return current;

    const token = this.encryptBookingVaultToken(booking);
    if (token) {
      booking.vaultToken = token;
      return token;
    }
    return current;
  }

  encryptBookingVaultToken(booking) {
    if (!booking) return '';
    try {
      const key = this.getVaultSecretKey();
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

      // Only the booking reference and issue time are needed. The backend
      // looks up the authoritative booking record after decryption.
      const bookingRef = booking.bookingCode || booking.id || '';
      const payload = `${bookingRef}|${Date.now()}`;

      const encrypted = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()]);
      const authTag = cipher.getAuthTag();

      return `HF1.${iv.toString('base64url')}.${encrypted.toString('base64url')}.${authTag.toString('base64url')}`;
    } catch (err) {
      logger.error(`Error encrypting vault token: ${err.message}`);
      return '';
    }
  }

  decryptBookingVaultToken(vaultToken) {
    if (!vaultToken || typeof vaultToken !== 'string') return null;
    const parts = vaultToken.trim().split('.');
    if (parts.length !== 4 || parts[0] !== 'HF1') {
      return null;
    }

    try {
      const iv = Buffer.from(parts[1], 'base64url');
      const encrypted = Buffer.from(parts[2], 'base64url');
      const authTag = Buffer.from(parts[3], 'base64url');

      const key = this.getVaultSecretKey();
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
      const text = decrypted.toString('utf8');

      // New compact format: "HF-2026-ABC123|<timestamp>"
      // Legacy format: JSON with code/id/hotelId/guestName/iat.
      try {
        return JSON.parse(text);
      } catch {
        const [code, issuedAt] = text.split('|');
        if (!code) return null;
        return { code, iat: Number(issuedAt) || null };
      }
    } catch (err) {
      logger.warn(`Vault decryption failed: ${err.message}`);
      return null;
    }
  }

  generatePassSignature(booking) {
    const secret = config.JWT_SECRET || 'hotel_factories_super_secure_jwt_secret_2026_key';
    const payload = [
      booking.bookingCode || '',
      booking.hotelId || '',
      booking.id || '',
      booking.guestName || '',
      booking.checkInDate || '',
      Math.round(Number(booking.totalAmount || 0))
    ].join('|');
    return crypto.createHmac('sha256', secret).update(payload).digest('hex').slice(0, 16);
  }

  verifyBookingPass(codeOrVault, signature = '') {
    if (!codeOrVault) return null;
    const input = String(codeOrVault).trim();

    let isVaultEncrypted = false;
    let decryptedPayload = null;
    let cleanCode = '';

    if (/^HF1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(input)) {
      isVaultEncrypted = true;
      decryptedPayload = this.decryptBookingVaultToken(input);
      if (!decryptedPayload) {
        return {
          isValid: false,
          isCryptographicallySigned: false,
          isSecretDecrypted: false,
          signatureStatus: 'TAMPERED_OR_INVALID',
          securityStamp: 'DECRYPTION FAILED: Forged or corrupted cipher payload (Backend secret key rejected token)',
          error: 'Decryption failed: Token is counterfeit or tampered. Only Hotel Factories Backend can unlock valid QR passes.'
        };
      }
      cleanCode = (decryptedPayload.code || decryptedPayload.c || decryptedPayload.id || '').toUpperCase();
    } else {
      cleanCode = input.toUpperCase();
    }

    if (!cleanCode) return null;

    const booking = db.findOne('bookings', (b) => 
      (b.bookingCode && b.bookingCode.toUpperCase() === cleanCode) || 
      (b.id && b.id.toUpperCase() === cleanCode)
    );
    if (!booking) return null;

    const expectedSig = this.generatePassSignature(booking);
    const hasSignature = Boolean(signature && String(signature).trim());
    const signatureMatches = hasSignature
      && String(signature).trim().toLowerCase() === expectedSig.toLowerCase();

    // AES-256-GCM authenticates the ciphertext through its auth tag, so a
    // successfully decrypted vault token is cryptographically authentic.
    const isAuthentic = isVaultEncrypted || signatureMatches;

    // A supplied signature that does not match is a forgery attempt. Never
    // expose the expected signature or a usable vault token in this response.
    if (!isVaultEncrypted && hasSignature && !signatureMatches) {
      return {
        isValid: false,
        isCryptographicallySigned: false,
        isSecretDecrypted: false,
        signatureStatus: 'TAMPERED_OR_INVALID',
        securityStamp: 'HMAC-SHA256 SIGNATURE MISMATCH: Forged or altered pass rejected.',
        error: 'Signature verification failed: This QR pass was not issued by Hotel Factories.',
        bookingCode: booking.bookingCode,
        bookingId: booking.id,
        hotelId: booking.hotelId,
        hotelName: booking.hotelName,
        hotelAddress: booking.hotelAddress,
        hotelCity: booking.hotelCity,
        roomName: booking.roomName,
        guestName: booking.guestName,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        totalAmount: booking.totalAmount,
        verifiedAt: new Date().toISOString()
      };
    }

    // Only authentic passes receive credentials. An unsigned code lookup is
    // allowed for front-desk manual entry but is explicitly flagged as such.
    const vaultToken = isAuthentic ? this.ensureVaultToken(booking) : null;

    return {
      isValid: true,
      isCryptographicallySigned: isAuthentic,
      isSecretDecrypted: isVaultEncrypted,
      encryptionMethod: isVaultEncrypted
        ? 'AES-256-GCM Military-Grade Cryptographic Vault'
        : isAuthentic
          ? 'HMAC-SHA256 Digital Signature'
          : 'Manual Reference Lookup',
      signatureStatus: isAuthentic ? 'AUTHENTIC_SIGNED' : 'UNSIGNED_LOOKUP',
      securityStamp: isVaultEncrypted 
        ? `AES-256-GCM Certified & Unlocked via Hotel Factories Backend Secret Key (IV: ${input.split('.')[1]?.slice(0, 8)}...)`
        : isAuthentic
          ? `HMAC-SHA256 Certified by Hotel Factories Security Engine (${expectedSig})`
          : 'MANUAL LOOKUP (No Signature) - Verify Govt Photo ID before check-in',
      passSignature: isAuthentic ? expectedSig : null,
      vaultToken,
      bookingCode: booking.bookingCode,
      bookingId: booking.id,
      hotelId: booking.hotelId,
      hotelName: booking.hotelName,
      hotelAddress: booking.hotelAddress,
      hotelCity: booking.hotelCity,
      roomName: booking.roomName,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
      guestCount: booking.guestCount || 2,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      nights: booking.nights,
      roomsCount: booking.roomsCount,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      totalAmount: booking.totalAmount,
      confirmedAt: booking.confirmedAt,
      verifiedAt: new Date().toISOString()
    };
  }

  getHotelBookings(hotelId, user) {
    const hotel = db.findById('hotels', hotelId);
    if (!hotel) throw new Error('Hotel not found.');

    if (user.role !== ROLES.ADMIN && hotel.ownerId !== user.id) {
      throw new Error('Unauthorized to view this hotel bookings.');
    }

    return db.find('bookings', (b) => b.hotelId === hotelId).map((b) => {
      this.ensureVaultToken(b);
      return b;
    });
  }

  getAdminAllBookings() {
    return db.find('bookings').map((b) => {
      this.ensureVaultToken(b);
      return b;
    });
  }
}

module.exports = new BookingService();
