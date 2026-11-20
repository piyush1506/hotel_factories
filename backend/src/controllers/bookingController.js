const bookingService = require('../services/bookingService');
const pricingService = require('../services/pricingService');

class BookingController {
  async getQuote(req, res, next) {
    try {
      const { hotelId, roomId, checkInDate, checkOutDate, roomsCount, couponCode } = req.query;
      if (!hotelId || !roomId || !checkInDate || !checkOutDate) {
        return res.status(400).json({
          success: false,
          message: 'hotelId, roomId, checkInDate, and checkOutDate are required.'
        });
      }
      const quote = pricingService.calculateQuote({
        hotelId,
        roomId,
        checkInDate,
        checkOutDate,
        roomsCount: parseInt(roomsCount) || 1,
        couponCode
      });
      res.status(200).json({ success: true, quote });
    } catch (err) {
      next(err);
    }
  }

  async holdBooking(req, res, next) {
    try {
      const { roomId, checkInDate, checkOutDate, roomsCount, guestName, guestEmail, guestPhone, guestCount, specialRequests, couponCode } = req.body;
      if (!roomId || !checkInDate || !checkOutDate || !guestName || !guestPhone) {
        return res.status(400).json({
          success: false,
          message: 'roomId, checkInDate, checkOutDate, guestName, and guestPhone are required.'
        });
      }
      const booking = await bookingService.holdBooking({
        roomId,
        checkInDate,
        checkOutDate,
        roomsCount: parseInt(roomsCount) || 1,
        guestName,
        guestEmail,
        guestPhone,
        guestCount,
        specialRequests,
        couponCode,
        userId: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Room held for 10 minutes. Please complete payment.',
        booking
      });
    } catch (err) {
      next(err);
    }
  }

  async checkInGuest(req, res, next) {
    try {
      const { bookingCode } = req.body;
      if (!bookingCode) {
        return res.status(400).json({ success: false, message: 'bookingCode is required.' });
      }
      const updated = bookingService.checkInGuest(bookingCode, req.user);
      res.status(200).json({
        success: true,
        message: `Guest successfully checked in for booking ${bookingCode}.`,
        booking: updated
      });
    } catch (err) {
      next(err);
    }
  }

  async checkOutGuest(req, res, next) {
    try {
      const { bookingCode } = req.body;
      if (!bookingCode) {
        return res.status(400).json({ success: false, message: 'bookingCode is required.' });
      }
      const updated = bookingService.checkOutGuest(bookingCode, req.user);
      res.status(200).json({
        success: true,
        message: `Guest successfully checked out for booking ${bookingCode}. Stay completed.`,
        booking: updated
      });
    } catch (err) {
      next(err);
    }
  }

  async markNoShow(req, res, next) {
    try {
      const { bookingCode, reason } = req.body;
      if (!bookingCode) {
        return res.status(400).json({ success: false, message: 'bookingCode is required.' });
      }
      const updated = bookingService.markNoShow(bookingCode, req.user, reason);
      res.status(200).json({
        success: true,
        message: `Booking ${bookingCode} marked as No-Show.`,
        booking: updated
      });
    } catch (err) {
      next(err);
    }
  }

  async cancelBooking(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const updated = bookingService.cancelBooking(id, req.user, reason);
      res.status(200).json({
        success: true,
        message: 'Booking reservation cancelled.',
        booking: updated
      });
    } catch (err) {
      next(err);
    }
  }

  async getMyBookings(req, res, next) {
    try {
      const bookings = bookingService.getUserBookings(req.user.id);
      res.status(200).json({ success: true, bookings });
    } catch (err) {
      next(err);
    }
  }

  async getBookingByIdOrCode(req, res, next) {
    try {
      const { id } = req.params;
      let booking = bookingService.getBookingById(id);
      if (!booking) {
        booking = bookingService.getBookingByCode(id);
      }
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found.' });
      }
      const hotel = require('../config/database').findById('hotels', booking.hotelId);
      const canRead = req.user.role === 'admin' || booking.userId === req.user.id || hotel?.ownerId === req.user.id;
      if (!canRead) {
        return res.status(403).json({ success: false, message: 'You are not authorized to view this booking.' });
      }
      res.status(200).json({ success: true, booking });
    } catch (err) {
      next(err);
    }
  }

  async verifyBookingPublic(req, res, next) {
    try {
      const { code } = req.params;
      const signature = req.query.sig || req.query.s || '';
      const verified = bookingService.verifyBookingPass(code, signature);
      if (!verified) {
        return res.status(404).json({ success: false, message: 'Booking verification record not found or code invalid.' });
      }
      res.status(200).json({ success: true, verified });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BookingController();
