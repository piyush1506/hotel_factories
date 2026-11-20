const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const ROLES = require('../constants/roles');
const { pick, httpError } = require('../utils/sanitize');

const ROOM_UPDATE_FIELDS = [
  'name', 'type', 'basePrice', 'originalPrice', 'bedType', 'capacityAdults', 'capacityChildren',
  'sizeSqFt', 'image', 'amenities', 'totalInventory', 'status'
];

class RoomService {
  getRoomsByHotelId(hotelId) {
    return db.find('rooms', (r) => r.hotelId === hotelId);
  }

  getRoomById(roomId) {
    return db.findById('rooms', roomId);
  }

  createRoom(roomData, user) {
    const hotel = db.findById('hotels', roomData.hotelId);
    if (!hotel) throw new Error('Hotel not found.');

    if (user.role !== ROLES.ADMIN && hotel.ownerId !== user.id) {
      throw new Error('Unauthorized to add rooms to this hotel.');
    }

    const newRoom = {
      id: `room-${uuidv4().slice(0, 8)}`,
      hotelId: hotel.id,
      name: roomData.name,
      type: roomData.type || 'Deluxe',
      basePrice: parseFloat(roomData.basePrice) || 3000,
      originalPrice: parseFloat(roomData.originalPrice) || (parseFloat(roomData.basePrice) || 3000) * 1.25,
      bedType: roomData.bedType || '1 King Bed',
      capacityAdults: parseInt(roomData.capacityAdults) || 2,
      capacityChildren: parseInt(roomData.capacityChildren) || 1,
      sizeSqFt: parseInt(roomData.sizeSqFt) || 400,
      image:
        roomData.image ||
        hotel.images[0] ||
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
      amenities: roomData.amenities || ['Free WiFi', 'Air Conditioning', 'Breakfast Included'],
      totalInventory: parseInt(roomData.totalInventory) || 5,
      status: 'AVAILABLE',
      createdAt: new Date().toISOString()
    };

    db.insert('rooms', newRoom);

    // Update hotel starting price if this room is cheaper
    if (newRoom.basePrice < hotel.startingPrice) {
      db.update('hotels', hotel.id, { startingPrice: newRoom.basePrice });
    }

    return newRoom;
  }

  updateRoom(roomId, roomData, user) {
    const room = db.findById('rooms', roomId);
    if (!room) throw httpError('Room not found.', 404);

    const hotel = db.findById('hotels', room.hotelId);
    if (user.role !== ROLES.ADMIN && hotel.ownerId !== user.id) {
      throw httpError('Unauthorized to update this room.', 403);
    }

    const safeUpdates = pick(roomData, ROOM_UPDATE_FIELDS);
    if (safeUpdates.basePrice !== undefined) safeUpdates.basePrice = Number(safeUpdates.basePrice);
    if (safeUpdates.originalPrice !== undefined) safeUpdates.originalPrice = Number(safeUpdates.originalPrice);
    if (safeUpdates.totalInventory !== undefined) safeUpdates.totalInventory = Number(safeUpdates.totalInventory);
    const updated = db.update('rooms', roomId, safeUpdates);

    // Recalculate hotel's starting price
    const hotelRooms = db.find('rooms', (r) => r.hotelId === hotel.id);
    if (hotelRooms.length > 0) {
      const minPrice = Math.min(...hotelRooms.map((r) => r.basePrice));
      db.update('hotels', hotel.id, { startingPrice: minPrice });
    }

    return updated;
  }

  deleteRoom(roomId, user) {
    const room = db.findById('rooms', roomId);
    if (!room) throw new Error('Room not found.');

    const hotel = db.findById('hotels', room.hotelId);
    if (user.role !== ROLES.ADMIN && hotel.ownerId !== user.id) {
      throw new Error('Unauthorized to delete this room.');
    }

    const deleted = db.delete('rooms', roomId);

    // Recalculate hotel starting price
    const remainingRooms = db.find('rooms', (r) => r.hotelId === hotel.id);
    if (remainingRooms.length > 0) {
      const minPrice = Math.min(...remainingRooms.map((r) => r.basePrice));
      db.update('hotels', hotel.id, { startingPrice: minPrice });
    }

    return deleted;
  }
}

module.exports = new RoomService();
