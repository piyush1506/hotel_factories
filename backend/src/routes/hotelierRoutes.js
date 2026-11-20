const express = require('express');
const router = express.Router();
const hotelierController = require('../controllers/hotelierController');
const { verifyToken, requireHotelierOrAdmin } = require('../middleware/auth');

router.use(verifyToken, requireHotelierOrAdmin);

router.get('/dashboard', hotelierController.getDashboard);
router.get('/hotels', hotelierController.getMyHotels);
router.get('/bookings', hotelierController.getMyBookings);
router.get('/calendar', hotelierController.getInventoryCalendar);
router.put('/bank-details', hotelierController.updateBankDetails);

module.exports = router;
