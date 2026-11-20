const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const ROLES = require('../constants/roles');

class ReviewService {
  getHotelReviews(hotelId) {
    return db.find('reviews', (r) => r.hotelId === hotelId);
  }

  addReview({
    hotelId,
    userId,
    rating,
    cleanlinessRating = 5,
    serviceRating = 5,
    locationRating = 5,
    valueRating = 5,
    title,
    comment
  }) {
    const hotel = db.findById('hotels', hotelId);
    if (!hotel) throw new Error('Hotel not found.');

    const completedStay = db.findOne('bookings', (booking) =>
      booking.hotelId === hotelId && booking.userId === userId && booking.status === 'COMPLETED'
    );
    if (!completedStay) {
      const error = new Error('Only guests with a completed stay can review this hotel.');
      error.statusCode = 403;
      throw error;
    }
    const existingReview = db.findOne('reviews', (review) => review.hotelId === hotelId && review.userId === userId);
    if (existingReview) {
      const error = new Error('You have already reviewed this hotel.');
      error.statusCode = 409;
      throw error;
    }
    const parsedRating = Number(rating);
    if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      const error = new Error('Rating must be between 1 and 5.');
      error.statusCode = 400;
      throw error;
    }

    const user = db.findById('users', userId);
    const userName = user ? user.name : 'Verified Guest';
    const userAvatar = user ? user.avatar : 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest';

    const newReview = {
      id: `rev-${uuidv4().slice(0, 8)}`,
      hotelId,
      userId,
      userName,
      userAvatar,
      rating: parsedRating,
      cleanlinessRating: parseFloat(cleanlinessRating) || 5,
      serviceRating: parseFloat(serviceRating) || 5,
      locationRating: parseFloat(locationRating) || 5,
      valueRating: parseFloat(valueRating) || 5,
      title: String(title || 'Great Stay').trim().slice(0, 120),
      comment: String(comment || '').trim().slice(0, 2000),
      stayDate: new Date().toISOString().split('T')[0],
      hotelResponse: null,
      createdAt: new Date().toISOString()
    };

    db.insert('reviews', newReview);

    // Recalculate hotel average rating
    const allHotelReviews = db.find('reviews', (r) => r.hotelId === hotelId);
    const avgRating = allHotelReviews.reduce((sum, r) => sum + r.rating, 0) / allHotelReviews.length;

    db.update('hotels', hotelId, {
      rating: Math.round(avgRating * 10) / 10,
      reviewsCount: allHotelReviews.length
    });

    return newReview;
  }

  replyToReview(reviewId, replyText, user) {
    const review = db.findById('reviews', reviewId);
    if (!review) throw new Error('Review not found.');

    const hotel = db.findById('hotels', review.hotelId);
    if (user.role !== ROLES.ADMIN && hotel.ownerId !== user.id) {
      throw new Error('Unauthorized to reply to this review.');
    }

    return db.update('reviews', reviewId, {
      hotelResponse: replyText,
      respondedAt: new Date().toISOString()
    });
  }
}

module.exports = new ReviewService();
