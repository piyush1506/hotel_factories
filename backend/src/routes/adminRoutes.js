const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/auth');
const ROLES = require('../constants/roles');

router.use(verifyToken, requireRole([ROLES.ADMIN]));

router.get('/metrics', adminController.getDashboardOverview);
router.get('/hotels', adminController.getAllHotels);
router.put('/hotels/:id/commission', adminController.updateHotelCommission);
router.put('/hotels/:id/verify', adminController.verifyHotel);
router.put('/hotels/:id/flags', adminController.updateHotelFlags);
router.get('/bookings', adminController.getAllBookings);
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.get('/coupons', adminController.getAllCoupons);
router.post('/coupons', adminController.createCoupon);
router.put('/coupons/:id', adminController.updateCoupon);
router.delete('/coupons/:id', adminController.deleteCoupon);
router.get('/reviews', adminController.getAllReviews);
router.post('/refunds/:id/process', adminController.processRefund);
router.post('/reset-seed', adminController.resetSeedData);

module.exports = router;
