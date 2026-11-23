'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function ProfileScreen() {
  const {
    user,
    bookings,
    favorites,
    switchNav,
    updateProfile,
    logout,
    showToast,
    openAuthModal,
    currency,
    toggleCurrency
  } = useApp();

  // Personal details editing states
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Big Hotel Brand Stay Preferences
  const [stayPrefs, setStayPrefs] = useState({
    bedType: 'King Bed',
    floor: 'High Floor',
    dietary: 'Vegetarian',
    smoking: 'Non-Smoking',
    earlyCheckin: true,
    lateCheckout: false,
    specialNotes: 'Quiet room away from elevator'
  });

  // Sync initial user details
  useEffect(() => {
    if (user) {
      setNameValue(user.name || '');
      setPhoneValue(user.phone || '');
    }
  }, [user]);

  // Load saved stay preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hf_guest_preferences');
      if (saved) {
        setStayPrefs(JSON.parse(saved));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleSavePref = (key, value) => {
    const updated = { ...stayPrefs, [key]: value };
    setStayPrefs(updated);
    try {
      localStorage.setItem('hf_guest_preferences', JSON.stringify(updated));
      showToast(`Preference updated: ${value}`);
    } catch (e) {
      // ignore
    }
  };

  const handleSaveName = async (e) => {
    e.preventDefault();
    if (!nameValue.trim()) return;
    setIsSaving(true);
    try {
      await updateProfile({ name: nameValue.trim() });
      setIsEditingName(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePhone = async (e) => {
    e.preventDefault();
    if (!phoneValue.trim()) return;
    setIsSaving(true);
    try {
      await updateProfile({ phone: phoneValue.trim() });
      setIsEditingPhone(false);
    } finally {
      setIsSaving(false);
    }
  };

  const upcomingBookings = bookings?.filter(b => b.status === 'confirmed' || b.status === 'paid') || [];
  const memberId = user ? `HF-${(user._id || user.id || '892401').toString().slice(-6).toUpperCase()}` : 'HF-GUEST';
  const pointsBalance = bookings?.length ? bookings.length * 510 : 510;

  return (
    <div className="hf-page-wrapper container max-w-[1200px] mx-auto px-4 sm:px-8 py-6 pb-28 md:pb-16 text-slate-800">
      
      {/* Top Breadcrumb Bar */}
      <div className="hf-breadcrumb-bar flex items-center gap-2 text-xs text-slate-500 py-2.5 mb-2">
        <button
          type="button"
          className="breadcrumb-link inline-flex items-center gap-1.5 hover:text-black cursor-pointer transition-colors"
          onClick={() => switchNav('home')}
        >
          <i className="fa-solid fa-hotel text-slate-400"></i> Stays
        </button>
        <span className="breadcrumb-separator text-slate-300">/</span>
        <span className="breadcrumb-current text-slate-900 font-semibold">Guest Profile</span>
      </div>

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Member Account</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your personal guest profile, loyalty tier, stay preferences, and reservations.
          </p>
        </div>

        {user && (
          <div className="flex items-center gap-2">
            {(user.role === 'admin' || user.role === 'hotel_owner') && (
              <button
                type="button"
                onClick={() => switchNav('admin')}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <i className="fa-solid fa-crown" />
                <span>Partner Console</span>
              </button>
            )}
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-slate-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 text-xs font-bold text-slate-600 transition-all cursor-pointer"
            >
              <i className="fa-solid fa-right-from-bracket" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {!user ? (
        /* GUEST MODE: SIGN IN / JOIN CLUB */
        <div className="max-w-2xl mx-auto my-8 space-y-6">
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white p-6 sm:p-8 rounded-md border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-2xl flex items-center justify-center mb-4">
                <i className="fa-solid fa-crown" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Welcome to Hotel Factories
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                Unlock exclusive member rates up to 15% off, earn loyalty reward points on every stay, and personalize your room preferences.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full my-6 text-left">
                <div className="p-3 rounded-md bg-white/5 border border-white/10">
                  <i className="fa-solid fa-tag text-amber-400 text-sm mb-1.5 block" />
                  <strong className="block text-xs text-white">Member Rates</strong>
                  <span className="text-[11px] text-slate-400">Guaranteed lowest pricing</span>
                </div>
                <div className="p-3 rounded-md bg-white/5 border border-white/10">
                  <i className="fa-solid fa-coins text-amber-400 text-sm mb-1.5 block" />
                  <strong className="block text-xs text-white">510 Welcome Pts</strong>
                  <span className="text-[11px] text-slate-400">Redeem on next booking</span>
                </div>
                <div className="p-3 rounded-md bg-white/5 border border-white/10">
                  <i className="fa-solid fa-bell-concierge text-amber-400 text-sm mb-1.5 block" />
                  <strong className="block text-xs text-white">VIP Concierge</strong>
                  <span className="text-[11px] text-slate-400">Priority check-in &amp; support</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-md bg-white text-slate-950 text-xs font-black uppercase tracking-wider hover:bg-slate-100 transition-all cursor-pointer shadow-md"
                >
                  Sign In to Account
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal('register')}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-md bg-amber-500 text-white text-xs font-black uppercase tracking-wider hover:bg-amber-600 transition-all cursor-pointer shadow-md"
                >
                  Create Account
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* LOGGED IN MEMBER PROFILE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Loyalty Card & Personal Details (4 cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* 1. Premier Member Card (Marriott Bonvoy / Hilton Honors Aesthetic) */}
            <div className="relative rounded-md bg-gradient-to-br from-slate-950 via-zinc-900 to-black text-white p-5 border border-zinc-800 shadow-lg overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-start justify-between relative z-10 mb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block mb-0.5">
                    HOTEL FACTORIES
                  </span>
                  <span className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    <i className="fa-solid fa-gem text-amber-400 text-xs" />
                    <span>Gold Elite Member</span>
                  </span>
                </div>
                <div className="w-9 h-9 rounded-md bg-white/10 border border-white/20 flex items-center justify-center text-amber-400 text-sm">
                  <i className="fa-solid fa-crown" />
                </div>
              </div>

              {/* User Avatar & Name */}
              <div className="flex items-center gap-3.5 relative z-10 my-4">
                <div className="w-12 h-12 rounded-md bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-lg flex items-center justify-center shadow-md shrink-0">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'G'}
                </div>
                <div className="min-w-0 flex-1">
                  <strong className="block text-sm font-extrabold text-white truncate">
                    {user.name || 'Valued Guest'}
                  </strong>
                  <span className="block text-[11px] text-zinc-400 truncate">
                    {user.email}
                  </span>
                </div>
              </div>

              {/* Card Meta & Points Balance */}
              <div className="pt-3 border-t border-zinc-800/80 grid grid-cols-2 gap-3 relative z-10">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Member ID
                  </span>
                  <span className="text-xs font-mono font-bold text-zinc-200">
                    {memberId}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    Reward Points
                  </span>
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                    <i className="fa-solid fa-coins text-amber-400 text-[10px]" />
                    <span>{pointsBalance.toLocaleString()} Pts</span>
                  </span>
                </div>
              </div>

              {/* Progress to next tier */}
              <div className="mt-3.5 pt-3 border-t border-zinc-800/80">
                <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                  <span>Platinum Elite Tier</span>
                  <span className="text-amber-400 font-bold">{bookings?.length || 1} / 5 Stays</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(20, (bookings?.length || 1) * 20))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 2. Personal & Contact Information Card */}
            <div className="bg-white rounded-md border border-slate-200/90 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <i className="fa-solid fa-address-card text-sky-500" />
                  <span>Personal &amp; Contact Details</span>
                </h3>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Full Name
                </label>
                {isEditingName ? (
                  <form onSubmit={handleSaveName} className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-md border border-slate-300 text-xs font-semibold text-slate-900 focus:border-black outline-none"
                      placeholder="Enter legal name"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-3 py-1.5 rounded-md bg-black text-white text-xs font-bold hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                    >
                      {isSaving ? '...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      className="px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                    >
                      ✕
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center justify-between py-1 px-2.5 rounded-md bg-slate-50 border border-slate-100">
                    <span className="text-xs font-bold text-slate-900">
                      {user.name || 'Not provided'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="text-[11px] font-semibold text-sky-600 hover:text-sky-800 cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Email Address
                </label>
                <div className="py-1.5 px-2.5 rounded-md bg-slate-50 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-800 truncate block">
                    {user.email}
                  </span>
                </div>
              </div>

              {/* Contact Phone Number */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Contact Mobile Number
                </label>
                {isEditingPhone ? (
                  <form onSubmit={handleSavePhone} className="flex items-center gap-2 pt-1">
                    <input
                      type="tel"
                      value={phoneValue}
                      onChange={(e) => setPhoneValue(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-md border border-slate-300 text-xs font-semibold text-slate-900 focus:border-black outline-none"
                      placeholder="+91 9876543210"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-3 py-1.5 rounded-md bg-black text-white text-xs font-bold hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                    >
                      {isSaving ? '...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingPhone(false)}
                      className="px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                    >
                      ✕
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center justify-between py-1 px-2.5 rounded-md bg-slate-50 border border-slate-100">
                    <span className="text-xs font-bold text-slate-900">
                      {user.phone || '+91 Not provided'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingPhone(true)}
                      className="text-[11px] font-semibold text-sky-600 hover:text-sky-800 cursor-pointer"
                    >
                      {user.phone ? 'Edit' : '+ Add'}
                    </button>
                  </div>
                )}
                <span className="text-[10px] text-slate-400 block">
                  Used for hotel check-in SMS and WhatsApp booking vouchers.
                </span>
              </div>

              {/* Account Role / Status */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Account Tier</span>
                <span className="font-bold text-slate-900 uppercase text-[11px] px-2 py-0.5 rounded bg-zinc-100">
                  {user.role || 'Guest'}
                </span>
              </div>
            </div>

            {/* Quick Currency & Preferences Pill */}
            <div className="bg-white rounded-md border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
              <div>
                <strong className="block text-xs font-bold text-slate-900">Display Currency</strong>
                <span className="text-[11px] text-slate-500">Currently set to {currency}</span>
              </div>
              <button
                type="button"
                onClick={toggleCurrency}
                className="px-3 py-1.5 rounded-md border border-slate-300 hover:border-black text-xs font-bold transition-all cursor-pointer"
              >
                Switch to {currency === 'INR' ? 'USD ($)' : 'INR (₹)'}
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN: Hospitality Details, Stays & Room Preferences (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* 1. Stays & Activity Overview Strip */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => switchNav('bookings')}
                className="bg-white rounded-md border border-slate-200/90 p-4 text-left shadow-2xs hover:border-black transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center text-sm mb-2 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-calendar-check" />
                </div>
                <strong className="block text-xl font-black text-slate-900">
                  {bookings?.length || 0}
                </strong>
                <span className="text-xs font-semibold text-slate-500">
                  All Stays &amp; Trips →
                </span>
              </button>

              <button
                type="button"
                onClick={() => switchNav('bookings')}
                className="bg-white rounded-md border border-slate-200/90 p-4 text-left shadow-2xs hover:border-black transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm mb-2 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-suitcase" />
                </div>
                <strong className="block text-xl font-black text-slate-900">
                  {upcomingBookings.length}
                </strong>
                <span className="text-xs font-semibold text-slate-500">
                  Upcoming Stays
                </span>
              </button>

              <button
                type="button"
                onClick={() => switchNav('saved')}
                className="bg-white rounded-md border border-slate-200/90 p-4 text-left shadow-2xs hover:border-black transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-md bg-rose-50 text-rose-500 flex items-center justify-center text-sm mb-2 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-heart" />
                </div>
                <strong className="block text-xl font-black text-slate-900">
                  {favorites?.length || 0}
                </strong>
                <span className="text-xs font-semibold text-slate-500">
                  Saved Wishlist →
                </span>
              </button>
            </div>

            {/* 2. Big Hotel Brand Hospitality & Stay Preferences */}
            <div className="bg-white rounded-md border border-slate-200/90 p-5 shadow-2xs space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <i className="fa-solid fa-sliders text-amber-500" />
                  <span>Guest Room &amp; Stay Preferences</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Your preferred choices are shared with the hotel front desk upon booking.
                </p>
              </div>

              {/* Bed Preference */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <i className="fa-solid fa-bed text-slate-400 text-xs" />
                  <span>Bed Configuration</span>
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {['King Bed', 'Twin Beds', 'Queen Bed'].map((bed) => (
                    <button
                      key={bed}
                      type="button"
                      onClick={() => handleSavePref('bedType', bed)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer border ${
                        stayPrefs.bedType === bed
                          ? 'bg-black text-white border-black shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {bed}
                    </button>
                  ))}
                </div>
              </div>

              {/* Floor Preference */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <i className="fa-solid fa-building text-slate-400 text-xs" />
                  <span>Floor &amp; Room Location</span>
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {['High Floor', 'Quiet Corner', 'Ground Floor', 'Pool View'].map((fl) => (
                    <button
                      key={fl}
                      type="button"
                      onClick={() => handleSavePref('floor', fl)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer border ${
                        stayPrefs.floor === fl
                          ? 'bg-black text-white border-black shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {fl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dietary & Breakfast Preference */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <i className="fa-solid fa-utensils text-slate-400 text-xs" />
                  <span>Breakfast &amp; Dietary Request</span>
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {['Vegetarian', 'Non-Vegetarian', 'Jain Meal', 'Vegan'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleSavePref('dietary', d)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer border ${
                        stayPrefs.dietary === d
                          ? 'bg-black text-white border-black shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Perks / Requests Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div
                  onClick={() => handleSavePref('earlyCheckin', !stayPrefs.earlyCheckin)}
                  className={`p-3 rounded-md border flex items-center justify-between cursor-pointer transition-all ${
                    stayPrefs.earlyCheckin
                      ? 'border-emerald-300 bg-emerald-50/50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="pr-2">
                    <strong className="block text-xs font-bold text-slate-900">
                      Early Check-in Priority
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Request room ready before 2:00 PM
                    </span>
                  </div>
                  <i className={`fa-solid ${stayPrefs.earlyCheckin ? 'fa-circle-check text-emerald-600' : 'fa-circle text-slate-300'} text-base`} />
                </div>

                <div
                  onClick={() => handleSavePref('lateCheckout', !stayPrefs.lateCheckout)}
                  className={`p-3 rounded-md border flex items-center justify-between cursor-pointer transition-all ${
                    stayPrefs.lateCheckout
                      ? 'border-emerald-300 bg-emerald-50/50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="pr-2">
                    <strong className="block text-xs font-bold text-slate-900">
                      Late Checkout Request
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Extend checkout up to 1:00 PM
                    </span>
                  </div>
                  <i className={`fa-solid ${stayPrefs.lateCheckout ? 'fa-circle-check text-emerald-600' : 'fa-circle text-slate-300'} text-base`} />
                </div>
              </div>
            </div>

            {/* 3. 24/7 Dedicated Hotel Guest Support */}
            <div className="bg-slate-900 text-white rounded-md p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-md bg-white/10 border border-white/20 text-amber-400 flex items-center justify-center text-lg shrink-0">
                  <i className="fa-solid fa-headset" />
                </div>
                <div>
                  <strong className="block text-sm font-extrabold text-white">
                    24/7 Dedicated Guest Concierge
                  </strong>
                  <span className="text-xs text-slate-400">
                    Need instant booking changes, airport pickup, or custom requests?
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="https://wa.me/918000123456"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                >
                  <i className="fa-brands fa-whatsapp text-sm" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href="tel:+918000123456"
                  className="px-3.5 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors border border-white/20"
                >
                  <i className="fa-solid fa-phone text-xs" />
                  <span>Call Concierge</span>
                </a>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
