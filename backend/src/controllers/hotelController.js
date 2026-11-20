const hotelService = require('../services/hotelService');

class HotelController {
  async getAllHotels(req, res, next) {
    try {
      const result = hotelService.getAllHotels(req.query);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getHotelByIdOrSlug(req, res, next) {
    try {
      const { id } = req.params;
      let hotel = hotelService.getHotelById(id);
      if (!hotel) {
        hotel = hotelService.getHotelBySlug(id);
      }
      if (!hotel) {
        return res.status(404).json({ success: false, message: 'Hotel property not found.' });
      }
      res.status(200).json({ success: true, hotel });
    } catch (err) {
      next(err);
    }
  }

  async getCities(req, res, next) {
    try {
      const cities = hotelService.getCities();
      res.status(200).json({ success: true, cities });
    } catch (err) {
      next(err);
    }
  }

  async getCategories(req, res, next) {
    try {
      const categories = hotelService.getCategories();
      res.status(200).json({ success: true, categories });
    } catch (err) {
      next(err);
    }
  }

  async createHotel(req, res, next) {
    try {
      const hotel = hotelService.createHotel(req.body, req.user.id);
      res.status(201).json({ success: true, message: 'Hotel created successfully.', hotel });
    } catch (err) {
      next(err);
    }
  }

  async updateHotel(req, res, next) {
    try {
      const { id } = req.params;
      const updated = hotelService.updateHotel(id, req.body, req.user);
      res.status(200).json({ success: true, message: 'Hotel updated successfully.', hotel: updated });
    } catch (err) {
      next(err);
    }
  }

  async deleteHotel(req, res, next) {
    try {
      const { id } = req.params;
      hotelService.deleteHotel(id, req.user);
      res.status(200).json({ success: true, message: 'Hotel deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new HotelController();
