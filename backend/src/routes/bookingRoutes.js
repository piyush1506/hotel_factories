const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken, requireHotelierOrAdmin } = require('../middleware/auth');

router.get('/quote', bookingController.getQuote);
router.post('/unlock-vault', bookingController.unlockVaultPass);
router.get('/unlock-vault', bookingController.unlockVaultPass);
router.get('/verify/:code', bookingController.verifyBookingPublic);
router.post('/hold', verifyToken, bookingController.holdBooking);
router.post('/check-in', verifyToken, requireHotelierOrAdmin, bookingController.checkInGuest);
router.post('/check-out', verifyToken, requireHotelierOrAdmin, bookingController.checkOutGuest);
router.post('/no-show', verifyToken, requireHotelierOrAdmin, bookingController.markNoShow);
router.post('/:id/cancel', verifyToken, bookingController.cancelBooking);
router.get('/my', verifyToken, bookingController.getMyBookings);
router.get('/:id', verifyToken, bookingController.getBookingByIdOrCode);

module.exports = router;
