const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const rateLimit = require('../middleware/rateLimit');

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15 });

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/google', authLimiter, authController.googleAuth);
router.post('/otp-verify', authLimiter, authController.verifyOtp);
router.get('/me', verifyToken, authController.getMe);
router.put('/profile', verifyToken, authController.updateProfile);

module.exports = router;
