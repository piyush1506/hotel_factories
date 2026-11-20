const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken, requireHotelierOrAdmin } = require('../middleware/auth');

router.get('/hotel/:hotelId', reviewController.getHotelReviews);
router.post('/hotel/:hotelId', verifyToken, reviewController.addReview);
router.post('/:reviewId/reply', verifyToken, requireHotelierOrAdmin, reviewController.replyToReview);

module.exports = router;
