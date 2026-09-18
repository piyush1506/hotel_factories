import React from 'react';
import { useApp } from '../context/AppContext';
import { PRESET_IMAGES } from '../utils/helpers';

export default function HotelCard({ hotel }) {
  const { openHotelDetail, toggleFavorite, favorites, formatPrice } = useApp();

  const isFav = favorites.includes(hotel.id);
  const coverImage = (hotel.images && hotel.images[0]) || PRESET_IMAGES.palace;
  const taxesApprox = Math.round(hotel.startingPrice * 0.12);

  return (
    <div className="mmt-hotel-card" onClick={() => openHotelDetail(hotel.id)}>
      {/* Image Area */}
      <div className="mmt-card-image-area">
        <img src={coverImage} alt={hotel.name} loading="lazy" />
        
        {hotel.isMMTAssured && (
          <div className="mmt-assured-tag">
            <i className="fa-solid fa-shield-halved"></i> MMT ASSURED
          </div>
        )}

        <button 
          className={`mmt-fav-btn ${isFav ? 'is-fav' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(hotel.id);
          }}
          title="Shortlist"
        >
          <i className={`${isFav ? 'fa-solid' : 'fa-regular'} fa-heart`}></i>
        </button>
      </div>

      {/* Body */}
      <div className="mmt-card-body">
        <div className="mmt-title-row">
          <div>
            <h3 className="mmt-hotel-name">{hotel.name}</h3>
            <div className="mmt-location-text">
              <i className="fa-solid fa-location-dot" style={{ color: 'var(--primary)' }}></i>
              <span>{hotel.locality || hotel.city} · {hotel.distance || 'Prime Location'}</span>
            </div>
          </div>
          <div className="mmt-rating-box">
            <i className="fa-solid fa-star" style={{ fontSize: '0.65rem' }}></i> {hotel.rating}
          </div>
        </div>

        {/* Feature Tags */}
        <div className="mmt-tags-row">
          {hotel.freeCancellation && (
            <span className="mmt-tag-green">
              <i className="fa-solid fa-check"></i> Free Cancellation
            </span>
          )}
          {hotel.breakfastIncluded && (
            <span className="mmt-tag-blue">
              <i className="fa-solid fa-utensils"></i> Free Breakfast
            </span>
          )}
          {hotel.coupleFriendly && (
            <span className="mmt-tag-blue">
              <i className="fa-solid fa-user-group"></i> Couple Friendly
            </span>
          )}
        </div>

        {/* Price Section */}
        <div className="mmt-price-section">
          <div className="mmt-price-left">
            {hotel.originalPrice && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="mmt-price-strike">{formatPrice(hotel.originalPrice)}</span>
                <span style={{ color: 'var(--mmt-green)', fontWeight: 700, fontSize: '0.72rem' }}>
                  {hotel.discountPercent || 20}% OFF
                </span>
              </div>
            )}
            <div>
              <span className="mmt-price-main">{formatPrice(hotel.startingPrice)}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--app-muted)' }}> / night</span>
            </div>
            <span className="mmt-price-taxes">+ {formatPrice(taxesApprox)} taxes & fees</span>
          </div>

          <button 
            className="mmt-select-room-btn"
            onClick={(e) => {
              e.stopPropagation();
              openHotelDetail(hotel.id);
            }}
          >
            Select Room <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }}></i>
          </button>
        </div>
      </div>
    </div>
  );
}
