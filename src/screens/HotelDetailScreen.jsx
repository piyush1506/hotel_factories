import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PRESET_IMAGES } from '../utils/helpers';
import RoomCard from '../components/RoomCard';

export default function HotelDetailScreen() {
  const { hotels, activeHotelId, switchNav, toggleFavorite, favorites, showToast, openAddRoomForHotel, formatPrice, openBookingSheet } = useApp();

  const hotel = hotels.find(h => h.id === activeHotelId);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [activeHotelId]);

  if (!hotel) {
    return (
      <div className="app-screen" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p>Hotel not found</p>
        <button className="mmt-select-room-btn" onClick={() => switchNav('home')}>Back to Home</button>
      </div>
    );
  }

  const isFav = favorites.includes(hotel.id);
  const images = hotel.images && hotel.images.length > 0 ? hotel.images : [PRESET_IMAGES.palace];
  const activeImage = images[selectedImageIndex] || images[0];
  const firstRoom = (hotel.rooms && hotel.rooms[0]) || null;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: hotel.name, url: window.location.href });
    } else {
      showToast(`Link for "${hotel.name}" copied to clipboard!`);
    }
  };

  const scrollToRooms = () => {
    const el = document.getElementById('roomsListSection');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="app-screen">
      {/* Top Hero Gallery */}
      <div className="mmt-detail-hero">
        <img src={activeImage} alt={hotel.name} />
        
        <div className="mmt-detail-top-nav">
          <button className="detail-nav-btn" onClick={() => switchNav('home')}>
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="detail-nav-btn" onClick={handleShare}>
              <i className="fa-solid fa-share-nodes"></i>
            </button>
            <button 
              className="detail-nav-btn" 
              onClick={() => toggleFavorite(hotel.id)}
            >
              <i 
                className={`${isFav ? 'fa-solid' : 'fa-regular'} fa-heart`} 
                style={isFav ? { color: '#EF4444' } : {}}
              ></i>
            </button>
          </div>
        </div>

        <div className="gallery-counter-badge">
          <i className="fa-solid fa-camera"></i> <span>{selectedImageIndex + 1}</span>/{images.length} Photos
        </div>
      </div>

      {/* Gallery Thumbnails */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '10px 16px', background: 'white', borderBottom: '1px solid var(--app-border)' }}>
        {images.map((img, idx) => (
          <img 
            key={idx}
            src={img} 
            alt={`thumb-${idx}`}
            style={{
              width: '54px', 
              height: '40px', 
              objectFit: 'cover', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              border: `2px solid ${idx === selectedImageIndex ? 'var(--primary)' : 'transparent'}`
            }} 
            onClick={() => setSelectedImageIndex(idx)}
          />
        ))}
      </div>

      {/* Detail Content Body */}
      <div className="mmt-detail-content">
        {/* Main Hotel Info Card */}
        <div className="mmt-detail-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span className="mmt-assured-tag" style={{ position: 'static', padding: '3px 8px' }}>
              <i className="fa-solid fa-shield-halved"></i> MMT ASSURED
            </span>
            <div className="mmt-rating-box">
              <i className="fa-solid fa-star" style={{ fontSize: '0.65rem' }}></i> {hotel.rating} ({hotel.reviewsCount || 1200}+ reviews)
            </div>
          </div>

          <h1 className="mmt-detail-title">{hotel.name}</h1>
          
          <div className="mmt-location-text" style={{ fontSize: '0.8rem' }}>
            <i className="fa-solid fa-location-dot" style={{ color: 'var(--primary)' }}></i>
            <span>{hotel.locality || hotel.address}</span>
          </div>

          {/* Quick Amenities Grid */}
          <div className="mmt-amenity-grid">
            <div className="mmt-amenity-box">
              <i className="fa-solid fa-wifi"></i>
              <span>Free WiFi</span>
            </div>
            <div className="mmt-amenity-box">
              <i className="fa-solid fa-water-ladder"></i>
              <span>Pool</span>
            </div>
            <div className="mmt-amenity-box">
              <i className="fa-solid fa-spa"></i>
              <span>Spa Resort</span>
            </div>
            <div className="mmt-amenity-box">
              <i className="fa-solid fa-utensils"></i>
              <span>Fine Dining</span>
            </div>
          </div>
        </div>

        {/* Hotel Description & Highlights */}
        <div className="mmt-detail-card">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px' }}>Property Highlights</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--app-muted)', lineHeight: '1.5', marginBottom: '10px' }}>
            {hotel.description}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(hotel.highlights || ["MMT Assured Quality", "Free High Speed WiFi", "24/7 Room Service"]).map((h, i) => (
              <div key={i} style={{ fontSize: '0.76rem', color: 'var(--app-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-circle-check" style={{ color: 'var(--mmt-green)', fontSize: '0.8rem' }}></i>
                <span>{h}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Property Policies */}
        <div className="mmt-detail-card">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px' }}>Hotel Policies</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem', background: '#F8FAFC', padding: '10px', borderRadius: '8px' }}>
            <div>
              <span style={{ color: 'var(--app-muted)', display: 'block', fontSize: '0.68rem' }}>CHECK-IN</span>
              <strong>2:00 PM</strong>
            </div>
            <div>
              <span style={{ color: 'var(--app-muted)', display: 'block', fontSize: '0.68rem' }}>CHECK-OUT</span>
              <strong>11:00 AM</strong>
            </div>
            <div>
              <span style={{ color: 'var(--app-muted)', display: 'block', fontSize: '0.68rem' }}>GUEST POLICY</span>
              <strong>Couples & Families Welcome</strong>
            </div>
            <div>
              <span style={{ color: 'var(--app-muted)', display: 'block', fontSize: '0.68rem' }}>ID PROOF</span>
              <strong>Govt ID Required (Aadhaar/Passport)</strong>
            </div>
          </div>
        </div>

        {/* Available Rooms Section */}
        <div id="roomsListSection">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0 10px 0' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1A2B49' }}>Available Room Options</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
              {(hotel.rooms || []).length} Room Types
            </span>
          </div>

          <div>
            {(!hotel.rooms || hotel.rooms.length === 0) ? (
              <div style={{ background: 'white', border: '1px dashed var(--app-border)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--app-muted)', marginBottom: '8px' }}>No rooms configured yet for this property.</p>
                <button className="mmt-select-room-btn" onClick={() => openAddRoomForHotel(hotel.id)}>
                  + Add Room to Property
                </button>
              </div>
            ) : (
              hotel.rooms.map(room => (
                <RoomCard key={room.id} hotel={hotel} room={room} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* MakeMyTrip Sticky Bottom Booking Bar */}
      <div className="mmt-sticky-book-bar">
        <div>
          <span style={{ fontSize: '0.68rem', color: 'var(--app-muted)', display: 'block' }}>Starts from</span>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, color: '#1A2B49' }}>
            {formatPrice(hotel.startingPrice)}
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--app-muted)' }}> / night</span>
        </div>

        <button 
          className="mmt-select-room-btn" 
          style={{ padding: '10px 20px', fontSize: '0.88rem' }}
          onClick={() => {
            if (firstRoom) {
              openBookingSheet(hotel.id, firstRoom.id);
            } else {
              scrollToRooms();
            }
          }}
        >
          Select Room <i className="fa-solid fa-arrow-down" style={{ marginLeft: '4px', fontSize: '0.75rem' }}></i>
        </button>
      </div>
    </div>
  );
}
