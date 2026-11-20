const payoutService = require('../services/payoutService');

class PayoutController {
  async getAdminOverview(req, res, next) {
    try {
      const overview = payoutService.getAdminPayoutOverview();
      res.status(200).json({ success: true, ...overview });
    } catch (err) {
      next(err);
    }
  }

  async executePayout(req, res, next) {
    try {
      const { bookingId } = req.body;
      if (!bookingId) {
        return res.status(400).json({ success: false, message: 'bookingId is required.' });
      }
      const payout = payoutService.executePayout(bookingId, req.user);
      res.status(202).json({ success: true, message: 'Hotel payout queued for provider processing.', payout });
    } catch (err) {
      next(err);
    }
  }

  async getHotelierLedger(req, res, next) {
    try {
      const ledger = payoutService.getHotelierFinancialLedger(req.user.id);
      res.status(200).json({ success: true, ...ledger });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PayoutController();
