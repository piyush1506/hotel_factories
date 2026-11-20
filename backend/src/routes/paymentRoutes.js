const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');

router.get('/config', paymentController.getConfig);
router.post('/order', verifyToken, paymentController.createOrder);
router.post('/verify', verifyToken, paymentController.verifyPayment);
router.post('/pay-at-hotel', verifyToken, paymentController.payAtHotel);
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;
