const analyticsService = require('../services/analyticsService');
const hotelService = require('../services/hotelService');
const inventoryService = require('../services/inventoryService');
const db = require('../config/database');
const ROLES = require('../constants/roles');

class HotelierController {
  async getDashboard(req, res, next) {
    try {
      const stats = analyticsService.getHotelierMetrics(req.user.id);
      res.status(200).json({ success: true, ...stats });
    } catch (err) {
      next(err);
    }
  }

  async getMyHotels(req, res, next) {
    try {
      const hotels = hotelService.getHotelsByOwner(req.user.id);
      res.status(200).json({ success: true, hotels });
    } catch (err) {
      next(err);
    }
  }

  async getMyBookings(req, res, next) {
    try {
      const ownerHotels = db.find('hotels', (h) => h.ownerId === req.user.id);
      const hotelIds = ownerHotels.map((h) => h.id);
      const bookings = db.find('bookings', (b) => hotelIds.includes(b.hotelId));
      res.status(200).json({ success: true, bookings });
    } catch (err) {
      next(err);
    }
  }

  async getInventoryCalendar(req, res, next) {
    try {
      const { hotelId, startDate, endDate } = req.query;
      if (!hotelId || !startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'hotelId, startDate, and endDate are required.' });
      }

      const hotel = db.findById('hotels', hotelId);
      if (!hotel || (req.user.role !== ROLES.ADMIN && hotel.ownerId !== req.user.id)) {
        return res.status(403).json({ success: false, message: 'Unauthorized to access this hotel calendar.' });
      }

      const calendar = inventoryService.getHotelInventoryCalendar(hotelId, startDate, endDate);
      res.status(200).json({ success: true, calendar });
    } catch (err) {
      next(err);
    }
  }

  async updateBankDetails(req, res, next) {
    try {
      const { hotelId, bankAccount } = req.body;
      if (!hotelId || !bankAccount) {
        return res.status(400).json({ success: false, message: 'hotelId and bankAccount are required.' });
      }

      const hotel = db.findById('hotels', hotelId);
      if (!hotel || (req.user.role !== ROLES.ADMIN && hotel.ownerId !== req.user.id)) {
        return res.status(403).json({ success: false, message: 'Unauthorized.' });
      }

      const accountNumber = String(bankAccount.accountNumber || '').replace(/\s/g, '');
      const ifscCode = String(bankAccount.ifscCode || '').trim().toUpperCase();
      const accountHolderName = String(bankAccount.accountHolderName || '').trim();
      if (!/^\d{9,18}$/.test(accountNumber) || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode) || accountHolderName.length < 2) {
        return res.status(400).json({ success: false, message: 'Valid account holder, account number, and IFSC code are required.' });
      }

      const updated = db.update('hotels', hotelId, { bankAccount: { accountHolderName, accountNumber, ifscCode, bankName: String(bankAccount.bankName || '').trim() } });
      res.status(200).json({ success: true, message: 'Bank details updated for payout settlement.', hotel: updated });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new HotelierController();
