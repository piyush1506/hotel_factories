const analyticsService = require('../services/analyticsService');
const bookingService = require('../services/bookingService');
const hotelService = require('../services/hotelService');
const couponService = require('../services/couponService');
const paymentService = require('../services/paymentService');
const db = require('../config/database');
const ROLES = require('../constants/roles');

class AdminController {
  async getDashboardOverview(req, res, next) {
    try {
      const metrics = analyticsService.getAdminMetrics();
      res.status(200).json({ success: true, ...metrics });
    } catch (err) {
      next(err);
    }
  }

  async getAllHotels(req, res, next) {
    try {
      const hotels = db.find('hotels').map((h) => {
        const rooms = db.find('rooms', (r) => r.hotelId === h.id);
        const bookings = db.find('bookings', (b) => b.hotelId === h.id);
        return {
          ...h,
          roomsCount: rooms.length,
          bookingsCount: bookings.length
        };
      });
      res.status(200).json({ success: true, hotels });
    } catch (err) {
      next(err);
    }
  }

  async updateHotelCommission(req, res, next) {
    try {
      const { id } = req.params;
      const { commissionRate } = req.body;
      if (commissionRate === undefined) {
        return res.status(400).json({ success: false, message: 'commissionRate is required.' });
      }
      const parsedRate = Number(commissionRate);
      if (!Number.isFinite(parsedRate) || parsedRate < 0 || parsedRate > 40) {
        return res.status(400).json({ success: false, message: 'commissionRate must be between 0 and 40.' });
      }
      const updated = db.update('hotels', id, { commissionRate: parsedRate });
      if (!updated) return res.status(404).json({ success: false, message: 'Hotel not found.' });
      res.status(200).json({
        success: true,
        message: `Commission rate updated to ${parsedRate}% for ${updated.name}.`,
        hotel: updated
      });
    } catch (err) {
      next(err);
    }
  }

  async verifyHotel(req, res, next) {
    try {
      const { id } = req.params;
      const { isVerified, verificationStatus } = req.body;
      const allowedStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
      if (verificationStatus && !allowedStatuses.includes(verificationStatus)) {
        return res.status(400).json({ success: false, message: 'Invalid verification status.' });
      }
      const updated = db.update('hotels', id, {
        isVerified: isVerified !== undefined ? isVerified : true,
        verificationStatus: verificationStatus || 'APPROVED'
      });
      if (!updated) return res.status(404).json({ success: false, message: 'Hotel not found.' });
      res.status(200).json({
        success: true,
        message: `Hotel verification status updated to ${updated.verificationStatus}.`,
        hotel: updated
      });
    } catch (err) {
      next(err);
    }
  }

  async updateHotelFlags(req, res, next) {
    try {
      const { id } = req.params;
      const { featured, status } = req.body;
      const allowedStatuses = ['ACTIVE', 'SUSPENDED', 'INACTIVE'];
      const updates = {};

      if (featured !== undefined) updates.featured = Boolean(featured);
      if (status !== undefined) {
        if (!allowedStatuses.includes(status)) {
          return res.status(400).json({ success: false, message: 'Invalid property status.' });
        }
        updates.status = status;
      }
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, message: 'No property flags were provided.' });
      }

      const updated = db.update('hotels', id, updates);
      if (!updated) return res.status(404).json({ success: false, message: 'Hotel not found.' });
      return res.status(200).json({ success: true, message: 'Property settings updated.', hotel: updated });
    } catch (err) {
      return next(err);
    }
  }

  async getAllCoupons(req, res, next) {
    try {
      const coupons = couponService.listAllCoupons();
      res.status(200).json({ success: true, coupons });
    } catch (err) {
      next(err);
    }
  }

  async createCoupon(req, res, next) {
    try {
      if (!req.body.code) {
        return res.status(400).json({ success: false, message: 'Coupon code is required.' });
      }
      const coupon = couponService.createCoupon(req.body);
      return res.status(201).json({ success: true, message: 'Coupon created.', coupon });
    } catch (err) {
      return next(err);
    }
  }

  async updateCoupon(req, res, next) {
    try {
      const updated = couponService.updateCoupon(req.params.id, req.body);
      res.status(200).json({ success: true, message: 'Coupon updated.', coupon: updated });
    } catch (err) {
      next(err);
    }
  }

  async deleteCoupon(req, res, next) {
    try {
      const { id } = req.params;
      const coupon = db.findById('coupons', id);
      if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });
      couponService.deleteCoupon(id);
      return res.status(200).json({ success: true, message: 'Coupon deleted.' });
    } catch (err) {
      return next(err);
    }
  }

  async getAllReviews(req, res, next) {
    try {
      const hotels = db.find('hotels');
      const hotelMap = Object.fromEntries(hotels.map((hotel) => [hotel.id, hotel]));
      const reviews = db.find('reviews').map((review) => {
        const hotel = hotelMap[review.hotelId];
        return {
          ...review,
          hotelName: hotel?.name || 'Unknown property',
          hotelCity: hotel?.city || '',
          hotelImage: hotel?.images?.[0] || ''
        };
      }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      res.status(200).json({ success: true, reviews });
    } catch (err) {
      next(err);
    }
  }

  async getAllBookings(req, res, next) {
    try {
      const bookings = bookingService.getAdminAllBookings();
      res.status(200).json({ success: true, bookings });
    } catch (err) {
      next(err);
    }
  }

  async getAllUsers(req, res, next) {
    try {
      const users = db.find('users').map((u) => {
        const safe = { ...u };
        delete safe.password;
        return safe;
      });
      res.status(200).json({ success: true, users });
    } catch (err) {
      next(err);
    }
  }

  async updateUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      if (!Object.values(ROLES).includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role.' });
      }
      if (id === req.user.id && role !== ROLES.ADMIN) {
        return res.status(409).json({ success: false, message: 'You cannot remove your own admin access.' });
      }
      const updated = db.update('users', id, { role });
      if (!updated) return res.status(404).json({ success: false, message: 'User not found.' });
      const safe = { ...updated };
      delete safe.password;
      return res.status(200).json({ success: true, message: 'User role updated.', user: safe });
    } catch (err) {
      return next(err);
    }
  }

  async processRefund(req, res, next) {
    try {
      const { id } = req.params;
      const { action = 'APPROVE', note } = req.body || {};
      const booking = db.findById('bookings', id);
      if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

      if (action === 'REJECT') {
        const updated = db.update('bookings', id, {
          refundStatus: 'REJECTED',
          refundNotes: note || 'Refund claim reviewed and rejected by platform administrator.',
          refundProcessedAt: new Date().toISOString()
        });
        return res.status(200).json({ success: true, message: 'Refund marked as rejected.', booking: updated });
      }

      // Default: APPROVE
      const refundAmount = Number(booking.refundAmount) || Number(booking.totalAmount) || 0;
      const refundResult = await paymentService.processRefund({ booking, refundAmount, note });
      const updated = db.update('bookings', id, {
        status: 'REFUNDED',
        paymentStatus: 'REFUNDED',
        refundStatus: 'REFUNDED',
        refundAmount,
        refundNotes: note || 'Refund successfully issued and settled to original payment method.',
        refundProcessedAt: new Date().toISOString(),
        refundTxnId: refundResult.refundId
      });

      return res.status(200).json({
        success: true,
        message: `Refund of ₹${refundAmount.toLocaleString('en-IN')} processed successfully for ${booking.bookingCode}.`,
        booking: updated
      });
    } catch (err) {
      return next(err);
    }
  }

  async resetSeedData(req, res, next) {
    try {
      db.resetSeed();
      res.status(200).json({ success: true, message: 'Database reset to seed defaults successfully.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminController();
