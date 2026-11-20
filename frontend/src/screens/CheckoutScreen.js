'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { bookingAPI } from '../services/api';
import { getDefaultDates, formatDate, PRESET_IMAGES } from '../utils/helpers';

function splitName(fullName = '') {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: '', last: '' };
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

export default function CheckoutScreen() {
  const {
    activeBookingData,
    formatPrice,
    showToast,
    handleCreateBooking,
    user,
    switchNav,
    searchParams,
    setIsAuthSheetOpen,
    coupons = [],
  } = useApp();

  // Selected hotel and room from context
  const hotel = activeBookingData?.hotel;
  const room = activeBookingData?.room;

  const hotelImage = hotel?.image || hotel?.coverImage || (hotel?.images && hotel.images[0]) || PRESET_IMAGES.palace;

  // Dynamic Dates & length of stay
  const defaultDates = useMemo(() => getDefaultDates(), []);
  const checkInDate = activeBookingData?.checkIn || activeBookingData?.room?.checkInDate || searchParams?.checkInDate || defaultDates.checkIn;
  const checkOutDate = activeBookingData?.checkOut || activeBookingData?.room?.checkOutDate || searchParams?.checkOutDate || defaultDates.checkOut;
  const roomsCount = Number(room?.roomsCount || searchParams?.rooms || 1);

  const nights = useMemo(() => {
    try {
      const d1 = new Date(checkInDate + 'T00:00:00');
      const d2 = new Date(checkOutDate + 'T00:00:00');
      const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : (activeBookingData?.room?.nights || 1);
    } catch {
      return activeBookingData?.room?.nights || 1;
    }
  }, [checkInDate, checkOutDate, activeBookingData]);

  // Lead Guest details state (initialized dynamically from authenticated user)
  const initialName = useMemo(() => splitName(user?.name), [user?.name]);
  const [isMainGuest, setIsMainGuest] = useState(true);
  const [firstName, setFirstName] = useState(initialName.first);
  const [lastName, setLastName] = useState(initialName.last);
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone ? String(user.phone).replace(/^\+91\s*/, '') : '');
  const [countryCode, setCountryCode] = useState('+91 (IN)');

  // Sync if user signs in or profile is fetched asynchronously
  useEffect(() => {
    if (user) {
      const { first, last } = splitName(user.name);
      setFirstName((prev) => prev || first);
      setLastName((prev) => prev || last);
      setEmail((prev) => prev || user.email || '');
      if (user.phone) {
        setPhone((prev) => prev || String(user.phone).replace(/^\+91\s*/, ''));
      }
    }
  }, [user]);

  // Dynamic Room preferences state
  const [beddingType, setBeddingType] = useState(room?.bedType || '1 King Bed');
  const smokingPolicy = room?.smokingPolicy || hotel?.policies?.smoking || '100% Non-Smoking';
  const defaultEstCheckIn = hotel?.checkInTime ? `${hotel.checkInTime} – ${parseInt(hotel.checkInTime) + 1 || 15}:00` : '14:00 – 15:00';
  const [estCheckIn, setEstCheckIn] = useState(defaultEstCheckIn);
  const [specialRequests, setSpecialRequests] = useState('');

  // Payment method state ('razorpay' | 'hotel')
  const [paymentTab, setPaymentTab] = useState('razorpay');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Promo / Coupon & Live Server Quote
  const [promoCode, setPromoCode] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [quote, setQuote] = useState(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [showPromoInput, setShowPromoInput] = useState(false);

  useEffect(() => {
    if (!hotel?.id || !room?.id || !checkInDate || !checkOutDate) return;
    let active = true;
    setIsQuoteLoading(true);

    bookingAPI.getQuote({
      hotelId: hotel.id,
      roomId: room.id,
      checkInDate,
      checkOutDate,
      roomsCount,
      couponCode: promoCode ? promoCode.trim().toUpperCase() : undefined,
    })
      .then((res) => {
        if (active && res?.quote) {
          setQuote(res.quote);
          setPromoError('');
        }
      })
      .catch((err) => {
        if (active && promoCode) {
          setPromoError(err?.message || 'Coupon could not be applied.');
        }
      })
      .finally(() => {
        if (active) setIsQuoteLoading(false);
      });

    return () => {
      active = false;
    };
  }, [hotel?.id, room?.id, checkInDate, checkOutDate, roomsCount, promoCode]);

  // Dynamic Price calculations in INR (₹)
  const unitPricePerNight = Number(room?.basePrice ?? room?.pricePerNight ?? room?.price ?? hotel?.startingPrice ?? 0);
  const fallbackBase = unitPricePerNight * nights * roomsCount;
  const basePrice = quote ? Number(quote.totalBaseTariff ?? quote.baseAmount ?? fallbackBase) : fallbackBase;
  const taxes = quote ? Number((Number(quote.hotelGstAmount || 0) + Number(quote.convenienceFeeGst || 0)) || quote.taxes || Math.round(basePrice * 0.12)) : Math.round(basePrice * 0.12);
  const discount = quote ? Number(quote.discountAmount || 0) : 0;
  const convenienceFee = quote ? Number(quote.platformConvenienceFee ?? quote.convenienceFee ?? 0) : 0;
  const totalPrice = quote ? Number(quote.totalPayableByCustomer ?? quote.finalAmount ?? Math.max(0, basePrice + taxes + convenienceFee - discount)) : Math.max(0, Number((basePrice + taxes + convenienceFee - discount).toFixed(2)));
  const rewardPoints = Math.max(50, Math.round(totalPrice * 0.05));

  const handleApplyCoupon = (e) => {
    if (e) e.preventDefault();
    const clean = promoInput.trim().toUpperCase();
    if (!clean) return;
    setPromoCode(clean);
  };

  const handleRemoveCoupon = () => {
    setPromoCode('');
    setPromoInput('');
    setPromoError('');
  };

  const handleCompleteBooking = async (e) => {
    if (e) e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      showToast('Please enter all required guest details.');
      return;
    }

    setIsSubmitting(true);
    try {
      const combinedSpecialRequests = [
        beddingType ? `Bed: ${beddingType}` : '',
        estCheckIn ? `Est Arrival: ${estCheckIn}` : '',
        specialRequests.trim()
      ].filter(Boolean).join(' · ');

      const bookingPayload = {
        roomId: room.id,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        roomsCount: roomsCount,
        guestName: `${firstName.trim()} ${lastName.trim()}`,
        guestEmail: email.trim(),
        guestPhone: phone.trim() ? `${countryCode} ${phone.trim()}` : (user?.phone || ''),
        guestCount: Number(searchParams?.adults || 2),
        specialRequest: combinedSpecialRequests,
        paymentMode: paymentTab === 'hotel' ? 'hotel' : 'razorpay',
        couponCode: promoCode ? promoCode.trim().toUpperCase() : undefined,
      };

      await handleCreateBooking(bookingPayload);
    } catch (err) {
      showToast(err?.message || 'Failed to complete booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hotel || !room) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center text-2xl mx-auto mb-4">
          <i className="fa-solid fa-hotel" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">No Active Booking</h2>
        <p className="text-sm text-slate-500 mb-6">
          Please select a hotel room to proceed to checkout.
        </p>
        <button
          onClick={() => switchNav('home')}
          className="px-6 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold transition-all cursor-pointer"
        >
          Explore Hotels
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#f8fafc] text-slate-900 pb-20">
      
      {/* Main Container */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 pt-6">
        
        {/* Dynamic Top Banner */}
        {user ? (
          <div className="p-4 rounded-2xl bg-[#00224f] text-white flex items-center justify-between gap-4 mb-6 shadow-sm flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-base shrink-0">
                <i className="fa-solid fa-circle-user" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold">
                    Signed in as <span className="text-amber-400">{user.name || user.email}</span>
                  </span>
                  <span className="text-[11px] text-blue-200">
                    · {user.role === 'admin' ? 'Administrator' : 'Hotel Factories Member'}
                  </span>
                </div>
                <span className="block text-[11px] text-slate-300 mt-0.5">
                  You will earn <strong className="text-white">{rewardPoints} Reward Points</strong> on this stay!
                </span>
              </div>
            </div>

            <span className="px-3 py-1 rounded-md bg-amber-500 text-slate-950 font-black text-[10px] tracking-wider uppercase shrink-0">
              MEMBER TARIFF
            </span>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between gap-4 mb-6 shadow-sm flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center text-base shrink-0">
                <i className="fa-regular fa-user" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold block">
                  Booking as Guest
                </span>
                <span className="block text-[11px] text-slate-300 mt-0.5">
                  Sign in to track your reservation, unlock instant member discounts, and earn reward points.
                </span>
              </div>
            </div>
            {setIsAuthSheetOpen && (
              <button
                type="button"
                onClick={() => setIsAuthSheetOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shrink-0 transition-colors cursor-pointer"
              >
                Sign in / Register
              </button>
            )}
          </div>
        )}

        {/* 2-Column Checkout Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: Guest Details, Preferences & Payment (7 cols)*/}
          {/* ========================================================= */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Lead Guest Details */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <i className="fa-regular fa-user text-[#003b95]" />
                  <span>Lead Guest Details</span>
                </h2>
                <span className="text-[11px] text-slate-400 font-medium">* Required for room check-in</span>
              </div>

              {/* Radio Group */}
              <div className="flex items-center gap-6 mb-5 text-xs font-semibold text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="guestType"
                    checked={isMainGuest}
                    onChange={() => setIsMainGuest(true)}
                    className="text-[#003b95] focus:ring-[#003b95]"
                  />
                  <span>I am the main guest</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="guestType"
                    checked={!isMainGuest}
                    onChange={() => setIsMainGuest(false)}
                    className="text-[#003b95] focus:ring-[#003b95]"
                  />
                  <span>Booking for someone else</span>
                </label>
              </div>

              {/* Names Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    FIRST NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    placeholder="First Name (as on Gov ID)"
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:border-[#003b95] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    LAST NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    placeholder="Last Name (as on Gov ID)"
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:border-[#003b95] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    EMAIL ADDRESS (CONFIRMATION &amp; VOUCHER SENT HERE) *
                  </label>
                  {user?.email && user.email === email && (
                    <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                      <i className="fa-solid fa-circle-check text-[10px]" /> Verified Account
                    </span>
                  )}
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  placeholder="name@domain.com"
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:border-[#003b95] focus:bg-white transition-all"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  MOBILE PHONE NUMBER *
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value="+91 (IN)">🇮🇳 +91 (IN)</option>
                    <option value="+1 (US)">🇺🇸 +1 (US)</option>
                    <option value="+44 (UK)">🇬🇧 +44 (UK)</option>
                    <option value="+971 (AE)">🇦🇪 +971 (AE)</option>
                  </select>
                  <input
                    type="tel"
                    required
                    value={phone}
                    placeholder="10-digit mobile number"
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:border-[#003b95] focus:bg-white transition-all"
                  />
                </div>
                <span className="block text-[11px] text-slate-400 mt-1.5">
                  Needed for instant SMS confirmation and check-in QR pass.
                </span>
              </div>
            </div>

            {/* 2. Room Preferences & Arrival */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
                <i className="fa-solid fa-sliders text-[#003b95]" />
                <span>Room Preferences &amp; Arrival</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                  <label htmlFor="bedding-select" className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Bedding Type
                  </label>
                  <select
                    id="bedding-select"
                    value={beddingType}
                    onChange={(e) => setBeddingType(e.target.value)}
                    className="w-full bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value={room?.bedType || '1 King Bed'}>{room?.bedType || '1 Large King Bed'}</option>
                    <option value="2 Twin / Single Beds">2 Twin / Single Beds</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Smoking Policy</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 pt-1">
                    <i className="fa-solid fa-ban-smoking text-emerald-600" />
                    <span className="truncate">{smokingPolicy}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                  <label htmlFor="checkin-time-select" className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Est. Check-in
                  </label>
                  <select
                    id="checkin-time-select"
                    value={estCheckIn}
                    onChange={(e) => setEstCheckIn(e.target.value)}
                    className="w-full bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value={defaultEstCheckIn}>{defaultEstCheckIn}</option>
                    <option value="15:00 – 16:00">15:00 – 16:00</option>
                    <option value="16:00 – 17:00">16:00 – 17:00</option>
                    <option value="17:00 – 18:00">17:00 – 18:00</option>
                    <option value="After 18:00 (Late Arrival)">After 18:00 (Late Arrival)</option>
                    <option value="I am not sure yet">I am not sure yet</option>
                  </select>
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Special requests
                  </label>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">OPTIONAL</span>
                </div>
                <textarea
                  rows={3}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="e.g. Quiet corner, high floor, early luggage drop, celebration note..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 outline-none focus:border-[#003b95] focus:bg-white transition-all resize-none"
                />
                <span className="block text-[10px] text-slate-400 mt-1">
                  Special requests are relayed directly to the hotel reception and fulfilled subject to availability.
                </span>
              </div>
            </div>

            {/* 3. Promo Code Section */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-tag text-[#003b95]" />
                  <span className="text-sm font-bold text-slate-900">Have a Coupon or Promo Code?</span>
                </div>
                {!showPromoInput && !promoCode && (
                  <button
                    type="button"
                    onClick={() => setShowPromoInput(true)}
                    className="text-xs font-bold text-[#003b95] hover:underline cursor-pointer"
                  >
                    Add Coupon
                  </button>
                )}
              </div>

              {(showPromoInput || promoCode) && (
                <div className="mt-3">
                  {promoCode ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-circle-check text-emerald-600" />
                        <span className="font-bold text-emerald-900 font-mono">{promoCode}</span>
                        {discount > 0 && (
                          <span className="text-emerald-700 font-semibold">({formatPrice(discount)} discount applied)</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        placeholder="Enter coupon code (e.g. WELCOME10)"
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-bold uppercase text-slate-900 outline-none focus:border-[#003b95] focus:bg-white"
                      />
                      <button
                        type="submit"
                        disabled={!promoInput.trim() || isQuoteLoading}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                      >
                        Apply
                      </button>
                    </form>
                  )}

                  {promoError && (
                    <p className="text-xs text-rose-600 font-semibold mt-1.5">{promoError}</p>
                  )}
                </div>
              )}
            </div>

            {/* 4. Payment Method */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <i className="fa-solid fa-shield-halved text-[#00224f]" />
                  <span>Payment Method</span>
                </h2>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80 flex items-center gap-1.5">
                  <i className="fa-solid fa-lock text-emerald-600 text-xs" />
                  256-bit SSL Encrypted
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-5">
                Pay online instantly through Razorpay or choose to pay at the hotel desk upon check-in.
              </p>

              {/* Payment Method Selector Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {/* Razorpay Online */}
                <button
                  type="button"
                  onClick={() => setPaymentTab('razorpay')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                    paymentTab === 'razorpay'
                      ? 'border-[#00224f] bg-slate-50/80 ring-2 ring-[#00224f]/10 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00224f]">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      Razorpay Gateway
                    </span>
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      paymentTab === 'razorpay' ? 'border-[#00224f] bg-[#00224f]' : 'border-slate-300'
                    }`}>
                      {paymentTab === 'razorpay' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">UPI, Cards &amp; NetBanking</div>
                  <div className="text-xs text-slate-500 mt-1">Google Pay, PhonePe, Paytm, Visa, RuPay, NetBanking</div>
                  <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-xs font-bold text-slate-700">UPI</span>
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-xs font-bold text-slate-700">GPay</span>
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-xs font-bold text-slate-700">PhonePe</span>
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-xs font-bold text-slate-700">Cards</span>
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-xs font-bold text-slate-700">NetBanking</span>
                  </div>
                </button>

                {/* Pay at Hotel */}
                <button
                  type="button"
                  onClick={() => setPaymentTab('hotel')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                    paymentTab === 'hotel'
                      ? 'border-[#00224f] bg-slate-50/80 ring-2 ring-[#00224f]/10 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <i className="fa-solid fa-hotel text-slate-500" />
                      Pay at Property
                    </span>
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      paymentTab === 'hotel' ? 'border-[#00224f] bg-[#00224f]' : 'border-slate-300'
                    }`}>
                      {paymentTab === 'hotel' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">Pay on Check-in</div>
                  <div className="text-xs text-slate-500 mt-1">Cash, Card or UPI directly at hotel reception</div>
                  <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <i className="fa-solid fa-circle-check" /> No upfront online payment required
                  </div>
                </button>
              </div>

              {/* Informational banner */}
              {paymentTab === 'razorpay' ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 mb-6 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 text-sm">
                    <i className="fa-solid fa-bolt" />
                  </div>
                  <div className="text-xs leading-relaxed text-slate-600">
                    <p className="font-bold text-slate-900 mb-0.5">Instant Confirmation via Razorpay</p>
                    <p>Clicking <strong>Complete Booking</strong> will open the official Razorpay Checkout popup where you can scan a UPI QR code, choose GPay/PhonePe, or enter your card with instant bank 3D-secure OTP.</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 mb-6 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 text-sm">
                    <i className="fa-solid fa-info" />
                  </div>
                  <div className="text-xs leading-relaxed text-amber-900">
                    <p className="font-bold text-amber-950 mb-0.5">Pay upon arrival at reception</p>
                    <p>Your room will be reserved. Please present your government ID and pay the total tariff at the hotel desk during check-in.</p>
                  </div>
                </div>
              )}

              {/* Complete Booking CTA Button */}
              <button
                type="button"
                disabled={isSubmitting || isQuoteLoading}
                onClick={handleCompleteBooking}
                className="w-full py-4 px-4 rounded-xl bg-slate-900 hover:bg-black active:bg-zinc-900 active:scale-[0.99] text-white font-extrabold text-sm sm:text-base shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin text-sm" />
                    <span>Processing with Razorpay...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-lock text-sm" />
                    <span>
                      {paymentTab === 'razorpay'
                        ? `Pay with Razorpay (${formatPrice(totalPrice)})`
                        : `Confirm Reservation (${formatPrice(totalPrice)})`}
                    </span>
                    <i className="fa-solid fa-arrow-right text-xs ml-1" />
                  </>
                )}
              </button>

              <p className="text-xs text-slate-500 text-center mt-3 leading-relaxed">
                By clicking <strong>Complete Booking</strong>, you agree to Hotel Factories&apos; <span className="underline">Terms of Service</span>, <span className="underline">Privacy Policy</span>, and property <span className="underline">Cancellation Policy</span>.
              </p>
            </div>

          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: Dynamic Reservation Summary (5 cols)        */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 sticky top-22 space-y-4">
            
            {/* Main Reservation Card */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
              
              {/* Hotel Overview Header */}
              <div className="flex gap-4 items-start pb-4 border-b border-slate-100">
                <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  <img
                    src={hotelImage}
                    alt={hotel.name}
                    className="w-full h-full object-cover"
                  />
                  {(hotel.starRating || hotel.stars || hotel.category) && (
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[8px] uppercase">
                      {hotel.starRating ? `${hotel.starRating}-Star` : (hotel.category || 'Luxury')}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base text-slate-900 leading-snug truncate">
                    {hotel.name}
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    <i className="fa-solid fa-location-dot text-slate-400 mr-1 text-[10px]" />
                    {[hotel.locality, hotel.city].filter(Boolean).join(', ') || hotel.address || 'India'}
                  </p>

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {hotel.rating && (
                      <span className="px-2 py-0.5 rounded bg-[#003b95] text-white text-xs font-black">
                        {Number(hotel.rating).toFixed(1)}
                      </span>
                    )}
                    <span className="text-xs font-bold text-slate-800">
                      {hotel.scoreLabel || (Number(hotel.rating) >= 4.5 ? 'Exceptional' : Number(hotel.rating) >= 4.0 ? 'Very Good' : 'Top Rated')}
                    </span>
                    {hotel.reviewsCount > 0 ? (
                      <span className="text-[11px] text-slate-400">({Number(hotel.reviewsCount).toLocaleString('en-IN')} reviews)</span>
                    ) : hotel.reviews?.length > 0 ? (
                      <span className="text-[11px] text-slate-400">({hotel.reviews.length} reviews)</span>
                    ) : null}
                    {Number(hotel.rating) >= 4.5 && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[9px] font-black uppercase">
                        Top Rated
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Dates & Length of Stay */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">CHECK-IN</span>
                  <strong className="block text-xs font-bold text-slate-900 mt-0.5">{formatDate(checkInDate)}</strong>
                  <span className="text-[10px] text-slate-500">From {hotel.checkInTime || '14:00'}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">CHECK-OUT</span>
                  <strong className="block text-xs font-bold text-slate-900 mt-0.5">{formatDate(checkOutDate)}</strong>
                  <span className="text-[10px] text-slate-500">Until {hotel.checkOutTime || '11:00'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-slate-700 py-1">
                <span>Total Length of Stay:</span>
                <span className="text-slate-900 font-extrabold">
                  {nights} {nights === 1 ? 'Night' : 'Nights'} · {roomsCount} {roomsCount === 1 ? 'Room' : 'Rooms'}
                </span>
              </div>

              {/* Selected Room Details */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  SELECTED ROOM UNIT
                </span>
                <strong className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
                  {room.name}
                </strong>
                <div className="flex items-center gap-3 text-[11px] text-slate-600 flex-wrap">
                  {room.bedType && (
                    <span><i className="fa-solid fa-bed text-slate-400 mr-1" />{room.bedType}</span>
                  )}
                  {room.size && (
                    <span><i className="fa-solid fa-vector-square text-slate-400 mr-1" />{room.size}</span>
                  )}
                  {(room.breakfastIncluded || room.mealPlan?.toLowerCase().includes('breakfast')) ? (
                    <span className="text-emerald-700 font-semibold">
                      <i className="fa-solid fa-utensils mr-1" />Breakfast Included
                    </span>
                  ) : null}
                  {room.amenities?.slice(0, 3).map((amenity, idx) => (
                    <span key={idx}>
                      <i className="fa-solid fa-check text-slate-400 mr-1" />{amenity}
                    </span>
                  ))}
                  <span><i className="fa-solid fa-circle-check text-emerald-600 mr-1" />Instant Confirmation</span>
                </div>
              </div>

              {/* Hotel-Specific Cancellation & Refund Notice */}
              {hotel?.cancellationPolicy?.refundable !== false ? (
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 text-xs text-sky-950 flex items-start gap-2.5">
                  <i className="fa-solid fa-clock-rotate-left text-[#0ea5e9] text-sm shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold text-sky-900">
                      Cancellation Policy ({hotel.cancellationPolicy?.badgeText || 'Refundable'})
                    </strong>
                    <span className="text-sky-800 text-[11px] mt-0.5 block">
                      {hotel.cancellationPolicy?.summary || hotel.policies?.cancellation || 'Refundable according to property cancellation policy.'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200/80 text-xs text-amber-950 flex items-start gap-2.5">
                  <i className="fa-solid fa-triangle-exclamation text-amber-600 text-sm shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold text-amber-900">
                      Non-Refundable Reservation
                    </strong>
                    <span className="text-amber-800 text-[11px] mt-0.5 block">
                      {hotel.cancellationPolicy?.summary || 'This property operates on a non-refundable policy. In case of cancellation or no-show, no refund will be issued.'}
                    </span>
                  </div>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900">Price Summary</h4>
                  {isQuoteLoading && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <i className="fa-solid fa-circle-notch fa-spin text-[10px]" /> Updating...
                    </span>
                  )}
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Room Stay ({nights} {nights === 1 ? 'Night' : 'Nights'}, {roomsCount} {roomsCount === 1 ? 'Room' : 'Rooms'})</span>
                  <span className="font-semibold text-slate-800">{formatPrice(basePrice)}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    <span>GST (Taxes &amp; Fees)</span>
                    <i className="fa-regular fa-circle-question text-[10px] text-slate-400" title="Includes applicable GST and hospitality levies" />
                  </span>
                  <span className="font-semibold text-slate-800">{formatPrice(taxes)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span className="flex items-center gap-1">
                      <i className="fa-solid fa-tag text-xs" />
                      <span>Coupon Discount ({promoCode})</span>
                    </span>
                    <span>- {formatPrice(discount)}</span>
                  </div>
                )}

                {convenienceFee > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Convenience Fee</span>
                    <span className="font-semibold text-slate-800">{formatPrice(convenienceFee)}</span>
                  </div>
                )}

                {/* Total */}
                <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between">
                  <div>
                    <span className="block text-sm font-bold text-slate-900">Total Price</span>
                    <span className="block text-[10px] text-slate-400">Includes all GST &amp; property taxes</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#003b95]">{formatPrice(totalPrice)}</span>
                    <span className="block text-[10px] font-semibold text-emerald-700">No hidden charges</span>
                  </div>
                </div>

              </div>

            </div>

            {/* Hotel Factories Guarantee Box */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-xs text-slate-600 flex items-center gap-3">
              <i className="fa-solid fa-shield-halved text-2xl text-[#003b95] shrink-0" />
              <div>
                <strong className="block text-slate-900 font-bold mb-0.5">Hotel Factories Booking Guarantee</strong>
                <p className="text-[11px] leading-relaxed">
                  Your reservation is verified instantly with the property. Official GST tax invoice and encrypted Razorpay UPI/Card checkout.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
