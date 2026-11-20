'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import HotelCard from '../components/HotelCard';

export default function SavedScreen() {
  const { hotels, favorites, switchNav } = useApp();

  const savedHotels = hotels.filter(h => favorites.includes(h.id || h._id));

  return (
    <div className="hf-page-wrapper container max-w-[1360px] mx-auto px-4 sm:px-8 py-6">
      {/* Top Breadcrumbs */}
      <div className="hf-breadcrumb-bar flex items-center gap-2 text-xs text-slate-500 py-3">
        <button className="breadcrumb-link inline-flex items-center gap-1.5 hover:text-brand cursor-pointer" onClick={() => switchNav('home')}>
          <i className="fa-solid fa-house"></i> Home
        </button>
        <span className="breadcrumb-separator text-slate-300">/</span>
        <span className="breadcrumb-current text-slate-700 font-semibold">Saved Properties</span>
      </div>

      <div className="hf-section-head-clean mb-6">
        <div>
          <h1 className="hf-page-title text-2xl font-extrabold text-ink tracking-tight">Shortlisted &amp; Saved Stays</h1>
          <p className="hf-page-subtitle text-xs text-slate-500 mt-1">Your personalized collection of luxury resorts, heritage palaces, and boutique retreats.</p>
        </div>
      </div>

      {/* Grid or Empty state */}
      <div className="hf-saved-content mt-5">
        {savedHotels.length === 0 ? (
          <div className="hf-empty-state-card text-center p-12 bg-white rounded-2xl border border-dashed border-slate-300 my-6 flex flex-col items-center">
            <i className="fa-regular fa-heart empty-icon text-4xl text-rose-500 mb-3"></i>
            <h3 className="text-lg font-bold text-ink mb-1">Your Shortlist is Currently Empty</h3>
            <p className="text-xs text-slate-500 max-w-sm mb-5">Click the heart icon on any hotel card to bookmark properties you love for future trips.</p>
            <button className="hf-search-main-btn inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand text-white font-bold text-xs hover:bg-brand-hover cursor-pointer transition-all" onClick={() => switchNav('home')}>
              <i className="fa-solid fa-compass"></i> Discover Stays
            </button>
          </div>
        ) : (
          <div className="hf-hotel-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {savedHotels.map(hotel => (
              <HotelCard key={hotel.id || hotel._id} hotel={hotel} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
