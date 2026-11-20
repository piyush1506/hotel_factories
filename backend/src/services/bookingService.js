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

class BookingService {
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
      guestCount
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
      userId: userId || 'guest',
      guestName,
      guestEmail,
      guestPhone,
      guestCount,
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

    // Generate cryptographically signed QR code URL for live digital check-in
    const frontendUrl = config.FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:3001';
    const passSignature = this.generatePassSignature(booking);
    const verifyUrl = `${frontendUrl}/?verify=${booking.bookingCode}&sig=${passSignature}`;
    const qrCodeData = await generateQRCode(verifyUrl);

    const updates = {
      status: BOOKING_STATUS.CONFIRMED,
      paymentStatus: PAYMENT_STATUS.PAID,
      paymentMethod,
      paymentTransactionId,
      payoutStatus: PAYOUT_STATUS.PENDING_ESCROW,
      passSignature,
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

    // Refund policy calculation
    let refundAmount = booking.totalAmount;
    let cancellationFee = 0;

    const checkInDate = new Date(booking.checkInDate);
    const now = new Date();
    const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);

    if (hoursUntilCheckIn < 24) {
      // 50% refund if within 24 hours
      cancellationFee = booking.totalAmount * 0.5;
      refundAmount = booking.totalAmount * 0.5;
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
    return db.find('bookings', (b) => b.userId === userId);
  }

  getBookingById(id) {
    return db.findById('bookings', id);
  }

  getBookingByCode(bookingCode) {
    return db.findOne('bookings', (b) => b.bookingCode === bookingCode.trim().toUpperCase());
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

  verifyBookingPass(bookingCode, signature = '') {
    if (!bookingCode) return null;
    const cleanCode = bookingCode.trim().toUpperCase();
    const booking = db.findOne('bookings', (b) => 
      (b.bookingCode && b.bookingCode.toUpperCase() === cleanCode) || 
      (b.id && b.id.toUpperCase() === cleanCode)
    );
    if (!booking) return null;

    const expectedSig = this.generatePassSignature(booking);
    const hasSignature = Boolean(signature && signature.trim());
    const isAuthentic = hasSignature && (signature.trim().toLowerCase() === expectedSig.toLowerCase());

    return {
      isValid: true,
      isCryptographicallySigned: isAuthentic,
      signatureStatus: isAuthentic ? 'AUTHENTIC_SIGNED' : (hasSignature ? 'TAMPERED_OR_INVALID' : 'UNSIGNED_LOOKUP'),
      securityStamp: isAuthentic 
        ? `HMAC-SHA256 Certified by Hotel Factories Security Engine (${expectedSig})`
        : (hasSignature ? 'FORGED / INVALID DIGITAL SIGNATURE DETECTED' : 'MANUAL LOOKUP (Unsigned URL scanned)'),
      passSignature: expectedSig,
      bookingCode: booking.bookingCode,
      bookingId: booking.id,
      hotelId: booking.hotelId,
      hotelName: booking.hotelName,
      hotelAddress: booking.hotelAddress,
      hotelCity: booking.hotelCity,
      roomName: booking.roomName,
      guestName: booking.guestName,
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

    return db.find('bookings', (b) => b.hotelId === hotelId);
  }

  getAdminAllBookings() {
    return db.find('bookings');
  }
}

module.exports = new BookingService();
