import React from 'react';
import { useApp } from '../context/AppContext';

export default function BottomNav() {
  const { currentScreen, switchNav, bookings } = useApp();

  return (
    <nav className="bottom-nav">
      <button 
        className={`nav-item ${currentScreen === 'home' || currentScreen === 'detail' ? 'active' : ''}`}
        onClick={() => switchNav('home')}
      >
        <i className="fa-solid fa-compass"></i>
        <span>Explore</span>
      </button>

      <button 
        className={`nav-item ${currentScreen === 'search' ? 'active' : ''}`}
        onClick={() => switchNav('search')}
      >
        <i className="fa-solid fa-magnifying-glass"></i>
        <span>Search</span>
      </button>

      <button 
        className={`nav-item nav-badge ${currentScreen === 'bookings' ? 'active' : ''}`}
        onClick={() => switchNav('bookings')}
      >
        <i className="fa-solid fa-calendar-check"></i>
        {bookings.length > 0 && <span className="badge-dot"></span>}
        <span>Bookings</span>
      </button>

      <button 
        className={`nav-item ${currentScreen === 'saved' ? 'active' : ''}`}
        onClick={() => switchNav('saved')}
      >
        <i className="fa-solid fa-heart"></i>
        <span>Saved</span>
      </button>

      <button 
        className={`nav-item ${currentScreen === 'admin' ? 'active' : ''}`}
        onClick={() => switchNav('admin')}
      >
        <i className="fa-solid fa-sliders"></i>
        <span>Manager</span>
      </button>
    </nav>
  );
}
