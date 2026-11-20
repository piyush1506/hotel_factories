'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import CustomDatePicker from './CustomDatePicker';
import CustomGuestPicker from './CustomGuestPicker';
import { hotelAPI } from '../services/api';

export default function SearchBarConsole() {
  const {
    hotels,
    selectedDestination,
    setSelectedDestination,
    showToast
  } = useApp();

  const [destination, setDestination] = useState(
    selectedDestination && selectedDestination !== 'All Destinations'
      ? `${selectedDestination}, India`
      : 'Goa, India'
  );

  const [checkInDate, setCheckInDate] = useState('2026-10-10');
  const [checkOutDate, setCheckOutDate] = useState('2026-10-13');

  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);

  const [openDropdown, setOpenDropdown] = useState(null); // 'dest' | 'checkin' | 'checkout' | 'guests'
  const consoleRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (consoleRef.current && !consoleRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync destination if parent changes
  useEffect(() => {
    if (selectedDestination && selectedDestination !== 'All Destinations') {
      setDestination(selectedDestination.includes('India') ? selectedDestination : `${selectedDestination}, India`);
    }
  }, [selectedDestination]);

  // Format date: "10 Oct 2026"
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const [popularDestinations, setPopularDestinations] = useState([]);

  useEffect(() => {
    async function fetchPopularDestinations() {
      try {
        const data = await hotelAPI.getAll({ limit: 100 });
        const hotels = data.hotels || [];
        const cities = [...new Set(hotels.map(h => h.city).filter(Boolean))];
        const cityCounts = cities.map(city => {
          const hotelCount = hotels.filter(h => h.city === city).length;
          const firstHotel = hotels.find(h => h.city === city);
          return {
            city,
            country: firstHotel?.country || 'India',
            stays: `${hotelCount}+ stays`
          };
        });
        setPopularDestinations(cityCounts);
      } catch (err) {
        console.error('Failed to fetch popular destinations:', err);
        setPopularDestinations([
          { city: 'Goa', country: 'India', stays: '1,800+ stays' },
          { city: 'Udaipur', country: 'India', stays: '1,200+ stays' },
          { city: 'Manali', country: 'India', stays: '950+ stays' }
        ]);
      }
    }
    fetchPopularDestinations();
  }, []);

  const handleSelectCity = (city) => {
    setDestination(`${city}, India`);
    setSelectedDestination(city);
    setOpenDropdown(null);
  };

  const handleSearch = () => {
    const rawCity = destination.split(',')[0].trim();
    setSelectedDestination(rawCity || 'Goa');
    showToast(`Searching verified luxury stays in ${rawCity || 'Goa'}...`);
    const el = document.getElementById('hotelsListSection');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const totalGuests = adults + childrenCount;
  const guestsLabel = `${totalGuests} ${totalGuests === 1 ? 'Guest' : 'Guests'}, ${rooms} ${rooms === 1 ? 'Room' : 'Rooms'}`;

  return (
    <div
      ref={consoleRef}
      className="bg-white rounded-2xl shadow-md border border-slate-100/80 p-2 sm:p-2.5 flex flex-col lg:flex-row items-stretch lg:items-center relative z-30 w-full max-w-[1360px] mx-auto select-none"
    >
      {/* 1. Destination Field */}
      <div
        className="flex-1 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer relative flex items-center gap-3"
        onClick={() => setOpenDropdown(openDropdown === 'dest' ? null : 'dest')}
      >
        <i className="fa-solid fa-location-dot text-slate-500 text-lg shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block leading-tight">
            Destination
          </span>
          <span className="text-sm font-bold text-slate-900 block truncate mt-0.5">
            {destination}
          </span>
        </div>

        {/* Destination Popover */}
        {openDropdown === 'dest' && (
          <div
            className="absolute top-[calc(100%+8px)] left-0 z-50 bg-white rounded-2xl shadow-lg border border-slate-200/80 p-3 w-80 sm:w-96 animate-in fade-in slide-in-from-top-2 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-2">
              Popular Destinations in India
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {popularDestinations.map((item) => (
                <div
                  key={item.city}
                  className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors ${destination.toLowerCase().includes(item.city.toLowerCase()) ? 'bg-sky-50/60 text-sky-600 font-bold' : 'text-slate-800'}`}
                  onClick={() => handleSelectCity(item.city)}
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-location-dot text-sm text-sky-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <strong className="block text-xs font-bold">{item.city}, {item.country}</strong>
                    <span className="block text-[11px] text-slate-400">{item.stays}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="hidden lg:block w-[1px] h-9 bg-slate-200 self-center mx-2 shrink-0" />

      {/* 2. Check-in Field */}
      <div
        className="flex-1 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer relative flex items-center gap-3"
        onClick={() => setOpenDropdown(openDropdown === 'checkin' ? null : 'checkin')}
      >
        <i className="fa-regular fa-calendar text-slate-500 text-lg shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block leading-tight">
            Check-in
          </span>
          <span className="text-sm font-bold text-slate-900 block truncate mt-0.5">
            {formatDateDisplay(checkInDate)}
          </span>
        </div>

        {/* Check-in Popover */}
        {openDropdown === 'checkin' && (
          <div
            className="absolute top-[calc(100%+8px)] left-0 sm:-left-8 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <CustomDatePicker
              checkInDate={checkInDate}
              checkOutDate={checkOutDate}
              initialFocus="checkin"
              onChange={({ checkInDate: nIn, checkOutDate: nOut }) => {
                setCheckInDate(nIn);
                setCheckOutDate(nOut);
              }}
              onClose={() => setOpenDropdown(null)}
            />
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="hidden lg:block w-[1px] h-9 bg-slate-200 self-center mx-2 shrink-0" />

      {/* 3. Check-out Field */}
      <div
        className="flex-1 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer relative flex items-center gap-3"
        onClick={() => setOpenDropdown(openDropdown === 'checkout' ? null : 'checkout')}
      >
        <i className="fa-regular fa-calendar text-slate-500 text-lg shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block leading-tight">
            Check-out
          </span>
          <span className="text-sm font-bold text-slate-900 block truncate mt-0.5">
            {formatDateDisplay(checkOutDate)}
          </span>
        </div>

        {/* Check-out Popover */}
        {openDropdown === 'checkout' && (
          <div
            className="absolute top-[calc(100%+8px)] left-0 sm:-left-20 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <CustomDatePicker
              checkInDate={checkInDate}
              checkOutDate={checkOutDate}
              initialFocus="checkout"
              onChange={({ checkInDate: nIn, checkOutDate: nOut }) => {
                setCheckInDate(nIn);
                setCheckOutDate(nOut);
              }}
              onClose={() => setOpenDropdown(null)}
            />
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="hidden lg:block w-[1px] h-9 bg-slate-200 self-center mx-2 shrink-0" />

      {/* 4. Rooms & Guests Field */}
      <div
        className="flex-1 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer relative flex items-center gap-3"
        onClick={() => setOpenDropdown(openDropdown === 'guests' ? null : 'guests')}
      >
        <i className="fa-solid fa-user-group text-slate-500 text-base shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block leading-tight">
            Rooms & Guests
          </span>
          <span className="text-sm font-bold text-slate-900 block truncate mt-0.5">
            {guestsLabel}
          </span>
        </div>
        <i className="fa-solid fa-chevron-down text-slate-400 text-xs shrink-0 ml-1" />

        {/* Guests Popover */}
        {openDropdown === 'guests' && (
          <div
            className="absolute top-[calc(100%+8px)] right-0 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <CustomGuestPicker
              value={`${adults} Adults (${rooms} Room)`}
              onChange={(data) => {
                if (data.adults) setAdults(data.adults);
                if (data.rooms) setRooms(data.rooms);
                if (data.children !== undefined) setChildrenCount(data.children);
                setOpenDropdown(null);
              }}
              onClose={() => setOpenDropdown(null)}
            />
          </div>
        )}
      </div>

      {/* 5. Search Button - Brand Coral Red Theme */}
      <button
        type="button"
        className="w-full lg:w-auto bg-sky-500 hover:bg-sky-600 active:bg-sky-700 active:scale-[0.98] text-white font-bold text-sm sm:text-base px-7 py-3.5 rounded-xl shadow-xs hover:shadow-md flex items-center justify-center gap-2.5 cursor-pointer transition-all ml-0 lg:ml-2 mt-2 lg:mt-0 shrink-0"
        onClick={handleSearch}
        aria-label="Search Hotels"
      >
        <i className="fa-solid fa-magnifying-glass text-white text-sm" />
        <span>Search Hotels</span>
      </button>
    </div>
  );
}