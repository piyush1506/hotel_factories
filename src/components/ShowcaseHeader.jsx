import React from 'react';
import { useApp } from '../context/AppContext';

export default function ShowcaseHeader() {
  const { viewMode, setViewMode, currency, toggleCurrency, switchNav } = useApp();

  return (
    <header className="showcase-header">
      <div className="brand-badge">
        <div className="brand-icon">
          <i className="fa-solid fa-hotel"></i>
        </div>
        <div>
          <div className="brand-title">Hotel<span>Factories</span></div>
          <div className="brand-subtitle">Interactive Mobile App View & Dynamic Manager</div>
        </div>
      </div>

      {/* Device & View Controls */}
      <div className="showcase-controls">
        <button 
          className={`control-btn ${viewMode === 'phone' ? 'active' : ''}`}
          onClick={() => setViewMode('phone')}
        >
          <i className="fa-solid fa-mobile-screen"></i> Phone Shell
        </button>
        <button 
          className={`control-btn ${viewMode === 'full' ? 'active' : ''}`}
          onClick={() => setViewMode('full')}
        >
          <i className="fa-solid fa-expand"></i> Mobile Fullscreen
        </button>
        <button 
          className="control-btn"
          onClick={() => switchNav('admin')}
        >
          <i className="fa-solid fa-plus-circle"></i> Add Hotel / Room
        </button>
        <button 
          className="control-btn"
          onClick={toggleCurrency}
        >
          <i className="fa-solid fa-coins"></i> <span>{currency === 'INR' ? '₹ INR' : '$ USD'}</span>
        </button>
      </div>
    </header>
  );
}
