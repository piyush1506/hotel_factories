'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import CustomDatePicker from './CustomDatePicker';

export default function MakeMyTripHero() {
  const {
    hotels,
    selectedDestination,
    setSelectedDestination,
    setSearchParams,
    showToast
  } = useApp();

  // Search box state
  const [destSearchInput, setDestSearchInput] = useState(
    selectedDestination && selectedDestination !== 'All Destinations'
      ? selectedDestination
      : ''
  );
  
  // Dates: defaulting to Oct 13 2026 and Oct 14 2026 (matching reference image: "Tue, 13 Oct" & "Wed, 14 Oct")
  const [checkInDate, setCheckInDate] = useState('2026-10-13');
  const [checkOutDate, setCheckOutDate] = useState('2026-10-14');

  // Guests & Rooms: defaulting to 1 Room, 2 Guests (matching reference image: "1 Room, 2 Guests")
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);

  // Active Dropdown
  const [openDropdown, setOpenDropdown] = useState(null); // 'destination' | 'checkin' | 'checkout' | 'guests'
  const heroRef = useRef(null);
  const destInputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (heroRef.current && !heroRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format date: "Tue, 13 Oct"
  const formatWidgetDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
  };

  // Format rooms and guests: "1 Room, 2 Guests"
  const formatRoomsGuests = () => {
    const totalGuests = adults + childrenCount;
    return `${rooms} ${rooms === 1 ? 'Room' : 'Rooms'}, ${totalGuests} ${totalGuests === 1 ? 'Guest' : 'Guests'}`;
  };

  // Calculate nights
  const nightsCount = useMemo(() => {
    const a = new Date(checkInDate + 'T00:00:00');
    const b = new Date(checkOutDate + 'T00:00:00');
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return 1;
    const diff = Math.round((b - a) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [checkInDate, checkOutDate]);

  // Destination list from database
  const availableDestinations = useMemo(() => {
    const unique = new Set();
    (hotels || []).forEach((h) => {
      if (h.city) unique.add(h.city);
    });
    const list = Array.from(unique);
    if (list.length === 0) {
      return ['Goa', 'Udaipur', 'Manali', 'Jaipur', 'Munnar', 'Alleppey', 'Mumbai'];
    }
    return list;
  }, [hotels]);

  const filteredCities = useMemo(() => {
    if (!destSearchInput.trim()) return availableDestinations;
    const q = destSearchInput.toLowerCase();
    return availableDestinations.filter((c) => c.toLowerCase().includes(q));
  }, [availableDestinations, destSearchInput]);

  const handleSelectDestination = (destName) => {
    if (destName === 'All Destinations') {
      setDestSearchInput('');
      setSelectedDestination('All Destinations');
    } else {
      setDestSearchInput(destName);
      setSelectedDestination(destName);
    }
    setOpenDropdown(null);
  };

  const handleSearchHotels = () => {
    const targetDest = destSearchInput.trim() || 'All Destinations';
    setSelectedDestination(targetDest);
    if (setSearchParams) {
      setSearchParams((prev) => ({
        ...prev,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        adults,
        childrenCount,
        rooms
      }));
    }
    showToast(`Searching hotels in ${targetDest} • ${nightsCount} ${nightsCount === 1 ? 'Night' : 'Nights'}`);
    const resultsSection = document.getElementById('hotelsListSection');
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="hf-search-hero-wrapper relative w-full max-w-[1240px] mx-auto mt-6" ref={heroRef}>
      
      {/* Top Blue Indicator Tab (matches exact position and accent in reference) */}
      <div className="absolute -top-1.5 left-16 sm:left-24 z-20 pointer-events-none">
        <div className="w-16 sm:w-20 h-1 sm:h-1.5 bg-emerald-500 rounded-full shadow-xs" />
      </div>

      {/* Outer Card: White, Deep Rounded Corners, Soft Elevation */}
      <div className="hf-search-console-card bg-white rounded-3xl sm:rounded-[28px] shadow-[0_12px_36px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 p-3 sm:p-3.5 relative">
        
        {/* Inner Segmented Row with 2px White Dividers */}
        <div className="flex flex-col lg:flex-row items-stretch rounded-2xl overflow-visible min-h-[66px] lg:h-[68px]">
          
          {/* Segment 1: Destination */}
          <div 
            className={`flex-1 lg:flex-[3.2] bg-neutral-100 lg:rounded-l-2xl rounded-xl lg:rounded-r-none px-5 py-2.5 flex flex-col justify-center cursor-pointer transition-colors relative ${openDropdown === 'destination' ? 'bg-neutral-100 ring-1 ring-slate-300' : 'hover:bg-neutral-100'}`}
            onClick={() => {
              setOpenDropdown('destination');
              if (destInputRef.current) destInputRef.current.focus();
            }}
          >
            <label className="hf-search-field-label block select-none pointer-events-none">
              Destination
            </label>
            <div className="flex items-center justify-between gap-2 w-full min-w-0">
              <input
                ref={destInputRef}
                type="text"
                value={destSearchInput}
                onChange={(e) => {
                  setDestSearchInput(e.target.value);
                  if (openDropdown !== 'destination') setOpenDropdown('destination');
                }}
                onFocus={() => setOpenDropdown('destination')}
                placeholder="Enter city, area or property name"
                className="hf-destination-input min-w-0 flex-1 bg-transparent"
              />
              {destSearchInput && (
                <button
                  type="button"
                  className="w-5 h-5 rounded-full hover:bg-slate-300/60 text-slate-400 hover:text-slate-700 flex items-center justify-center text-xs shrink-0 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDestSearchInput('');
                    setSelectedDestination('All Destinations');
                  }}
                  title="Clear destination"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Destination Autocomplete Popover */}
            {openDropdown === 'destination' && (
              <div 
                className="absolute top-[calc(100%+8px)] left-0 z-50 bg-white rounded-2xl shadow-lg border border-slate-200 p-3 w-80 sm:w-96 animate-in fade-in slide-in-from-top-2 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-2">
                  Popular Destinations
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  <div
                    className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors ${!destSearchInput ? 'bg-gold-50 text-gold-400 font-bold' : 'text-slate-700'}`}
                    onClick={() => handleSelectDestination('All Destinations')}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gold-100/70 text-gold-500 flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-globe text-sm" />
                    </div>
                    <div>
                      <strong className="block text-xs font-bold">All Destinations</strong>
                      <span className="block text-[11px] text-slate-400">Explore stays anywhere in India</span>
                    </div>
                  </div>

                  {filteredCities.map((cityName) => (
                    <div
                      key={cityName}
                      className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors ${destSearchInput.toLowerCase() === cityName.toLowerCase() ? 'bg-gold-50 text-gold-400 font-bold' : 'text-slate-700'}`}
                      onClick={() => handleSelectDestination(cityName)}
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-location-dot text-sm text-gold-500" />
                      </div>
                      <div>
                        <strong className="block text-xs font-bold text-slate-900">{cityName}</strong>
                        <span className="block text-[11px] text-slate-400">India</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2px White Divider */}
          <div className="hidden lg:block w-[2px] bg-white self-stretch shrink-0" />

          {/* Segment 2: Check-in */}
          <div 
            className={`flex-1 lg:flex-[1.8] bg-neutral-100 rounded-xl lg:rounded-none px-5 py-2.5 flex flex-col justify-center cursor-pointer transition-colors relative select-none mt-2 lg:mt-0 ${openDropdown === 'checkin' ? 'bg-neutral-100 ring-1 ring-slate-300' : 'hover:bg-neutral-100'}`}
            onClick={() => setOpenDropdown(openDropdown === 'checkin' ? null : 'checkin')}
          >
            <span className="hf-search-field-label block">
              Check-in
            </span>
            <span className="hf-search-field-value block truncate">
              {formatWidgetDate(checkInDate)}
            </span>

            {/* Check-in Date Picker */}
            {openDropdown === 'checkin' && (
              <div 
                className="absolute top-[calc(100%+8px)] left-0 sm:-left-12 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <CustomDatePicker
                  checkInDate={checkInDate}
                  checkOutDate={checkOutDate}
                  initialFocus="checkin"
                  onChange={({ checkInDate: newIn, checkOutDate: newOut }) => {
                    setCheckInDate(newIn);
                    setCheckOutDate(newOut);
                  }}
                  onClose={() => setOpenDropdown(null)}
                />
              </div>
            )}
          </div>

          {/* 2px White Divider */}
          <div className="hidden lg:block w-[2px] bg-white self-stretch shrink-0" />

          {/* Segment 3: Check-out */}
          <div 
            className={`flex-1 lg:flex-[1.8] bg-neutral-100 rounded-xl lg:rounded-none px-5 py-2.5 flex flex-col justify-center cursor-pointer transition-colors relative select-none mt-2 lg:mt-0 ${openDropdown === 'checkout' ? 'bg-neutral-100 ring-1 ring-slate-300' : 'hover:bg-neutral-100'}`}
            onClick={() => setOpenDropdown(openDropdown === 'checkout' ? null : 'checkout')}
          >
            <span className="hf-search-field-label block">
              Check-out
            </span>
            <span className="hf-search-field-value block truncate">
              {formatWidgetDate(checkOutDate)}
            </span>

            {/* Check-out Date Picker */}
            {openDropdown === 'checkout' && (
              <div 
                className="absolute top-[calc(100%+8px)] left-0 sm:-left-36 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <CustomDatePicker
                  checkInDate={checkInDate}
                  checkOutDate={checkOutDate}
                  initialFocus="checkout"
                  onChange={({ checkInDate: newIn, checkOutDate: newOut }) => {
                    setCheckInDate(newIn);
                    setCheckOutDate(newOut);
                  }}
                  onClose={() => setOpenDropdown(null)}
                />
              </div>
            )}
          </div>

          {/* 2px White Divider */}
          <div className="hidden lg:block w-[2px] bg-white self-stretch shrink-0" />

          {/* Segment 4: Rooms & Guests */}
          <div 
            className={`flex-1 lg:flex-[2] bg-neutral-100 rounded-xl lg:rounded-none px-5 py-2.5 flex flex-col justify-center cursor-pointer transition-colors relative select-none mt-2 lg:mt-0 ${openDropdown === 'guests' ? 'bg-neutral-100 ring-1 ring-slate-300' : 'hover:bg-neutral-100'}`}
            onClick={() => setOpenDropdown(openDropdown === 'guests' ? null : 'guests')}
          >
            <span className="hf-search-field-label block">
              Rooms & Guests
            </span>
            <span className="hf-search-field-value block truncate">
              {formatRoomsGuests()}
            </span>

            {/* Rooms & Guests Popover */}
            {openDropdown === 'guests' && (
              <div 
                className="absolute top-[calc(100%+8px)] right-0 z-50 bg-white rounded-2xl shadow-lg border border-slate-200 p-4 w-76 sm:w-80 animate-in fade-in slide-in-from-top-2 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-xs font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
                  <span>Rooms & Guests Selection</span>
                  <span className="text-[11px] font-normal text-slate-500">Max 8 rooms</span>
                </div>

                <div className="space-y-3.5 py-3">
                  {/* Rooms */}
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="block text-xs font-bold text-slate-900">Rooms</strong>
                      <span className="block text-[11px] text-slate-400">Min 1 room</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        type="button" 
                        className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer" 
                        disabled={rooms <= 1} 
                        onClick={() => setRooms(r => Math.max(1, r - 1))}
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-slate-900">{rooms}</span>
                      <button 
                        type="button" 
                        className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer" 
                        disabled={rooms >= 8} 
                        onClick={() => setRooms(r => Math.min(8, r + 1))}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Adults */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <strong className="block text-xs font-bold text-slate-900">Adults</strong>
                      <span className="block text-[11px] text-slate-400">Age 12+ years</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        type="button" 
                        className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer" 
                        disabled={adults <= 1} 
                        onClick={() => setAdults(a => Math.max(1, a - 1))}
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-slate-900">{adults}</span>
                      <button 
                        type="button" 
                        className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer" 
                        disabled={adults >= 16} 
                        onClick={() => setAdults(a => Math.min(16, a + 1))}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <strong className="block text-xs font-bold text-slate-900">Children</strong>
                      <span className="block text-[11px] text-slate-400">Age 0-11 years</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        type="button" 
                        className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer" 
                        disabled={childrenCount <= 0} 
                        onClick={() => setChildrenCount(c => Math.max(0, c - 1))}
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-slate-900">{childrenCount}</span>
                      <button 
                        type="button" 
                        className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer" 
                        disabled={childrenCount >= 6} 
                        onClick={() => setChildrenCount(c => Math.min(6, c + 1))}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Quick Presets - Minimalist Black & White */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 mb-3">
                    <button
                      type="button"
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${adults === 2 && rooms === 1 && childrenCount === 0 ? 'bg-black text-white border-black' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                      onClick={() => { setRooms(1); setAdults(2); setChildrenCount(0); }}
                    >
                      2 Adults, 1 Room
                    </button>
                    <button
                      type="button"
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${adults === 1 && rooms === 1 && childrenCount === 0 ? 'bg-black text-white border-black' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                      onClick={() => { setRooms(1); setAdults(1); setChildrenCount(0); }}
                    >
                      1 Adult, 1 Room
                    </button>
                    <button
                      type="button"
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${adults === 2 && childrenCount === 1 && rooms === 1 ? 'bg-black text-white border-black' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                      onClick={() => { setRooms(1); setAdults(2); setChildrenCount(1); }}
                    >
                      Family (2+1)
                    </button>
                  </div>

                  <button 
                    type="button" 
                    className="w-full py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-[0.99]" 
                    onClick={() => setOpenDropdown(null)}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2px White Divider */}
          <div className="hidden lg:block w-[2px] bg-white self-stretch shrink-0" />

          {/* Segment 5: Search Button - Minimalist Black & White Theme */}
          <button
            type="button"
            className="hf-search-submit flex-none lg:flex-[1.4] bg-black hover:bg-zinc-800 active:bg-zinc-900 lg:rounded-r-2xl rounded-xl text-white px-7 sm:px-9 py-3.5 lg:py-0 flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:shadow-md transition-all active:scale-[0.98] select-none mt-2 lg:mt-0 font-bold"
            onClick={handleSearchHotels}
          >
            <span>Search</span>
            <i className="fa-solid fa-chevron-right text-[14px] sm:text-[16px] text-white shrink-0 ml-0.5" aria-hidden="true" />
          </button>

        </div>
      </div>
    </div>
  );
}