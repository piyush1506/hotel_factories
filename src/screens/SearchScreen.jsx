import React from 'react';
import { useApp } from '../context/AppContext';
import { PRESET_IMAGES } from '../utils/helpers';

export default function SearchScreen() {
  const { hotels, searchQuery, setSearchQuery, resetFilters, openHotelDetail, formatPrice, setIsFilterSheetOpen } = useApp();

  const filtered = hotels.filter(h => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return h.name.toLowerCase().includes(q) ||
           h.city.toLowerCase().includes(q) ||
           (h.locality && h.locality.toLowerCase().includes(q)) ||
           (h.amenities && h.amenities.some(a => a.toLowerCase().includes(q)));
  });

  return (
    <div className="app-screen">
      <div className="app-header" style={{ borderBottom: '1px solid var(--app-border)' }}>
        <div>
          <div className="section-heading" style={{ fontSize: '1.2rem' }}>Search & Discover</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--app-muted)' }}>Find verified hotels across destinations</div>
        </div>
        <button className="icon-btn" onClick={resetFilters} title="Reset">
          <i className="fa-solid fa-rotate-left"></i>
        </button>
      </div>

      <div className="search-wrapper" style={{ paddingTop: '12px' }}>
        <div className="search-box">
          <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--primary)' }}></i>
          <input 
            type="text" 
            placeholder="Search by hotel name, city, or landmark..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button 
            className="filter-trigger-btn" 
            onClick={() => setIsFilterSheetOpen(true)}
            title="Filter"
          >
            <i className="fa-solid fa-sliders"></i>
          </button>
        </div>
      </div>

      <div className="section-title-row">
        <div className="section-heading">
          {searchQuery ? `Search Results (${filtered.length})` : `All Verified Stays (${filtered.length})`}
        </div>
      </div>

      <div className="hotels-list">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'white', borderRadius: '16px', border: '1px solid var(--app-border)' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ fontSize: '2.5rem', marginBottom: '12px', color: 'var(--primary)', opacity: 0.4 }}></i>
            <div style={{ fontWeight: 700, color: '#1A2B49', marginBottom: '6px' }}>No matches found</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--app-muted)' }}>Try searching for "Udaipur", "Goa", "Luxury", or "Pool".</p>
          </div>
        ) : (
          filtered.map(hotel => (
            <div 
              key={hotel.id} 
              className="mmt-hotel-card" 
              onClick={() => openHotelDetail(hotel.id)}
            >
              <div className="mmt-card-image-area" style={{ height: '140px' }}>
                <img src={(hotel.images && hotel.images[0]) || PRESET_IMAGES.palace} alt={hotel.name} />
                {hotel.isMMTAssured && (
                  <div className="mmt-assured-tag">
                    <i className="fa-solid fa-shield-halved"></i> ASSURED
                  </div>
                )}
              </div>
              <div className="mmt-card-body">
                <div className="mmt-title-row">
                  <div>
                    <h4 className="mmt-hotel-name" style={{ fontSize: '0.98rem' }}>{hotel.name}</h4>
                    <div className="mmt-location-text">{hotel.locality || hotel.city}</div>
                  </div>
                  <div className="mmt-rating-box">
                    <i className="fa-solid fa-star" style={{ fontSize: '0.65rem' }}></i> {hotel.rating}
                  </div>
                </div>

                <div className="mmt-price-section">
                  <div>
                    <span className="mmt-price-main" style={{ fontSize: '1.1rem' }}>{formatPrice(hotel.startingPrice)}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--app-muted)' }}> / night</span>
                  </div>
                  <button className="mmt-select-room-btn" style={{ padding: '6px 14px', fontSize: '0.75rem' }}>
                    View Stay
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
