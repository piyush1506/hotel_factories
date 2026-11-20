'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

export default function DesktopNavbar() {
  const [mounted, setMounted] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const {
    currentScreen,
    switchNav,
    currency,
    toggleCurrency,
    user,
    setIsAuthSheetOpen,
    favorites,
    bookings,
    logout,
  } = useApp();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close user dropdown menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Display name helper: always show real user name, cleanly mapped
  const getDisplayName = (u) => {
    if (!u) return 'My Account';
    const raw = (u.name || '').trim();
    if (!raw) {
      if (u.email) return u.email.split('@')[0];
      return 'My Account';
    }
    // Clean up generic platform seeds
    if (/^platform(\s+admin(istrator)?)?$/i.test(raw)) {
      return u.role === 'admin' ? 'Admin' : 'Administrator';
    }
    // Return first name of personal user
    return raw.split(/\s+/)[0] || raw;
  };

  const displayName = getDisplayName(user);
  const avatarLetter = (displayName.charAt(0) || 'U').toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full bg-white/97 backdrop-blur-md border-b border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-colors">
      {/* 1. Main Navigation Row */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-18 flex items-center justify-between">
        
        {/* Brand Logo - Minimalist Black & White */}
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2.5 cursor-pointer select-none group"
            onClick={() => switchNav('home')}
            aria-label="Hotel Factories Home"
          >
            {/* Brand Sky Blue Badge */}
            <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:bg-sky-600 transition-all duration-200">
              <i className="fa-solid fa-hotel text-white text-sm" />
            </div>
            <div className="flex items-center">
              <span className="text-[21px] font-black tracking-tight text-slate-900 font-sans">
                Hotel <span className="text-sky-500">Factories</span>
              </span>
            </div>
          </button>
        </div>

        {/* Right Action Utilities - Minimal Monochromatic Styling */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Currency Indicator */}
          <div
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-200/90 bg-zinc-50/80 text-xs font-semibold text-zinc-900 select-none hover:bg-zinc-100 transition-colors"
            title="Currency: Indian Rupee (₹)"
          >
            <span>₹ INR</span>
          </div>

          {/* Language / Region: India */}
          <div
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-200/90 bg-zinc-50/80 text-xs font-semibold text-zinc-900 select-none hover:bg-zinc-100 transition-colors"
            title="Region: India"
          >
            <span className="text-xs">🇮🇳</span>
            <span className="text-xs font-bold text-zinc-900">IN <span className="text-zinc-400 font-normal">EN</span></span>
          </div>

          {/* List Your Property Button */}
          <button
            className="hidden md:inline-flex items-center px-3.5 py-1.5 rounded-full hover:bg-zinc-100 text-xs font-medium text-zinc-700 hover:text-black transition-colors cursor-pointer"
            onClick={() => switchNav('admin')}
          >
            List your hotel
          </button>

          {/* Notifications Bell */}
          <button
            className="w-9 h-9 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-700 hover:text-black text-sm transition-colors cursor-pointer"
            aria-label="Notifications"
            onClick={() => {}}
          >
            <i className="fa-regular fa-bell" />
          </button>

          {/* Wishlist Heart */}
          <button
            className="relative w-9 h-9 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-700 hover:text-black text-sm transition-colors cursor-pointer"
            aria-label="Saved properties"
            onClick={() => switchNav('saved')}
          >
            <i className="fa-regular fa-heart" />
            {mounted && favorites?.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                {favorites.length}
              </span>
            )}
          </button>

          {/* Register / Sign in Buttons - Minimalist High Contrast */}
          {mounted && user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border bg-white hover:bg-zinc-50 text-zinc-900 text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                  isUserMenuOpen ? 'border-black ring-1 ring-black/5 bg-zinc-50' : 'border-zinc-200 hover:border-black'
                }`}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-label={`User menu for ${displayName}`}
                aria-expanded={isUserMenuOpen}
              >
                <div className="w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center font-bold">
                  {avatarLetter}
                </div>
                <span className="max-w-[110px] truncate">{displayName}</span>
                {bookings?.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-black text-white text-[9px] font-bold">
                    {bookings.length}
                  </span>
                )}
                <i className={`fa-solid fa-chevron-down text-[9px] text-zinc-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180 text-black' : ''}`} />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-zinc-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* User Profile Header */}
                  <div className="px-4 py-3 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-black text-white text-sm flex items-center justify-center font-bold">
                        {avatarLetter}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-zinc-900 truncate">
                          {user.name && !/^platform/i.test(user.name) ? user.name : (displayName || 'User')}
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate">{user.email}</div>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700">
                          {user.role || 'Guest'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      className="w-full px-4 py-2 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-black flex items-center justify-between transition-colors cursor-pointer"
                      onClick={() => {
                        switchNav('bookings');
                        setIsUserMenuOpen(false);
                      }}
                    >
                      <span className="flex items-center gap-2.5">
                        <i className="fa-solid fa-ticket text-zinc-400 w-4 text-center" />
                        My Trips & Bookings
                      </span>
                      {bookings?.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-black text-white text-[9px] font-bold">
                          {bookings.length}
                        </span>
                      )}
                    </button>

                    <button
                      className="w-full px-4 py-2 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-black flex items-center gap-2.5 transition-colors cursor-pointer"
                      onClick={() => {
                        setIsAuthSheetOpen(true);
                        setIsUserMenuOpen(false);
                      }}
                    >
                      <i className="fa-solid fa-user-pen text-zinc-400 w-4 text-center" />
                      Profile & Edit Name
                    </button>

                    {(user.role === 'admin' || user.role === 'hotel_owner') && (
                      <button
                        className="w-full px-4 py-2 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-black flex items-center gap-2.5 transition-colors cursor-pointer"
                        onClick={() => {
                          switchNav('admin');
                          setIsUserMenuOpen(false);
                        }}
                      >
                        <i className="fa-solid fa-crown text-amber-500 w-4 text-center" />
                        Partner / Admin Portal
                      </button>
                    )}
                  </div>

                  {/* Sign Out */}
                  <div className="border-t border-zinc-100 pt-1 mt-1">
                    <button
                      className="w-full px-4 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                    >
                      <i className="fa-solid fa-right-from-bracket w-4 text-center" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                className="px-4 py-1.5 rounded-full border border-zinc-300 hover:border-black text-xs font-semibold text-zinc-900 hover:bg-zinc-50 transition-all cursor-pointer"
                onClick={() => setIsAuthSheetOpen(true)}
              >
                Register
              </button>
              <button
                className="px-4 py-1.5 rounded-full bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
                onClick={() => setIsAuthSheetOpen(true)}
              >
                Sign in
              </button>
            </div>
          )}

        </div>
      </div>

      {/* 2. Category Navigation Tabs Strip (Hotels Only) */}
      <div className="border-t border-zinc-100 bg-zinc-50/40">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <button
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                currentScreen === 'home' || currentScreen === 'search' || currentScreen === 'detail'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200/80'
              }`}
              onClick={() => switchNav('home')}
            >
              <i className="fa-solid fa-bed text-[12px]" />
              <span>Hotels &amp; Stays</span>
            </button>
            <button
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                currentScreen === 'destinations'
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200/80'
              }`}
              onClick={() => switchNav('destinations')}
            >
              <i className="fa-solid fa-map-location-dot text-[12px]" />
              <span>Service Destinations</span>
            </button>
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-[11px] font-medium text-zinc-700 bg-white px-3 py-1 rounded-full border border-zinc-200/90 shadow-2xs">
            <i className="fa-solid fa-shield-halved text-black text-[10px]" />
            <span>100% Verified Luxury Stays</span>
          </div>
        </div>
      </div>

      {/* 3. Checkout 3-Step Progress Tracker - Minimalist Monochrome */}
      {currentScreen === 'checkout' && (
        <div className="bg-zinc-50/80 border-t border-zinc-200/80 py-2.5">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 flex items-center justify-center gap-6 sm:gap-12 text-xs">
            {/* Step 1 */}
            <div className="flex items-center gap-2 text-zinc-800">
              <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">
                ✓
              </span>
              <span className="font-medium">
                <span className="text-zinc-400 font-semibold mr-1">STEP 1</span>
                Selection
              </span>
            </div>

            <div className="w-8 sm:w-16 h-[1px] bg-zinc-300" />

            {/* Step 2 (ACTIVE) */}
            <div className="flex items-center gap-2 text-black font-bold">
              <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[11px] font-bold shadow-xs">
                2
              </span>
              <span>
                <span className="text-black font-bold mr-1">STEP 2 (ACTIVE)</span>
                Guest &amp; Payment
              </span>
            </div>

            <div className="w-8 sm:w-16 h-[1px] bg-zinc-200" />

            {/* Step 3 */}
            <div className="flex items-center gap-2 text-zinc-400">
              <span className="w-5 h-5 rounded-full border border-zinc-300 text-zinc-400 flex items-center justify-center text-[11px] font-bold">
                3
              </span>
              <span>
                <span className="text-zinc-400 font-medium mr-1">STEP 3</span>
                Confirmation
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
