import React from 'react';
import { useApp } from '../context/AppContext';

export default function FilterSheet() {
  const { 
    isFilterSheetOpen, 
    closeAllSheets, 
    filterSort, 
    setFilterSort, 
    filterMaxPrice, 
    setFilterMaxPrice, 
    filterRating, 
    setFilterRating,
    formatPrice,
    showToast
  } = useApp();

  const handleApply = () => {
    closeAllSheets();
    showToast('Filters applied');
  };

  return (
    <div className={`bottom-sheet ${isFilterSheetOpen ? 'active' : ''}`}>
      <div className="sheet-handle"></div>
      <div className="sheet-header">
        <div className="sheet-title">Filter & Sort</div>
        <button className="sheet-close-btn" onClick={closeAllSheets}>
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
      
      <div className="form-group">
        <label className="form-label">Sort By</label>
        <select 
          className="form-select" 
          value={filterSort} 
          onChange={(e) => setFilterSort(e.target.value)}
        >
          <option value="featured">Featured First</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
          <option value="rating">Top Rated (Highest First)</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">
          Max Price / Night: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{formatPrice(filterMaxPrice)}</span>
        </label>
        <input 
          type="range" 
          min="3000" 
          max="35000" 
          step="1000" 
          value={filterMaxPrice} 
          style={{ width: '100%', accentColor: 'var(--primary)' }}
          onChange={(e) => setFilterMaxPrice(Number(e.target.value))} 
        />
      </div>

      <div className="form-group">
        <label className="form-label">Minimum Rating</label>
        <div className="preset-pills-row">
          <span 
            className={`preset-pill ${filterRating === 0 ? 'active' : ''}`} 
            onClick={() => setFilterRating(0)}
          >
            All
          </span>
          <span 
            className={`preset-pill ${filterRating === 4.5 ? 'active' : ''}`} 
            onClick={() => setFilterRating(4.5)}
          >
            4.5+ ⭐
          </span>
          <span 
            className={`preset-pill ${filterRating === 4.8 ? 'active' : ''}`} 
            onClick={() => setFilterRating(4.8)}
          >
            4.8+ ⭐
          </span>
          <span 
            className={`preset-pill ${filterRating === 4.9 ? 'active' : ''}`} 
            onClick={() => setFilterRating(4.9)}
          >
            4.9+ ⭐
          </span>
        </div>
      </div>

      <button className="btn-primary-block" onClick={handleApply}>
        Apply Filters
      </button>
    </div>
  );
}
