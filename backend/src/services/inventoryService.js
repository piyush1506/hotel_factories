const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const config = require('../config/env');
const { getDatesInRange } = require('../utils/helpers');
const { BOOKING_STATUS } = require('../constants/bookingStatus');
const logger = require('../utils/logger');

class InventoryService {
  /**
   * Check room availability for a date range
   */
  checkAvailability({ roomId, checkInDate, checkOutDate, roomsCount = 1, excludeLockId = null }) {
    const room = db.findById('rooms', roomId);
    if (!room) throw new Error('Room not found.');

    const dates = getDatesInRange(checkInDate, checkOutDate);
    if (dates.length === 0) throw new Error('Invalid check-in/check-out dates.');

    const now = new Date().toISOString();

    // 1. Get confirmed/active bookings that overlap with requested dates
    const inventoryConsumingStatuses = new Set([
      BOOKING_STATUS.CONFIRMED,
      BOOKING_STATUS.CHECKED_IN,
      BOOKING_STATUS.COMPLETED
    ]);
    const activeBookings = db.find('bookings', (b) => {
      if (b.roomId !== roomId) return false;
      if (!inventoryConsumingStatuses.has(b.status)) return false;

      // Overlap condition: bookingCheckIn < requestedCheckOut AND bookingCheckOut > requestedCheckIn
      return b.checkInDate < checkOutDate && b.checkOutDate > checkInDate;
    });

    // 2. Get active temporary room hold locks
    const activeLocks = db.find('inventoryLocks', (l) => {
      if (l.roomId !== roomId) return false;
      if (excludeLockId && l.id === excludeLockId) return false;
      return l.expiresAt > now && l.checkInDate < checkOutDate && l.checkOutDate > checkInDate;
    });

    // Check day by day availability
    for (const date of dates) {
      // Count booked rooms on this date
      const bookedOnDate = activeBookings.reduce((sum, b) => {
        if (date >= b.checkInDate && date < b.checkOutDate) {
          return sum + (b.roomsCount || 1);
        }
        return sum;
      }, 0);

      // Count locked rooms on this date
      const lockedOnDate = activeLocks.reduce((sum, l) => {
        if (date >= l.checkInDate && date < l.checkOutDate) {
          return sum + (l.roomsCount || 1);
        }
        return sum;
      }, 0);

      const availableCount = room.totalInventory - (bookedOnDate + lockedOnDate);
      if (availableCount < roomsCount) {
        return {
          isAvailable: false,
          availableRooms: Math.max(0, availableCount),
          conflictDate: date,
          totalInventory: room.totalInventory
        };
      }
    }

    return {
      isAvailable: true,
      availableRooms: room.totalInventory,
      totalInventory: room.totalInventory
    };
  }

  /**
   * Lock room inventory for 10 minutes during checkout to prevent double-booking
   */
  lockRoomInventory({ roomId, checkInDate, checkOutDate, roomsCount = 1, userId = null }) {
    const availability = this.checkAvailability({ roomId, checkInDate, checkOutDate, roomsCount });

    if (!availability.isAvailable) {
      throw new Error(
        `Selected room is no longer available for requested dates (${availability.conflictDate}). Available: ${availability.availableRooms}`
      );
    }

    const holdDurationMinutes = config.ROOM_HOLD_DURATION_MINUTES || 10;
    const expiresAt = new Date(Date.now() + holdDurationMinutes * 60 * 1000).toISOString();

    const lock = {
      id: `lock-${uuidv4()}`,
      roomId,
      checkInDate,
      checkOutDate,
      roomsCount,
      userId,
      createdAt: new Date().toISOString(),
      expiresAt
    };

    db.insert('inventoryLocks', lock);
    logger.info(`Acquired room lock: ${lock.id} for Room: ${roomId} (Hold until: ${expiresAt})`);

    return lock;
  }

  /**
   * Release room lock on payment completion or cancellation
   */
  releaseLock(lockId) {
    if (!lockId) return;
    const deleted = db.delete('inventoryLocks', lockId);
    if (deleted) {
      logger.info(`Released room lock: ${lockId}`);
    }
  }

  /**
   * Get hotel inventory calendar for date range
   */
  getHotelInventoryCalendar(hotelId, startDate, endDate) {
    const rooms = db.find('rooms', (r) => r.hotelId === hotelId);
    const dates = getDatesInRange(startDate, endDate);

    return rooms.map((room) => {
      const dateAvailability = dates.map((date) => {
        const nextDay = new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const status = this.checkAvailability({
          roomId: room.id,
          checkInDate: date,
          checkOutDate: nextDay,
          roomsCount: 1
        });
        return {
          date,
          available: status.availableRooms,
          total: room.totalInventory,
          price: room.basePrice
        };
      });

      return {
        roomId: room.id,
        roomName: room.name,
        roomType: room.type,
        calendar: dateAvailability
      };
    });
  }
}

module.exports = new InventoryService();
