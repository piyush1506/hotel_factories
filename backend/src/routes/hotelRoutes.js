const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const { verifyToken, requireHotelierOrAdmin } = require('../middleware/auth');

router.get('/', hotelController.getAllHotels);
router.get('/cities', hotelController.getCities);
router.get('/categories', hotelController.getCategories);
router.get('/:id', hotelController.getHotelByIdOrSlug);

router.post('/', verifyToken, requireHotelierOrAdmin, hotelController.createHotel);
router.put('/:id', verifyToken, requireHotelierOrAdmin, hotelController.updateHotel);
router.delete('/:id', verifyToken, requireHotelierOrAdmin, hotelController.deleteHotel);

module.exports = router;
