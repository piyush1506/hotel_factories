import React from 'react';
import { useApp } from '../context/AppContext';
import HotelCard from '../components/HotelCard';
import { MMT_COUPONS } from '../data/hotels';

export default function HomeScreen() {
  const { 
    hotels, 
    favorites, 
    selectedCategory, 
    setSelectedCategory, 
    searchQuery, 
    setSearchQuery,
    filterRating, 
    filterMaxPrice, 
    filterSort, 
    selectedDestination, 
    cycleDestination, 
    switchNav, 
    setIsFilterSheetOpen, 
    currency,
    toggleCurrency,
    showToast,
    resetFilters
  } = useApp();

  // Filter hotels
  const filtered = hotels.filter(h => {
    if (selectedCategory !== 'All' && h.category !== selectedCategory) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = h.name.toLowerCase().includes(q) ||
                    h.city.toLowerCase().includes(q) ||
                    (h.locality && h.locality.toLowerCase().includes(q)) ||
                    (h.amenities && h.amenities.some(a => a.toLowerCase().includes(q)));
      if (!match) return false;
    }
    if (filterRating > 0 && h.rating < filterRating) {
      return false;
    }
    if (h.startingPrice > filterMaxPrice) {
      return false;
    }
    return true;
  });

  // Sort
  if (filterSort === 'price_low') {
    filtered.sort((a, b) => a.startingPrice - b.startingPrice);
  } else if (filterSort === 'price_high') {
    filtered.sort((a, b) => b.startingPrice - a.startingPrice);
  } else if (filterSort === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  }

  const categories = [
    { name: 'All', icon: 'fa-hotel' },
    { name: 'Luxury Stays', icon: 'fa-crown' },
    { name: 'Beachfront', icon: 'fa-umbrella-beach' },
    { name: 'Mountain Escapes', icon: 'fa-mountain-sun' },
    { name: 'City Center', icon: 'fa-city' }
  ];

  return (
    <div className="app-screen">
      {/* MakeMyTrip Top Hero Gradient Header */}
      <div className="mmt-hero-header">
        <div className="mmt-header-top">
          <div className="mmt-brand-area">
            <div className="mmt-brand-logo">
              Hotel<span>Factories</span>
            </div>
            <div className="mmt-badge-assured">
              <i className="fa-solid fa-check-double"></i> MMT ASSURED
            </div>
          </div>

          <div className="mmt-header-actions">
            <button className="mmt-header-btn" onClick={toggleCurrency}>
              <i className="fa-solid fa-coins" style={{ color: '#FFD54F' }}></i>
              <span>{currency === 'INR' ? '₹ INR' : '$ USD'}</span>
            </button>
            <button className="mmt-icon-btn" onClick={() => switchNav('saved')} title="Shortlist">
              <i className="fa-regular fa-heart"></i>
              {favorites.length > 0 && <span className="mmt-icon-badge"></span>}
            </button>
            <button 
              className="mmt-icon-btn" 
              onClick={() => showToast('🎉 Limited Deal: Flat 20% OFF with code MMT20!')} 
              title="Alerts"
            >
              <i className="fa-regular fa-bell"></i>
            </button>
          </div>
        </div>

        {/* Floating Search & Location Card */}
        <div className="mmt-search-card">
          <div className="mmt-dest-bar" onClick={cycleDestination}>
            <span className="mmt-dest-label">
              <i className="fa-solid fa-location-dot"></i> {selectedDestination}
            </span>
            <span className="mmt-dates-label">
              Tap to change city <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }}></i>
            </span>
          </div>

          <div className="mmt-search-row">
            <div className="mmt-search-input-box">
              <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--primary)' }}></i>
              <input 
                type="text" 
                placeholder="Search hotels, landmark, locality..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              className="mmt-filter-btn" 
              onClick={() => setIsFilterSheetOpen(true)}
              title="Filters"
            >
              <i className="fa-solid fa-sliders"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Category Scrollable Filter Pills */}
      <div className="mmt-category-scroll">
        {categories.map(cat => (
          <div 
            key={cat.name} 
            className={`mmt-cat-pill ${selectedCategory === cat.name ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.name)}
          >
            <i className={`fa-solid ${cat.icon}`}></i> {cat.name}
          </div>
        ))}
      </div>

      {/* Instant Bank Deals Strip */}
      <div className="mmt-offers-strip">
        <div className="mmt-offer-card">
          <div>
            <span className="mmt-offer-badge">Bank Special</span>
            <div className="mmt-offer-text">Flat 20% Instant Discount</div>
            <div className="mmt-offer-sub">Use coupon code <strong>MMT20</strong> at booking</div>
          </div>
          <button 
            className="mmt-copy-btn"
            onClick={() => {
              navigator.clipboard?.writeText("MMT20");
              showToast("Coupon MMT20 copied to clipboard!");
            }}
          >
            Copy Code
          </button>
        </div>
      </div>

      {/* Section Header */}
      <div className="section-title-row">
        <div>
          <div className="section-heading">Verified Stays & Resorts</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--app-muted)' }}>
            Showing {filtered.length} curated luxury properties
          </div>
        </div>
        <span className="see-all-link" onClick={() => switchNav('admin')}>+ List Hotel</span>
      </div>

      {/* Hotels List */}
      <div className="hotels-list">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'white', borderRadius: '16px', margin: '0 18px', border: '1px solid var(--app-border)' }}>
            <i className="fa-solid fa-hotel" style={{ fontSize: '2.5rem', marginBottom: '12px', color: 'var(--mmt-blue)', opacity: 0.4 }}></i>
            <div style={{ fontWeight: 700, color: '#1A2B49', marginBottom: '6px' }}>No properties found</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--app-muted)' }}>Try adjusting your filters or destination keywords.</p>
            <button 
              className="mmt-select-room-btn" 
              style={{ margin: '14px auto 0 auto' }} 
              onClick={resetFilters}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filtered.map(hotel => (
            <HotelCard key={hotel.id} hotel={hotel} />
          ))
        )}
      </div>
    </div>
  );
}
