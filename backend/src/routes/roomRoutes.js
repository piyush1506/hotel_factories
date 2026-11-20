const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { verifyToken, requireHotelierOrAdmin } = require('../middleware/auth');

router.get('/hotel/:hotelId', roomController.getRoomsByHotel);
router.get('/availability', roomController.checkAvailability);
router.get('/:id', roomController.getRoomById);

router.post('/', verifyToken, requireHotelierOrAdmin, roomController.createRoom);
router.put('/:id', verifyToken, requireHotelierOrAdmin, roomController.updateRoom);
router.delete('/:id', verifyToken, requireHotelierOrAdmin, roomController.deleteRoom);

module.exports = router;
