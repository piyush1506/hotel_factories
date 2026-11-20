const { calculateFinancialBreakdown, calculateNights } = require('../utils/helpers');
const db = require('../config/database');
const config = require('../config/env');

class PricingService {
  /**
   * Calculate full live pricing quote with taxes, discounts, and breakdowns
   */
  calculateQuote({
    hotelId,
    roomId,
    checkInDate,
    checkOutDate,
    roomsCount = 1,
    couponCode = null,
    guestCount = { adults: 2, children: 0 }
  }) {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    const today = new Date().toISOString().slice(0, 10);
    if (!datePattern.test(checkInDate) || !datePattern.test(checkOutDate) || checkOutDate <= checkInDate || checkInDate < today) {
      const error = new Error('Check-in and check-out dates must be valid future dates, with check-out after check-in.');
      error.statusCode = 400;
      throw error;
    }
    if (!Number.isInteger(Number(roomsCount)) || Number(roomsCount) < 1 || Number(roomsCount) > 10) {
      const error = new Error('roomsCount must be between 1 and 10.');
      error.statusCode = 400;
      throw error;
    }
    const hotel = db.findById('hotels', hotelId);
    if (!hotel) throw new Error('Hotel not found.');

    const room = db.findById('rooms', roomId);
    if (!room) throw new Error('Room not found.');
    if (room.hotelId !== hotel.id || room.status !== 'AVAILABLE') {
      const error = new Error('The selected room is not available at this hotel.');
      error.statusCode = 409;
      throw error;
    }

    const nights = calculateNights(checkInDate, checkOutDate);
    const baseRoomPrice = room.basePrice;
    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = db.findOne('coupons', (c) => c.code.toUpperCase() === couponCode.toUpperCase() && c.isActive);
      if (coupon) {
        const totalRaw = baseRoomPrice * nights * roomsCount;
        if (totalRaw >= coupon.minBookingAmount) {
          if (coupon.discountType === 'FLAT') {
            discountAmount = Math.min(coupon.discountValue, coupon.maxDiscountCap || coupon.discountValue);
          } else if (coupon.discountType === 'PERCENT') {
            const rawDiscount = (totalRaw * coupon.discountValue) / 100;
            discountAmount = Math.min(rawDiscount, coupon.maxDiscountCap || rawDiscount);
          }
          appliedCoupon = coupon;
        }
      }
    }

    const commissionRate = hotel.commissionRate || config.DEFAULT_COMMISSION_RATE;
    const convenienceFee = config.PLATFORM_CONVENIENCE_FEE;

    const breakdown = calculateFinancialBreakdown({
      baseRoomPrice,
      nights,
      roomsCount,
      discountAmount,
      commissionRate,
      convenienceFee
    });

    return {
      hotel: {
        id: hotel.id,
        name: hotel.name,
        city: hotel.city
      },
      room: {
        id: room.id,
        name: room.name,
        type: room.type,
        basePrice: room.basePrice,
        originalPrice: room.originalPrice
      },
      checkInDate,
      checkOutDate,
      nights,
      roomsCount,
      guestCount,
      appliedCoupon: appliedCoupon ? appliedCoupon.code : null,
      ...breakdown
    };
  }
}

module.exports = new PricingService();
