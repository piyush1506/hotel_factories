const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

class CouponService {
  listActiveCoupons() {
    return db.find('coupons', (c) => c.isActive);
  }

  validateCoupon(code, amount) {
    if (!code) throw new Error('Coupon code is required.');
    const coupon = db.findOne('coupons', (c) => c.code.toUpperCase() === code.trim().toUpperCase() && c.isActive);

    if (!coupon) {
      throw new Error('Invalid or expired coupon code.');
    }

    if (new Date(coupon.expiresAt) < new Date()) {
      throw new Error('This coupon has expired.');
    }

    const bookingTotal = parseFloat(amount) || 0;
    if (bookingTotal < coupon.minBookingAmount) {
      throw new Error(`Minimum booking amount of ₹${coupon.minBookingAmount} is required for this coupon.`);
    }

    let discount = 0;
    if (coupon.discountType === 'FLAT') {
      discount = Math.min(coupon.discountValue, coupon.maxDiscountCap || coupon.discountValue);
    } else if (coupon.discountType === 'PERCENT') {
      const calculated = (bookingTotal * coupon.discountValue) / 100;
      discount = Math.min(calculated, coupon.maxDiscountCap || calculated);
    }

    return {
      isValid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      },
      discountAmount: Math.round(discount * 100) / 100
    };
  }

  listAllCoupons() {
    return db.find('coupons').sort((a, b) => {
      const aTime = new Date(a.createdAt || a.expiresAt || 0).getTime();
      const bTime = new Date(b.createdAt || b.expiresAt || 0).getTime();
      return bTime - aTime;
    });
  }

  updateCoupon(id, data = {}) {
    const coupon = db.findById('coupons', id);
    if (!coupon) {
      const error = new Error('Coupon not found.');
      error.statusCode = 404;
      throw error;
    }

    const updates = {};
    if (data.isActive !== undefined) updates.isActive = Boolean(data.isActive);
    if (data.description !== undefined) updates.description = String(data.description).slice(0, 500);
    if (data.expiresAt !== undefined) {
      const expiry = new Date(data.expiresAt);
      if (Number.isNaN(expiry.getTime())) {
        const error = new Error('Expiry date is invalid.');
        error.statusCode = 400;
        throw error;
      }
      updates.expiresAt = expiry.toISOString();
    }
    if (data.maxDiscountCap !== undefined) updates.maxDiscountCap = parseFloat(data.maxDiscountCap) || 0;
    if (data.minBookingAmount !== undefined) updates.minBookingAmount = parseFloat(data.minBookingAmount) || 0;
    if (data.discountValue !== undefined) {
      const discountValue = parseFloat(data.discountValue);
      if (!Number.isFinite(discountValue) || discountValue <= 0) {
        const error = new Error('Discount value must be greater than zero.');
        error.statusCode = 400;
        throw error;
      }
      if (coupon.discountType === 'PERCENT' && discountValue > 100) {
        const error = new Error('A percentage discount cannot exceed 100.');
        error.statusCode = 400;
        throw error;
      }
      updates.discountValue = discountValue;
    }

    return db.update('coupons', id, updates);
  }

  createCoupon(data = {}) {
    const code = String(data.code || '').trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,24}$/.test(code)) {
      const error = new Error('Coupon code must be 3-24 characters using letters, numbers, hyphens or underscores.');
      error.statusCode = 400;
      throw error;
    }

    const duplicate = db.findOne('coupons', (coupon) => String(coupon.code || '').toUpperCase() === code);
    if (duplicate) {
      const error = new Error(`Coupon code "${code}" already exists.`);
      error.statusCode = 409;
      throw error;
    }

    const discountType = data.discountType === 'FLAT' ? 'FLAT' : 'PERCENT';
    const discountValue = parseFloat(data.discountValue) || 10;
    if (discountValue <= 0) {
      const error = new Error('Discount value must be greater than zero.');
      error.statusCode = 400;
      throw error;
    }
    if (discountType === 'PERCENT' && discountValue > 100) {
      const error = new Error('A percentage discount cannot exceed 100.');
      error.statusCode = 400;
      throw error;
    }
    const expiresAt = data.expiresAt ? new Date(data.expiresAt) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    if (Number.isNaN(expiresAt.getTime())) {
      const error = new Error('Expiry date is invalid.');
      error.statusCode = 400;
      throw error;
    }

    const newCoupon = {
      id: `cpn-${uuidv4().slice(0, 8)}`,
      code,
      description: String(data.description || '').slice(0, 500),
      discountType,
      discountValue,
      minBookingAmount: parseFloat(data.minBookingAmount) || 1000,
      maxDiscountCap: parseFloat(data.maxDiscountCap) || 1000,
      expiresAt: expiresAt.toISOString(),
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      usageCount: 0,
      createdAt: new Date().toISOString()
    };
    db.insert('coupons', newCoupon);
    return newCoupon;
  }

  deleteCoupon(id) {
    return db.delete('coupons', id);
  }
}

module.exports = new CouponService();
