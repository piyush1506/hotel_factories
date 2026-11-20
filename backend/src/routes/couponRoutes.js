const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { verifyToken, requireRole } = require('../middleware/auth');
const ROLES = require('../constants/roles');

router.get('/', couponController.getActiveCoupons);
router.post('/validate', couponController.validateCoupon);
router.post('/', verifyToken, requireRole([ROLES.ADMIN]), couponController.createCoupon);
router.delete('/:id', verifyToken, requireRole([ROLES.ADMIN]), couponController.deleteCoupon);

module.exports = router;
