const paymentService = require('../services/paymentService');

class PaymentController {
  async getConfig(req, res, next) {
    try {
      const configInfo = paymentService.getPublicConfig();
      res.status(200).json({ success: true, ...configInfo });
    } catch (err) {
      next(err);
    }
  }

  async createOrder(req, res, next) {
    try {
      const { bookingId } = req.body;
      if (!bookingId) {
        return res.status(400).json({ success: false, message: 'bookingId is required.' });
      }
      const order = await paymentService.createPaymentOrder({ bookingId, user: req.user });
      res.status(200).json({ success: true, order });
    } catch (err) {
      next(err);
    }
  }

  async verifyPayment(req, res, next) {
    try {
      const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
      if (!bookingId) {
        return res.status(400).json({ success: false, message: 'bookingId is required.' });
      }
      const result = await paymentService.verifyAndConfirmPayment({
        bookingId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        user: req.user
      });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async payAtHotel(req, res, next) {
    try {
      const { bookingId } = req.body;
      if (!bookingId) {
        return res.status(400).json({ success: false, message: 'bookingId is required.' });
      }
      const result = await paymentService.confirmPayAtHotel({
        bookingId,
        user: req.user
      });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async handleWebhook(req, res, next) {
    try {
      const signature = req.headers['x-razorpay-signature'];
      const result = await paymentService.handleWebhook(req.body, signature, req.rawBody);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PaymentController();
