const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const hotelRoutes = require('./hotelRoutes');
const roomRoutes = require('./roomRoutes');
const bookingRoutes = require('./bookingRoutes');
const paymentRoutes = require('./paymentRoutes');
const payoutRoutes = require('./payoutRoutes');
const couponRoutes = require('./couponRoutes');
const reviewRoutes = require('./reviewRoutes');
const adminRoutes = require('./adminRoutes');
const hotelierRoutes = require('./hotelierRoutes');

// Health Check API
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'Hotel Factories Multi-Vendor Booking Engine',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

router.use('/auth', authRoutes);
router.use('/hotels', hotelRoutes);
router.use('/rooms', roomRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/payouts', payoutRoutes);
router.use('/coupons', couponRoutes);
router.use('/reviews', reviewRoutes);
router.use('/admin', adminRoutes);
router.use('/hotelier', hotelierRoutes);

module.exports = router;
