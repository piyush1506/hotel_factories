'use client';

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
    <div 
      className={`bottom-sheet ${isFilterSheetOpen ? 'active' : ''} p-6`}
      role="dialog"
      aria-modal="true"
      aria-label="Filter & Sort"
    >
      <div className="sheet-handle w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 md:hidden"></div>
      <div className="sheet-header flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="sheet-title text-lg font-extrabold text-ink">Filter &amp; Sort</div>
        <button 
          type="button"
          className="sheet-close-btn w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors" 
          onClick={closeAllSheets}
          aria-label="Close filters"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
      
      <div className="sheet-content space-y-5">
        <div className="form-group">
          <label className="form-label block text-xs font-bold text-slate-700 mb-2">Sort Properties By</label>
          <div className="sort-pills-grid grid grid-cols-2 gap-2">
            {[
              { id: 'featured', label: 'Recommended', icon: 'fa-solid fa-award' },
              { id: 'price_low', label: 'Price: Low to High', icon: 'fa-solid fa-arrow-down-short-wide' },
              { id: 'price_high', label: 'Price: High to Low', icon: 'fa-solid fa-arrow-up-wide-short' },
              { id: 'rating', label: 'Top Rated', icon: 'fa-solid fa-star' }
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`sort-pill-btn flex items-center gap-2 p-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${filterSort === opt.id ? 'active bg-brand text-white border-brand' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                onClick={() => setFilterSort(opt.id)}
              >
                <i className={opt.icon} />
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label block text-xs font-bold text-slate-700 mb-2">
            Max Price / Night: <span className="text-brand font-bold">{formatPrice(filterMaxPrice)}</span>
          </label>
          <input 
            type="range" 
            min="3000" 
            max="35000" 
            step="1000" 
            value={filterMaxPrice} 
            className="w-full accent-brand cursor-pointer"
            aria-label="Maximum price per night"
            onChange={(e) => setFilterMaxPrice(Number(e.target.value))} 
          />
        </div>

        <div className="form-group">
          <label className="form-label block text-xs font-bold text-slate-700 mb-2">Minimum Rating</label>
          <div className="preset-pills-row flex items-center gap-2 flex-wrap">
            <button 
              type="button"
              className={`preset-pill px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${filterRating === 0 ? 'active bg-brand text-white border-brand' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'}`} 
              onClick={() => setFilterRating(0)}
            >
              All
            </button>
            <button 
              type="button"
              className={`preset-pill px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${filterRating === 4.5 ? 'active bg-brand text-white border-brand' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'}`} 
              onClick={() => setFilterRating(4.5)}
            >
              4.5+ ⭐
            </button>
            <button 
              type="button"
              className={`preset-pill px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${filterRating === 4.8 ? 'active bg-brand text-white border-brand' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'}`} 
              onClick={() => setFilterRating(4.8)}
            >
              4.8+ ⭐
            </button>
            <button 
              type="button"
              className={`preset-pill px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${filterRating === 4.9 ? 'active bg-brand text-white border-brand' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'}`} 
              onClick={() => setFilterRating(4.9)}
            >
              4.9+ ⭐
            </button>
          </div>
        </div>

        <button 
          type="button"
          className="btn-primary-block w-full py-3 rounded-lg bg-brand hover:bg-brand-hover text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm" 
          onClick={handleApply}
        >
          <i className="fa-solid fa-sliders"></i> Apply Filters
        </button>
      </div>
    </div>
  );
}
