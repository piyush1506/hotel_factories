import React from 'react';
import { useApp } from '../context/AppContext';

export default function VoucherSheet() {
  const { isVoucherSheetOpen, closeAllSheets, activeVoucherBooking, formatPrice, switchNav, showToast } = useApp();

  if (!activeVoucherBooking) return null;

  const b = activeVoucherBooking;

  const handleShareVoucher = () => {
    if (navigator.share) {
      navigator.share({
        title: `Hotel Booking Voucher - ${b.id}`,
        text: `Confirmed booking for ${b.hotelName} (${b.checkIn} to ${b.checkOut}). Booking ID: ${b.id}`,
        url: window.location.href
      });
    } else {
      showToast("Voucher details copied to clipboard!");
    }
  };

  return (
    <div className={`bottom-sheet ${isVoucherSheetOpen ? 'active' : ''}`}>
      <div className="sheet-handle"></div>
      
      <div style={{ textAlign: 'center', marginBottom: '14px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          background: 'var(--mmt-green-light)',
          color: 'var(--mmt-green)',
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.4rem',
          marginBottom: '6px'
        }}>
          <i className="fa-solid fa-circle-check"></i>
        </div>
        <div className="sheet-title" style={{ color: 'var(--mmt-green)', fontSize: '1.15rem' }}>
          Booking Confirmed & Guaranteed!
        </div>
        <p style={{ fontSize: '0.74rem', color: 'var(--app-muted)' }}>
          Reservation confirmed with hotel front desk. E-ticket sent to your email.
        </p>
      </div>

      {/* MakeMyTrip E-Ticket Card */}
      <div className="ticket-card">
        <div className="ticket-header">
          <div>
            <div className="ticket-brand">HOTEL FACTORIES</div>
            <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600 }}>MMT OFFICIAL E-TICKET</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.62rem', color: '#64748B', fontWeight: 700 }}>BOOKING ID</div>
            <div style={{ fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--primary)', fontSize: '0.95rem' }}>
              {b.id}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1A2B49', marginBottom: '2px' }}>
            {b.hotelName}
          </h3>
          <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>
            {b.roomName}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--app-muted)' }}>
            <i className="fa-solid fa-location-dot"></i> {b.hotelLocality || b.hotelCity}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          fontSize: '0.74rem',
          background: '#F8FAFC',
          padding: '10px 12px',
          borderRadius: '8px',
          border: '1px solid var(--app-border)'
        }}>
          <div>
            <span style={{ color: 'var(--app-muted)', display: 'block', fontSize: '0.65rem' }}>CHECK-IN (2 PM)</span>
            <strong>{b.checkIn}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--app-muted)', display: 'block', fontSize: '0.65rem' }}>CHECK-OUT (11 AM)</span>
            <strong>{b.checkOut}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--app-muted)', display: 'block', fontSize: '0.65rem' }}>PRIMARY GUEST</span>
            <strong>{b.guestName}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--app-muted)', display: 'block', fontSize: '0.65rem' }}>AMOUNT PAID</span>
            <strong style={{ color: 'var(--primary)' }}>{formatPrice(b.totalAmount)}</strong>
          </div>
        </div>

        {/* QR Section */}
        <div className="ticket-qr-section">
          <div className="qr-code-img">
            <i className="fa-solid fa-qrcode"></i>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--app-muted)', textAlign: 'center' }}>
            Scan at front desk for instant contactless check-in
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          className="mmt-select-room-btn" 
          style={{ flex: 1, background: '#F0F6FF', color: 'var(--primary)', border: '1px solid var(--app-border)' }}
          onClick={handleShareVoucher}
        >
          <i className="fa-solid fa-share-nodes"></i> Share Voucher
        </button>
        <button 
          className="mmt-select-room-btn" 
          style={{ flex: 1 }}
          onClick={() => {
            closeAllSheets();
            switchNav('bookings');
          }}
        >
          View in My Trips
        </button>
      </div>
    </div>
  );
}
