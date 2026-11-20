const reviewService = require('../services/reviewService');

class ReviewController {
  async getHotelReviews(req, res, next) {
    try {
      const { hotelId } = req.params;
      const reviews = reviewService.getHotelReviews(hotelId);
      res.status(200).json({ success: true, reviews });
    } catch (err) {
      next(err);
    }
  }

  async addReview(req, res, next) {
    try {
      const { hotelId } = req.params;
      const review = reviewService.addReview({
        hotelId,
        userId: req.user.id,
        ...req.body
      });
      res.status(201).json({ success: true, message: 'Review published successfully.', review });
    } catch (err) {
      next(err);
    }
  }

  async replyToReview(req, res, next) {
    try {
      const { reviewId } = req.params;
      const { replyText } = req.body;
      const review = reviewService.replyToReview(reviewId, replyText, req.user);
      res.status(200).json({ success: true, message: 'Hotel response posted.', review });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ReviewController();
