import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PRESET_IMAGES } from '../utils/helpers';

export default function BookingsScreen() {
  const { bookings, formatPrice, openVoucherSheet, switchNav, showToast } = useApp();
  const [tripTab, setTripTab] = useState('upcoming'); // upcoming | completed

  return (
    <div className="app-screen">
      <div className="app-header" style={{ borderBottom: '1px solid var(--app-border)' }}>
        <div>
          <div className="section-heading" style={{ fontSize: '1.2rem' }}>My Trips & Bookings</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--app-muted)' }}>Manage reservations & digital vouchers</div>
        </div>
        <button className="icon-btn" onClick={() => showToast('Trips refreshed')} title="Refresh">
          <i className="fa-solid fa-rotate-right"></i>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'white', borderBottom: '1px solid var(--app-border)', padding: '0 18px' }}>
        <button 
          className={`admin-tab-btn ${tripTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setTripTab('upcoming')}
        >
          Upcoming ({bookings.length})
        </button>
        <button 
          className={`admin-tab-btn ${tripTab === 'completed' ? 'active' : ''}`}
          onClick={() => setTripTab('completed')}
        >
          Completed (0)
        </button>
      </div>

      <div style={{ padding: '16px 18px' }}>
        {bookings.length === 0 || tripTab === 'completed' ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'white', borderRadius: '16px', border: '1px solid var(--app-border)' }}>
            <i className="fa-solid fa-plane-departure" style={{ fontSize: '2.5rem', marginBottom: '12px', color: 'var(--primary)', opacity: 0.4 }}></i>
            <div style={{ fontWeight: 700, color: '#1A2B49', marginBottom: '6px' }}>No trips found</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--app-muted)' }}>You have no {tripTab} bookings right now.</p>
            <button className="mmt-select-room-btn" style={{ margin: '14px auto 0 auto' }} onClick={() => switchNav('home')}>
              Explore Hotels
            </button>
          </div>
        ) : (
          bookings.map(b => (
            <div 
              key={b.id} 
              style={{
                background: 'white', 
                border: '1px solid var(--app-border)', 
                borderRadius: '16px', 
                padding: '14px', 
                marginBottom: '14px', 
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--primary)' }}>{b.id}</span>
                <span style={{ background: 'var(--mmt-green-light)', color: 'var(--mmt-green)', fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                  <i className="fa-solid fa-circle-check" style={{ marginRight: '3px' }}></i> {b.status}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                <img 
                  src={b.hotelImage || PRESET_IMAGES.palace} 
                  style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} 
                  alt={b.hotelName} 
                />
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1A2B49', lineHeight: '1.2' }}>{b.hotelName}</h4>
                  <div style={{ fontSize: '0.76rem', color: 'var(--primary)', fontWeight: 600 }}>{b.roomName}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--app-muted)' }}>
                    📅 {b.checkIn} to {b.checkOut} ({b.nights} {b.nights === 1 ? 'Night' : 'Nights'})
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--app-border)', paddingTop: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--app-muted)' }}>Paid Total</span>
                  <div style={{ fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#1A2B49', fontSize: '1.05rem' }}>
                    {formatPrice(b.totalAmount)}
                  </div>
                </div>
                <button 
                  className="mmt-select-room-btn" 
                  style={{ padding: '6px 14px', fontSize: '0.76rem' }}
                  onClick={() => openVoucherSheet(b)}
                >
                  <i className="fa-solid fa-qrcode" style={{ marginRight: '4px' }}></i> View E-Ticket
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
