const couponService = require('../services/couponService');

class CouponController {
  async getActiveCoupons(req, res, next) {
    try {
      const coupons = couponService.listActiveCoupons();
      res.status(200).json({ success: true, coupons });
    } catch (err) {
      next(err);
    }
  }

  async validateCoupon(req, res, next) {
    try {
      const { code, amount } = req.body;
      const result = couponService.validateCoupon(code, amount);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async createCoupon(req, res, next) {
    try {
      const coupon = couponService.createCoupon(req.body);
      res.status(201).json({ success: true, message: 'Coupon created.', coupon });
    } catch (err) {
      next(err);
    }
  }

  async deleteCoupon(req, res, next) {
    try {
      const { id } = req.params;
      couponService.deleteCoupon(id);
      res.status(200).json({ success: true, message: 'Coupon deleted.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CouponController();
