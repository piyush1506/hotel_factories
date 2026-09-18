import React from 'react';
import { useApp } from '../context/AppContext';
import { PRESET_IMAGES } from '../utils/helpers';

export default function SavedScreen() {
  const { hotels, favorites, toggleFavorite, openHotelDetail, formatPrice, switchNav } = useApp();

  const savedHotels = hotels.filter(h => favorites.includes(h.id));

  return (
    <div className="app-screen">
      <div className="app-header" style={{ borderBottom: '1px solid var(--app-border)' }}>
        <div>
          <div className="section-heading" style={{ fontSize: '1.2rem' }}>Shortlisted Stays</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--app-muted)' }}>{savedHotels.length} properties saved for your next trip</div>
        </div>
      </div>

      <div className="hotels-list" style={{ paddingTop: '14px' }}>
        {savedHotels.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'white', borderRadius: '16px', border: '1px solid var(--app-border)' }}>
            <i className="fa-regular fa-heart" style={{ fontSize: '2.5rem', marginBottom: '12px', color: 'var(--mmt-red)', opacity: 0.4 }}></i>
            <div style={{ fontWeight: 700, color: '#1A2B49', marginBottom: '6px' }}>Your Shortlist is Empty</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--app-muted)' }}>Tap the heart icon on any hotel card to save it for later.</p>
            <button className="mmt-select-room-btn" style={{ margin: '14px auto 0 auto' }} onClick={() => switchNav('home')}>
              Browse Hotels
            </button>
          </div>
        ) : (
          savedHotels.map(hotel => (
            <div key={hotel.id} className="mmt-hotel-card" onClick={() => openHotelDetail(hotel.id)}>
              <div className="mmt-card-image-area" style={{ height: '150px' }}>
                <img src={(hotel.images && hotel.images[0]) || PRESET_IMAGES.palace} alt={hotel.name} />
                <button 
                  className="mmt-fav-btn is-fav" 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(hotel.id);
                  }}
                >
                  <i className="fa-solid fa-heart"></i>
                </button>
              </div>
              <div className="mmt-card-body">
                <div className="mmt-title-row">
                  <h4 className="mmt-hotel-name">{hotel.name}</h4>
                  <div className="mmt-rating-box">
                    <i className="fa-solid fa-star" style={{ fontSize: '0.65rem' }}></i> {hotel.rating}
                  </div>
                </div>
                <div className="mmt-location-text"><i className="fa-solid fa-location-dot"></i> {hotel.locality || hotel.city}</div>
                <div className="mmt-price-section">
                  <span className="mmt-price-main">{formatPrice(hotel.startingPrice)}</span>
                  <button className="mmt-select-room-btn">Book Now</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
