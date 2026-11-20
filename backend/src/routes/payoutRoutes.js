const express = require('express');
const router = express.Router();
const payoutController = require('../controllers/payoutController');
const { verifyToken, requireRole, requireHotelierOrAdmin } = require('../middleware/auth');
const ROLES = require('../constants/roles');

router.get('/overview', verifyToken, requireRole([ROLES.ADMIN]), payoutController.getAdminOverview);
router.post('/execute', verifyToken, requireRole([ROLES.ADMIN]), payoutController.executePayout);
router.get('/hotelier-ledger', verifyToken, requireHotelierOrAdmin, payoutController.getHotelierLedger);

module.exports = router;
