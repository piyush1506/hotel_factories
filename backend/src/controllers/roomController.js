const roomService = require('../services/roomService');
const inventoryService = require('../services/inventoryService');

class RoomController {
  async getRoomsByHotel(req, res, next) {
    try {
      const { hotelId } = req.params;
      const rooms = roomService.getRoomsByHotelId(hotelId);
      res.status(200).json({ success: true, rooms });
    } catch (err) {
      next(err);
    }
  }

  async getRoomById(req, res, next) {
    try {
      const { id } = req.params;
      const room = roomService.getRoomById(id);
      if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });
      res.status(200).json({ success: true, room });
    } catch (err) {
      next(err);
    }
  }

  async checkAvailability(req, res, next) {
    try {
      const { roomId, checkInDate, checkOutDate, roomsCount } = req.query;
      if (!roomId || !checkInDate || !checkOutDate) {
        return res.status(400).json({ success: false, message: 'roomId, checkInDate, and checkOutDate are required.' });
      }
      const result = inventoryService.checkAvailability({
        roomId,
        checkInDate,
        checkOutDate,
        roomsCount: parseInt(roomsCount) || 1
      });
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async createRoom(req, res, next) {
    try {
      const room = roomService.createRoom(req.body, req.user);
      res.status(201).json({ success: true, message: 'Room created successfully.', room });
    } catch (err) {
      next(err);
    }
  }

  async updateRoom(req, res, next) {
    try {
      const { id } = req.params;
      const updated = roomService.updateRoom(id, req.body, req.user);
      res.status(200).json({ success: true, message: 'Room updated successfully.', room: updated });
    } catch (err) {
      next(err);
    }
  }

  async deleteRoom(req, res, next) {
    try {
      const { id } = req.params;
      roomService.deleteRoom(id, req.user);
      res.status(200).json({ success: true, message: 'Room deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new RoomController();
