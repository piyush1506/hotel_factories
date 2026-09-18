import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MMT_COUPONS } from '../data/hotels';

export default function BookingSheet() {
  const { 
    isBookingSheetOpen, 
    closeAllSheets, 
    activeBookingData, 
    formatPrice, 
    showToast, 
    handleCreateBooking 
  } = useApp();

  const { hotel, room } = activeBookingData;

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2 Adults');
  const [promoCode, setPromoCode] = useState('MMT20');
  const [promoDiscount, setPromoDiscount] = useState(0.20);
  const [guestTitle, setGuestTitle] = useState('Mr.');
  const [guestName, setGuestName] = useState('Rahul Sharma');
  const [guestPhone, setGuestPhone] = useState('+91 98765 43210');
  const [guestEmail, setGuestEmail] = useState('rahul.sharma@example.com');
  const [paymentMode, setPaymentMode] = useState('UPI'); // UPI | Card | Hotel
  const [specialRequest, setSpecialRequest] = useState('High Floor Room');

  useEffect(() => {
    if (activeBookingData.checkIn) {
      setCheckIn(activeBookingData.checkIn);
    }
    if (activeBookingData.checkOut) {
      setCheckOut(activeBookingData.checkOut);
    }
    setPromoDiscount(0.20);
    setPromoCode('MMT20');
  }, [activeBookingData]);

  if (!hotel || !room) return null;

  // Calculate bill
  let nights = 1;
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  if (!isNaN(d1) && !isNaN(d2) && d2 > d1) {
    const diffTime = Math.abs(d2 - d1);
    nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  if (nights < 1) nights = 1;

  const baseRate = room.price * nights;
  const taxes = Math.round(baseRate * 0.12);
  let discount = 0;
  if (promoDiscount > 0) {
    discount = Math.round(baseRate * promoDiscount);
  }
  const grandTotal = Math.max(0, baseRate + taxes - discount);

  const applyPromo = (codeToApply) => {
    const code = (codeToApply || promoCode).trim().toUpperCase();
    if (code === 'MMT20') {
      setPromoDiscount(0.20);
      setPromoCode('MMT20');
      showToast('🎉 Coupon MMT20 Applied: Flat 20% OFF!');
    } else if (code === 'LUXURY25') {
      setPromoDiscount(0.25);
      setPromoCode('LUXURY25');
      showToast('🎉 Coupon LUXURY25 Applied: Flat 25% OFF!');
    } else if (code === 'WELCOME500') {
      setPromoDiscount(0.15);
      setPromoCode('WELCOME500');
      showToast('🎉 Coupon WELCOME500 Applied: 15% OFF!');
    } else if (code === '') {
      setPromoDiscount(0);
    } else {
      showToast('Invalid promo code. Try MMT20');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!guestName || !guestPhone || !guestEmail) {
      showToast('Please provide guest details');
      return;
    }

    const bookingId = "MMT-HTL-" + Math.floor(100000 + Math.random() * 900000);
    const newBooking = {
      id: bookingId,
      hotelId: hotel.id,
      hotelName: hotel.name,
      hotelCity: hotel.city,
      hotelLocality: hotel.locality || hotel.address,
      hotelImage: room.image || (hotel.images && hotel.images[0]),
      roomName: room.name,
      checkIn,
      checkOut,
      nights,
      guests,
      guestName: `${guestTitle} ${guestName}`.trim(),
      guestPhone,
      guestEmail,
      paymentMode,
      specialRequest,
      totalAmount: grandTotal,
      status: 'Confirmed',
      bookedAt: new Date().toISOString()
    };

    handleCreateBooking(newBooking);
  };

  return (
    <div className={`bottom-sheet ${isBookingSheetOpen ? 'active' : ''}`}>
      <div className="sheet-handle"></div>
      
      <div className="sheet-header">
        <div>
          <div className="sheet-title">Review & Instant Book</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--mmt-green)', fontWeight: 600 }}>
            <i className="fa-solid fa-bolt"></i> Instant Confirmation with Hotel
          </div>
        </div>
        <button className="sheet-close-btn" onClick={closeAllSheets}>
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>

      {/* Hotel & Room Pill */}
      <div className="booking-summary-pill">
        <img 
          src={room.image || (hotel.images && hotel.images[0])} 
          className="booking-summary-img" 
          alt={room.name} 
        />
        <div>
          <div className="booking-hotel-name">{hotel.name}</div>
          <div className="booking-room-name">{room.name}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--app-muted)' }}>
            {formatPrice(room.price)} / night · {hotel.city}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Dates & Guests */}
        <div className="form-row-2">
          <div className="form-group">
            <label className="form-label">Check-in *</label>
            <input 
              type="date" 
              className="form-input" 
              required 
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Check-out *</label>
            <input 
              type="date" 
              className="form-input" 
              required 
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)} 
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Guests Configuration</label>
          <select 
            className="form-select" 
            value={guests} 
            onChange={(e) => setGuests(e.target.value)}
          >
            <option value="1 Adult">1 Adult (1 Room)</option>
            <option value="2 Adults">2 Adults (1 Room)</option>
            <option value="2 Adults, 1 Child">2 Adults, 1 Child (1 Room)</option>
            <option value="3 Adults">3 Adults (1 Room)</option>
            <option value="4 Adults">4 Adults (2 Rooms)</option>
          </select>
        </div>

        {/* Lead Guest Info */}
        <div className="form-group">
          <label className="form-label">Lead Guest Name *</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <select 
              className="form-select" 
              style={{ width: '80px' }} 
              value={guestTitle}
              onChange={(e) => setGuestTitle(e.target.value)}
            >
              <option value="Mr.">Mr.</option>
              <option value="Ms.">Ms.</option>
              <option value="Mrs.">Mrs.</option>
            </select>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Full Name" 
              required 
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
            />
          </div>
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label className="form-label">Mobile Number *</label>
            <input 
              type="tel" 
              className="form-input" 
              placeholder="+91 98765 43210" 
              required 
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email for E-Ticket *</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="rahul@example.com" 
              required 
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
            />
          </div>
        </div>

        {/* MMT Coupon Code Engine */}
        <div className="form-group">
          <label className="form-label">Apply Promo Code</label>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. MMT20" 
              style={{ textTransform: 'uppercase' }}
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
            />
            <button 
              type="button" 
              className="mmt-select-room-btn" 
              style={{ padding: '0 14px', fontSize: '0.8rem' }}
              onClick={() => applyPromo()}
            >
              Apply
            </button>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {MMT_COUPONS.map(c => (
              <span 
                key={c.code}
                className={`mmt-cat-pill ${promoCode === c.code ? 'active' : ''}`}
                style={{ padding: '3px 8px', fontSize: '0.68rem', cursor: 'pointer' }}
                onClick={() => applyPromo(c.code)}
              >
                🏷️ {c.code} ({c.discount * 100}%)
              </span>
            ))}
          </div>
        </div>

        {/* Payment Mode Selector */}
        <div className="form-group">
          <label className="form-label">Payment Mode</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
            <button 
              type="button" 
              className={`mmt-cat-pill ${paymentMode === 'UPI' ? 'active' : ''}`}
              style={{ justifyContent: 'center', padding: '8px 4px' }}
              onClick={() => setPaymentMode('UPI')}
            >
              <i className="fa-solid fa-mobile-screen"></i> UPI / GPay
            </button>
            <button 
              type="button" 
              className={`mmt-cat-pill ${paymentMode === 'Card' ? 'active' : ''}`}
              style={{ justifyContent: 'center', padding: '8px 4px' }}
              onClick={() => setPaymentMode('Card')}
            >
              <i className="fa-solid fa-credit-card"></i> Cards / Net
            </button>
            <button 
              type="button" 
              className={`mmt-cat-pill ${paymentMode === 'Hotel' ? 'active' : ''}`}
              style={{ justifyContent: 'center', padding: '8px 4px' }}
              onClick={() => setPaymentMode('Hotel')}
            >
              <i className="fa-solid fa-hand-holding-dollar"></i> Pay @ Hotel
            </button>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="mmt-bill-card">
          <div className="mmt-bill-row">
            <span>Base Fare ({nights} {nights === 1 ? 'Night' : 'Nights'})</span>
            <span>{formatPrice(baseRate)}</span>
          </div>
          <div className="mmt-bill-row">
            <span>Hotel GST & Service Tax (12%)</span>
            <span>{formatPrice(taxes)}</span>
          </div>
          {promoDiscount > 0 && (
            <div className="mmt-bill-row" style={{ color: 'var(--mmt-green)', fontWeight: 700 }}>
              <span>Coupon Discount ({promoDiscount * 100}%)</span>
              <span>-{formatPrice(discount)}</span>
            </div>
          )}
          <div className="mmt-bill-row total">
            <span>Grand Total</span>
            <span>{formatPrice(grandTotal)}</span>
          </div>
        </div>

        <button type="submit" className="btn-primary-block">
          <i className="fa-solid fa-lock" style={{ marginRight: '6px' }}></i> Pay & Confirm Reservation
        </button>
      </form>
    </div>
  );
}
