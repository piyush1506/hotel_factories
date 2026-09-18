import React from 'react';
import { useApp } from '../context/AppContext';
import { PRESET_IMAGES } from '../utils/helpers';

export default function RoomCard({ hotel, room }) {
  const { formatPrice, openBookingSheet } = useApp();

  const roomImg = room.image || (hotel.images && hotel.images[0]) || PRESET_IMAGES.suite;
  const taxesApprox = Math.round(room.price * 0.12);

  return (
    <div className="mmt-room-card">
      <div className="mmt-room-image-bar">
        <img src={roomImg} alt={room.name} loading="lazy" />
        <div className="room-type-badge">{room.type || 'Deluxe Room'}</div>
      </div>

      <div className="mmt-room-body">
        <h4 className="mmt-room-title">{room.name}</h4>
        
        <div className="mmt-room-features">
          <span><i className="fa-solid fa-bed"></i> {room.bedType || '1 King Bed'}</span>
          <span>•</span>
          <span><i className="fa-solid fa-user-group"></i> {room.capacity || '2 Adults'}</span>
          <span>•</span>
          <span><i className="fa-solid fa-vector-square"></i> {room.size || '450 sq ft'}</span>
        </div>

        {/* Meal Plan Inclusion */}
        <div className="mmt-room-mealplan">
          <i className="fa-solid fa-utensils" style={{ marginRight: '5px' }}></i>
          {room.mealPlan || 'Complimentary Breakfast Included'}
        </div>

        {/* Cancellation Policy */}
        <div style={{ fontSize: '0.72rem', color: 'var(--mmt-green)', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <i className="fa-solid fa-circle-check"></i>
          {room.cancellationPolicy || 'Free Cancellation Available'}
        </div>

        {/* Amenities List */}
        <div className="room-amenities-list">
          {(room.amenities || []).slice(0, 3).map((amenity, idx) => (
            <span key={idx} className="room-amenity-tag">{amenity}</span>
          ))}
        </div>

        {/* Price & Action */}
        <div className="room-action-row">
          <div>
            {room.originalPrice && (
              <span className="room-original-price">{formatPrice(room.originalPrice)}</span>
            )}
            <div className="room-current-price">
              {formatPrice(room.price)} <small style={{ fontSize: '0.65rem', color: 'var(--app-muted)' }}>/ night</small>
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--app-muted)' }}>+ {formatPrice(taxesApprox)} taxes</div>
          </div>

          <button 
            className="mmt-select-room-btn"
            onClick={() => openBookingSheet(hotel.id, room.id)}
          >
            Book Room
          </button>
        </div>
      </div>
    </div>
  );
}
