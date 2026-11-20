const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { PAYOUT_STATUS } = require('../constants/bookingStatus');
const ROLES = require('../constants/roles');
const logger = require('../utils/logger');

class PayoutService {
  /**
   * Get all pending and ready payouts for Admin Dashboard
   */
  getAdminPayoutOverview() {
    const bookings = db.find('bookings', (b) => b.paymentStatus === 'PAID');
    const payouts = db.find('payouts');

    let totalGmv = 0;
    let totalPlatformCommission = 0;
    let pendingHotelPayoutTotal = 0;
    let settledHotelPayoutTotal = 0;

    bookings.forEach((b) => {
      totalGmv += b.totalAmount || 0;
      totalPlatformCommission += (b.platformCommissionGross || 0) + (b.platformConvenienceFee || 0);

      if (b.payoutStatus === PAYOUT_STATUS.SETTLED) {
        settledHotelPayoutTotal += b.netHotelPayout || 0;
      } else {
        pendingHotelPayoutTotal += b.netHotelPayout || 0;
      }
    });

    return {
      summary: {
        totalGmv: Math.round(totalGmv * 100) / 100,
        totalPlatformCommission: Math.round(totalPlatformCommission * 100) / 100,
        pendingHotelPayoutTotal: Math.round(pendingHotelPayoutTotal * 100) / 100,
        settledHotelPayoutTotal: Math.round(settledHotelPayoutTotal * 100) / 100,
        totalBookingsCount: bookings.length
      },
      pendingBookings: bookings.filter((b) => b.payoutStatus !== PAYOUT_STATUS.SETTLED),
      settledPayouts: payouts
    };
  }

  /**
   * Execute settlement transfer to hotel bank account
   */
  executePayout(bookingId, adminUser) {
    if (adminUser.role !== ROLES.ADMIN) {
      throw new Error('Only Platform Admins can execute hotel payouts.');
    }

    const booking = db.findById('bookings', bookingId);
    if (!booking) throw new Error('Booking not found.');

    if ([PAYOUT_STATUS.SETTLED, PAYOUT_STATUS.PROCESSING].includes(booking.payoutStatus)) {
      const existing = db.findOne('payouts', (p) => p.bookingId === bookingId);
      if (existing) return existing;
      throw new Error('This booking payout has already been submitted.');
    }

    if (booking.paymentStatus !== 'PAID' || !['CHECKED_IN', 'COMPLETED'].includes(booking.status) || booking.payoutStatus !== PAYOUT_STATUS.READY_FOR_PAYOUT) {
      const error = new Error('Payout is allowed only for paid bookings after guest check-in.');
      error.statusCode = 409;
      throw error;
    }

    const hotel = db.findById('hotels', booking.hotelId);
    const bankDetails = (hotel && hotel.bankAccount) ? hotel.bankAccount : {};
    if (!bankDetails.accountHolderName || !bankDetails.accountNumber || !bankDetails.ifscCode) {
      const error = new Error('Verified hotel bank details are required before payout.');
      error.statusCode = 409;
      throw error;
    }
    if (!Number.isFinite(Number(booking.netHotelPayout)) || Number(booking.netHotelPayout) <= 0) {
      const error = new Error('Payout amount is invalid.');
      error.statusCode = 409;
      throw error;
    }

    const payoutRecord = {
      id: `payout-${uuidv4().slice(0, 8)}`,
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      hotelId: booking.hotelId,
      hotelName: booking.hotelName,
      hotelOwnerId: hotel ? hotel.ownerId : null,
      amount: booking.netHotelPayout,
      bankAccount: {
        accountHolder: bankDetails.accountHolderName || 'Hotel Partner',
        accountNumberMasked: bankDetails.accountNumber ? `••••${bankDetails.accountNumber.slice(-4)}` : '••••9823',
        ifscCode: bankDetails.ifscCode || 'HDFC0001234',
        bankName: bankDetails.bankName || 'HDFC Bank'
      },
      transferReferenceId: null,
      status: PAYOUT_STATUS.PROCESSING,
      requestedAt: new Date().toISOString(),
      requestedBy: adminUser.email
    };

    db.insert('payouts', payoutRecord);
    db.update('bookings', bookingId, {
      payoutStatus: PAYOUT_STATUS.PROCESSING,
      payoutId: payoutRecord.id,
      payoutRequestedAt: payoutRecord.requestedAt
    });

    logger.info(`Queued payout ${payoutRecord.id} for Hotel: ${booking.hotelName} (${booking.bookingCode})`);
    return payoutRecord;
  }

  /**
   * Get financial ledger for specific hotel owner
   */
  getHotelierFinancialLedger(ownerId) {
    const ownerHotels = db.find('hotels', (h) => h.ownerId === ownerId);
    const hotelIds = ownerHotels.map((h) => h.id);

    const hotelBookings = db.find('bookings', (b) => hotelIds.includes(b.hotelId) && b.paymentStatus === 'PAID');
    const hotelPayouts = db.find('payouts', (p) => hotelIds.includes(p.hotelId));

    let grossRevenue = 0;
    let netPayoutEarned = 0;
    let pendingPayoutAmount = 0;
    let settledPayoutAmount = 0;

    hotelBookings.forEach((b) => {
      grossRevenue += b.totalAmount || 0;
      netPayoutEarned += b.netHotelPayout || 0;

      if (b.payoutStatus === PAYOUT_STATUS.SETTLED) {
        settledPayoutAmount += b.netHotelPayout || 0;
      } else {
        pendingPayoutAmount += b.netHotelPayout || 0;
      }
    });

    return {
      summary: {
        grossRevenue: Math.round(grossRevenue * 100) / 100,
        netPayoutEarned: Math.round(netPayoutEarned * 100) / 100,
        pendingPayoutAmount: Math.round(pendingPayoutAmount * 100) / 100,
        settledPayoutAmount: Math.round(settledPayoutAmount * 100) / 100,
        totalBookings: hotelBookings.length
      },
      bookings: hotelBookings,
      payoutHistory: hotelPayouts
    };
  }
}

module.exports = new PayoutService();
