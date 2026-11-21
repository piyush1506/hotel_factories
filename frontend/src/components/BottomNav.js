'use client';

import React from 'react';
import { useApp } from '../context/AppContext';

export default function BottomNav() {
  const { currentScreen, switchNav, bookings } = useApp();

  // Hide floating mobile navigation bar on checkout to keep complete payment unobstructed
  if (currentScreen === 'checkout') return null;

  const navItems = [
    { id: 'home', label: 'Explore', icon: 'fa-solid fa-compass' },
    { id: 'search', label: 'Search', icon: 'fa-solid fa-magnifying-glass' },
    { id: 'bookings', label: 'Bookings', icon: 'fa-solid fa-ticket', badge: bookings?.length || 0 },
    { id: 'saved', label: 'Wishlist', icon: 'fa-solid fa-heart' },
    { id: 'admin', label: 'Partner', icon: 'fa-solid fa-crown' },
  ];

  return (
    <nav 
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between w-[94%] max-w-[380px] h-14 p-1.5 rounded-full bg-white/95 backdrop-blur-md border border-zinc-200/90 shadow-xl shadow-black/8 md:hidden transition-all duration-200"
      aria-label="Mobile Navigation"
    >
      {navItems.map((item) => {
        const isActive = currentScreen === item.id || (item.id === 'home' && currentScreen === 'detail');
        return (
          <button
            key={item.id}
            type="button"
            className={`relative flex flex-col items-center justify-center flex-1 h-full py-1.5 px-2 rounded-full transition-all duration-200 cursor-pointer ${
              isActive
                ? 'text-white bg-black font-semibold shadow-xs'
                : 'text-zinc-500 hover:text-black hover:bg-zinc-100/70 transition-colors'
            }`}
            onClick={() => switchNav(item.id)}
            aria-label={item.badge > 0 ? `${item.label} (${item.badge})` : item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="relative flex items-center justify-center">
              <i className={`${item.icon} text-sm transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
              {item.badge > 0 && (
                <span className={`absolute -top-1 -right-3 min-w-4 h-4 px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center leading-none ${
                  isActive ? 'bg-white text-black' : 'bg-black text-white'
                }`} aria-hidden="true">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 leading-none">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
