'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { couponLabel, formatDate } from '../utils/helpers';
import { bookingAPI } from '../services/api';
import CustomDatePicker from './CustomDatePicker';
import CustomGuestPicker from './CustomGuestPicker';

export default function BookingSheet() {
  const app = useApp();
  return <BookingSheetContent key={app.activeBookingData?.openedAt || 'closed'} app={app} />;
}

const SPECIAL_REQUEST_OPTIONS = [
  'High Floor',
  'Quiet Room',
  'Early Check-in',
  'Late Check-out',
  'King Bed',
  'Airport Transfer'
];

function BookingSheetContent({ app }) {
  const {
    isBookingSheetOpen, 
    closeAllSheets, 
    activeBookingData, 
    formatPrice, 
    showToast, 
    handleCreateBooking,
    user,
    coupons = [],
    setIsAuthSheetOpen,
    searchParams,
  } = app;

  const { hotel, room } = activeBookingData || {};

  const [checkIn, setCheckIn] = useState(() => {
    if (activeBookingData?.checkIn) return activeBookingData.checkIn;
    const d = new Date(); 
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [checkOut, setCheckOut] = useState(() => {
    if (activeBookingData?.checkOut) return activeBookingData.checkOut;
    const d = new Date(); 
    d.setDate(d.getDate() + 1); 
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [guests, setGuests] = useState(() => {
    const a = Number(searchParams?.adults) || 2;
    const c = Number(searchParams?.childrenCount) || 0;
    const r = Number(searchParams?.rooms) || 1;
    const guestText = `${a} ${a === 1 ? 'Adult' : 'Adults'}${c > 0 ? ` + ${c} ${c === 1 ? 'Child' : 'Children'}` : ''}`;
    return `${guestText} (${r} ${r === 1 ? 'Room' : 'Rooms'})`;
  });
  const [promoCode, setPromoCode] = useState(coupons?.[0]?.code || '');
  const [promoInput, setPromoInput] = useState(coupons?.[0]?.code || '');
  const [quoteResult, setQuoteResult] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  
  const [guestTitle, setGuestTitle] = useState('Mr.');
  const [guestName, setGuestName] = useState(user?.name || '');
  const [guestPhone, setGuestPhone] = useState(user?.phone || '');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [paymentMode, setPaymentMode] = useState('UPI'); // UPI | Card | Hotel
  const [specialRequest, setSpecialRequest] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPromoBox, setShowPromoBox] = useState(false);

  const hotelId = hotel?.id || hotel?._id;
  const roomId = room?.id || room?._id;
  const quoteKey = `${roomId}|${checkIn}|${checkOut}|${promoCode.trim().toUpperCase()}`;

  // Calculate nights
  const nights = useMemo(() => {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    if (!isNaN(d1) && !isNaN(d2) && d2 > d1) {
      const diffTime = Math.abs(d2 - d1);
      return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }
    return 1;
  }, [checkIn, checkOut]);

  // Live price quote fetching
  useEffect(() => {
    if (!roomId || !hotelId || !checkIn || !checkOut || checkOut <= checkIn) return undefined;
    let cancelled = false;
    setIsLoadingQuote(true);

    const timer = window.setTimeout(() => {
      bookingAPI.getQuote({ 
        hotelId, 
        roomId, 
        checkInDate: checkIn, 
        checkOutDate: checkOut, 
        roomsCount: 1, 
        couponCode: promoCode.trim().toUpperCase() || undefined 
      })
        .then((response) => {
          if (!cancelled) {
            setQuoteResult({ key: quoteKey, quote: response.quote });
            setQuoteError('');
          }
        })
        .catch((error) => {
          if (!cancelled) setQuoteError(error.message);
        })
        .finally(() => {
          if (!cancelled) setIsLoadingQuote(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [checkIn, checkOut, hotelId, promoCode, quoteKey, roomId]);

  if (!hotel || !room) return null;

  const roomPrice = Number(room.basePrice ?? room.pricePerNight ?? room.price) || 0;
  const liveQuote = quoteResult?.key === quoteKey ? quoteResult.quote : null;
  const displayNights = liveQuote?.nights || nights;

  // Fallback estimates if quote is loading
  const fallbackBase = roomPrice * displayNights;
  const fallbackGst = Math.round(fallbackBase * 0.12);
  const fallbackConvenience = 99;
  const fallbackTotal = fallbackBase + fallbackGst + fallbackConvenience;

  const totalPayable = liveQuote?.totalPayableByCustomer ?? fallbackTotal;

  const handleApplyPromo = (codeToApply) => {
    const code = (codeToApply || promoInput).trim().toUpperCase();
    const coupon = coupons.find((item) => item.code === code);
    setPromoCode(code);
    setPromoInput(code);
    if (code) {
      showToast(coupon ? `${coupon.code} applied · ${couponLabel(coupon)}` : 'Coupon code applied');
    } else {
      showToast('Coupon removed');
    }
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setPromoInput('');
    showToast('Promo code removed');
  };

  const toggleSpecialRequest = (tag) => {
    setSpecialRequest((prev) => (prev === tag ? '' : tag));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!guestName.trim() || !guestPhone.trim() || !guestEmail.trim()) {
      showToast('Please fill in all guest contact details');
      return;
    }

    setIsSubmitting(true);

    const newBooking = {
      hotelId,
      roomId,
      hotelName: hotel.name,
      hotelCity: hotel.city,
      hotelLocality: hotel.locality || hotel.address,
      hotelImage: room.image || (hotel.images && hotel.images[0]),
      roomName: room.name,
      checkIn,
      checkOut,
      nights: displayNights,
      guests,
      guestCount: { adults: Number.parseInt(guests, 10) || 2, children: 0 },
      guestName: `${guestTitle} ${guestName}`.trim(),
      guestPhone,
      guestEmail,
      paymentMode,
      specialRequest,
      couponCode: promoCode || undefined,
      bookedAt: new Date().toISOString()
    };

    try {
      await handleCreateBooking(newBooking);
    } catch (error) {
      showToast(error.message || 'Could not complete reservation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className={`bottom-sheet ${isBookingSheetOpen ? 'active' : ''} z-[1200] md:!max-w-[620px] rounded-3xl bg-white shadow-2xl border border-slate-100/90 overflow-hidden flex flex-col`}
      role="dialog"
      aria-modal="true"
      aria-label="Confirm Reservation"
    >
      {/* Mobile Drawer Handle */}
      <div className="sheet-handle mx-auto w-10 h-1.5 rounded-full bg-slate-300 mt-2 mb-1 md:hidden"></div>

      {/* Minimal Luxury Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/95 backdrop-blur-md sticky top-0 z-20">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Confirm Reservation</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Instant
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[280px] sm:max-w-md">
            {hotel.name} · {hotel.city}
          </p>
        </div>

        <button 
          type="button"
          onClick={closeAllSheets}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Close booking screen"
        >
          <i className="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>

      {/* Main Scrollable Body */}
      <div className="overflow-y-auto px-5 sm:px-6 py-5 max-h-[calc(90vh-135px)] space-y-5">
        
        {/* Hotel & Room Spotlight Card */}
        <div className="flex gap-4 p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 items-center">
          <img 
            src={room.image || (hotel.images && hotel.images[0])} 
            loading="lazy"
            onError={(e) => { e.currentTarget.src = '/images/hotel-leaf-goa.png'; }}
            className="w-20 h-20 sm:w-22 sm:h-22 rounded-xl object-cover shrink-0 ring-1 ring-slate-900/5 shadow-2xs" 
            alt={room.name} 
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 mb-0.5">
              <span className="text-amber-600 flex items-center gap-1">
                <i className="fa-solid fa-star text-[10px]"></i>
                {Number(hotel.rating || 4.8).toFixed(1)}
              </span>
              <span>·</span>
              <span className="truncate">{hotel.locality || hotel.city}</span>
            </div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate">{room.name}</h3>
            <div className="text-xs text-slate-600 font-medium flex items-center gap-1.5 mt-1">
              <span className="text-slate-900 font-bold">{formatPrice(roomPrice)}</span>
              <span className="text-slate-400">/ night</span>
              <span className="text-slate-300">·</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-semibold">Free WiFi</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Stay Dates & Guests Selector Card */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Trip Itinerary</span>
              <span className="text-xs font-semibold text-slate-400">Tap to edit</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Dates Trigger Box */}
              <div 
                className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all cursor-pointer shadow-2xs relative"
                onClick={() => {
                  setShowDatePicker(!showDatePicker);
                  setShowGuestPicker(false);
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <i className="fa-regular fa-calendar-days text-slate-400"></i> Dates
                  </span>
                  <span className="text-[11px] font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">
                    {displayNights} {displayNights === 1 ? 'Night' : 'Nights'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <div>
                    <div className="text-sm text-slate-900">{formatDate(checkIn, { day: 'numeric', month: 'short' })}</div>
                    <div className="text-[10px] font-normal text-slate-400">{formatDate(checkIn, { weekday: 'short' })}</div>
                  </div>
                  <i className="fa-solid fa-arrow-right text-[10px] text-slate-300 mx-2"></i>
                  <div className="text-right">
                    <div className="text-sm text-slate-900">{formatDate(checkOut, { day: 'numeric', month: 'short' })}</div>
                    <div className="text-[10px] font-normal text-slate-400">{formatDate(checkOut, { weekday: 'short' })}</div>
                  </div>
                </div>

                {/* Inline Date Picker Dropdown */}
                {showDatePicker && (
                  <div 
                    className="absolute left-0 right-0 top-full mt-2 z-50 shadow-2xl rounded-2xl overflow-hidden bg-white border border-slate-100" 
                    onClick={(e) => e.stopPropagation()}
                  >
                    <CustomDatePicker
                      checkInDate={checkIn}
                      checkOutDate={checkOut}
                      isDualMonth={false}
                      onChange={({ checkInDate: newIn, checkOutDate: newOut }) => {
                        setCheckIn(newIn);
                        setCheckOut(newOut);
                      }}
                      onClose={() => setShowDatePicker(false)}
                    />
                  </div>
                )}
              </div>

              {/* Guests Trigger Box */}
              <div className="relative">
                <CustomGuestPicker
                  value={guests}
                  isOpen={showGuestPicker}
                  onToggle={() => {
                    setShowGuestPicker(!showGuestPicker);
                    setShowDatePicker(false);
                  }}
                  onClose={() => setShowGuestPicker(false)}
                  onChange={(newVal) => setGuests(newVal)}
                />
              </div>
            </div>
          </div>

          {/* Primary Guest Details */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Guest Information</span>
              {!user && (
                <button
                  type="button"
                  onClick={() => setIsAuthSheetOpen(true)}
                  className="text-xs font-semibold text-slate-700 hover:text-black underline underline-offset-2 transition-colors cursor-pointer"
                >
                  Sign in for 1-click fill
                </button>
              )}
            </div>

            {/* Guest Name Row */}
            <div className="flex gap-2 items-center">
              <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/60 shrink-0">
                {['Mr.', 'Ms.', 'Mrs.', 'Dr.'].map((title) => (
                  <button
                    key={title}
                    type="button"
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                      guestTitle === title 
                        ? 'bg-white text-slate-900 shadow-2xs font-bold' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    onClick={() => setGuestTitle(title)}
                  >
                    {title}
                  </button>
                ))}
              </div>

              <div className="relative flex-1">
                <input 
                  type="text" 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all" 
                  placeholder="Full name as on Government ID" 
                  required 
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
              </div>
            </div>

            {/* Contact Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Mobile Number</label>
                <div className="relative">
                  <i className="fa-solid fa-phone text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 text-xs"></i>
                  <input 
                    type="tel" 
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all" 
                    placeholder="+91 98765 43210" 
                    required 
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Email for E-Ticket</label>
                <div className="relative">
                  <i className="fa-regular fa-envelope text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 text-xs"></i>
                  <input 
                    type="email" 
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all" 
                    placeholder="name@example.com" 
                    required 
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Special Requests (Minimal Clean Chips) */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Special Preferences</span>
            <div className="flex flex-wrap gap-1.5">
              {SPECIAL_REQUEST_OPTIONS.map((tag) => {
                const isSelected = specialRequest === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleSpecialRequest(tag)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected && <i className="fa-solid fa-check mr-1.5 text-[10px]"></i>}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method Selector (Minimalist Radios) */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Payment Option</span>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button 
                type="button" 
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  paymentMode === 'UPI' 
                    ? 'border-slate-900 bg-slate-900/5 ring-1 ring-slate-900' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
                onClick={() => setPaymentMode('UPI')}
              >
                <div className="flex items-center justify-between">
                  <i className="fa-solid fa-qrcode text-base text-slate-800"></i>
                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${paymentMode === 'UPI' ? 'border-slate-900 bg-slate-900' : 'border-slate-300'}`}>
                    {paymentMode === 'UPI' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 mt-2">UPI & QR</div>
                <div className="text-[10px] text-slate-500">GPay, PhonePe, Paytm</div>
              </button>

              <button 
                type="button" 
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  paymentMode === 'Card' 
                    ? 'border-slate-900 bg-slate-900/5 ring-1 ring-slate-900' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
                onClick={() => setPaymentMode('Card')}
              >
                <div className="flex items-center justify-between">
                  <i className="fa-regular fa-credit-card text-base text-slate-800"></i>
                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${paymentMode === 'Card' ? 'border-slate-900 bg-slate-900' : 'border-slate-300'}`}>
                    {paymentMode === 'Card' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 mt-2">Cards & Net Banking</div>
                <div className="text-[10px] text-slate-500">Visa, Mastercard, RuPay</div>
              </button>
            </div>
          </div>

          {/* Promotion / Coupon Code (Minimal Dropdown / Box) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Offers & Promo</span>
              {!showPromoBox && !promoCode && (
                <button
                  type="button"
                  onClick={() => setShowPromoBox(true)}
                  className="text-xs font-semibold text-slate-700 hover:text-black transition-colors"
                >
                  + Add Promo Code
                </button>
              )}
            </div>

            {promoCode ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/70 text-xs">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-tag text-emerald-600"></i>
                  <span className="font-bold text-emerald-900">{promoCode}</span>
                  <span className="text-emerald-700">· Applied</span>
                </div>
                <button 
                  type="button" 
                  onClick={handleRemovePromo}
                  className="text-emerald-800 hover:text-emerald-950 font-semibold text-[11px] hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              (showPromoBox || coupons.length > 0) && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="flex-1 uppercase tracking-wider px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none" 
                      placeholder="ENTER PROMO CODE" 
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                    />
                    <button 
                      type="button" 
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-black transition-colors" 
                      onClick={() => handleApplyPromo()}
                    >
                      Apply
                    </button>
                  </div>

                  {coupons.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {coupons.map((c) => (
                        <button 
                          key={c.code}
                          type="button"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 transition-colors"
                          onClick={() => handleApplyPromo(c.code)}
                        >
                          <i className="fa-solid fa-ticket text-slate-400 text-[10px]"></i>
                          <span>{c.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          {/* Transparent Ledger Breakdown */}
          <div className="rounded-2xl p-4 bg-slate-50/90 border border-slate-200/70 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Room Tariff ({displayNights} {displayNights === 1 ? 'night' : 'nights'} × {formatPrice(roomPrice)})</span>
              <span className="font-semibold text-slate-900">
                {formatPrice(liveQuote?.totalBaseTariff ?? fallbackBase)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1">
                Taxes & Service GST {liveQuote?.gstRatePercentage ? `(${liveQuote.gstRatePercentage}%)` : '(12%)'}
              </span>
              <span className="font-semibold text-slate-900">
                {formatPrice(liveQuote?.hotelGstAmount ?? fallbackGst)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Platform Service Fee</span>
              <span className="font-semibold text-slate-900">
                {formatPrice(liveQuote ? (liveQuote.platformConvenienceFee + liveQuote.convenienceFeeGst) : fallbackConvenience)}
              </span>
            </div>

            {liveQuote?.discountAmount > 0 && (
              <div className="flex items-center justify-between text-xs font-bold text-emerald-600">
                <span>Offer Discount ({liveQuote.appliedCoupon})</span>
                <span>-{formatPrice(liveQuote.discountAmount)}</span>
              </div>
            )}

            <div className="pt-2.5 border-t border-slate-200/90 flex items-center justify-between text-sm">
              <div>
                <span className="font-bold text-slate-900">Grand Total</span>
                <span className="block text-[10px] text-slate-400 font-normal">All taxes and fees included</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-extrabold text-slate-900 tracking-tight">
                  {formatPrice(totalPayable)}
                </span>
                {isLoadingQuote && (
                  <span className="block text-[10px] text-slate-400">Updating live quote...</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Button & Security Micro-copy */}
          <div className="pt-1 pb-2 space-y-2.5">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-between disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
            >
              <div className="text-left">
                <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Total Payable</div>
                <div className="text-base font-extrabold text-white">{formatPrice(totalPayable)}</div>
              </div>

              <div className="inline-flex items-center gap-2 font-bold text-sm">
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                    <span>Securing Stay...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Pay</span>
                    <i className="fa-solid fa-arrow-right text-xs group-hover:translate-x-1 transition-transform"></i>
                  </>
                )}
              </div>
            </button>

            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <i className="fa-solid fa-shield-halved text-emerald-600"></i> 256-bit Secure
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5">
                <i className="fa-solid fa-clock-rotate-left text-slate-400"></i> Free Cancel 24h
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5">
                <i className="fa-solid fa-bolt text-amber-500"></i> Instant Voucher
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
