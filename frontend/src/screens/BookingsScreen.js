'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PRESET_IMAGES, formatDate, nightsBetween } from '../utils/helpers';

export default function BookingsScreen() {
  const { bookings, formatPrice, openVoucherSheet, switchNav, showToast, user, setIsAuthSheetOpen } = useApp();
  const [tripTab, setTripTab] = useState('upcoming'); // upcoming | completed | cancelled

  const upcomingList = bookings.filter(b => {
    const s = String(b.status || '').toLowerCase();
    return s !== 'completed' && s !== 'cancelled';
  });
  const completedList = bookings.filter(b => String(b.status || '').toLowerCase() === 'completed');
  const cancelledList = bookings.filter(b => String(b.status || '').toLowerCase() === 'cancelled');

  const displayedBookings = tripTab === 'upcoming' 
    ? (upcomingList.length > 0 ? upcomingList : bookings) 
    : tripTab === 'completed' 
      ? completedList 
      : cancelledList;

  return (
    <div className="hf-page-wrapper container max-w-[1360px] mx-auto px-4 sm:px-8 py-6 pb-28 md:pb-16 text-slate-800">
      
      {/* Top Breadcrumbs */}
      <div className="hf-breadcrumb-bar flex items-center gap-2 text-xs text-slate-500 py-2.5 mb-2">
        <button
          type="button"
          className="breadcrumb-link inline-flex items-center gap-1.5 hover:text-black cursor-pointer transition-colors"
          onClick={() => switchNav('home')}
        >
          <i className="fa-solid fa-hotel text-slate-400"></i> Stays
        </button>
        <span className="breadcrumb-separator text-slate-300">/</span>
        <span className="breadcrumb-current text-slate-900 font-semibold">My Trips &amp; Reservations</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>My Trips &amp; Reservations</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access your confirmed stays, mobile check-in vouchers, hotel concierge, and reservation details.
          </p>
        </div>
        
        <button
          type="button"
          onClick={() => showToast('Reservations refreshed')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer transition-all shadow-2xs self-start sm:self-auto"
        >
          <i className="fa-solid fa-rotate-right text-slate-400" />
          <span>Refresh Stays</span>
        </button>
      </div>

      {/* Tabs Strip - Big Brand Hospitality Style */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6 overflow-x-auto no-scrollbar">
        <button 
          type="button"
          className={`inline-flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 cursor-pointer transition-all whitespace-nowrap ${
            tripTab === 'upcoming' 
              ? 'border-black text-black' 
              : 'border-transparent text-slate-500 hover:text-black'
          }`}
          onClick={() => setTripTab('upcoming')}
        >
          <i className="fa-solid fa-calendar-check text-xs" />
          <span>Upcoming Stays ({upcomingList.length > 0 ? upcomingList.length : bookings.length})</span>
        </button>

        <button 
          type="button"
          className={`inline-flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 cursor-pointer transition-all whitespace-nowrap ${
            tripTab === 'completed' 
              ? 'border-black text-black' 
              : 'border-transparent text-slate-500 hover:text-black'
          }`}
          onClick={() => setTripTab('completed')}
        >
          <i className="fa-solid fa-clock-rotate-left text-xs" />
          <span>Past Stays ({completedList.length})</span>
        </button>

        {cancelledList.length > 0 && (
          <button 
            type="button"
            className={`inline-flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 cursor-pointer transition-all whitespace-nowrap ${
              tripTab === 'cancelled' 
                ? 'border-black text-black' 
                : 'border-transparent text-slate-500 hover:text-black'
            }`}
            onClick={() => setTripTab('cancelled')}
          >
            <i className="fa-solid fa-ban text-xs" />
            <span>Cancelled ({cancelledList.length})</span>
          </button>
        )}
      </div>

      {/* Bookings Grid or Empty State */}
      <div>
        {displayedBookings.length === 0 ? (
          <div className="text-center p-10 sm:p-14 bg-white rounded-md border border-dashed border-slate-300 my-6 flex flex-col items-center">
            <div className="w-14 h-14 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 text-2xl mb-3">
              <i className="fa-solid fa-hotel" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1">
              No {tripTab === 'upcoming' ? 'Upcoming' : tripTab === 'completed' ? 'Past' : 'Cancelled'} Reservations
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mb-5 leading-relaxed">
              You do not have any {tripTab} hotel stays scheduled. Browse our curated luxury suites and boutique retreats to book your next trip.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-black text-white font-bold text-xs hover:bg-slate-800 cursor-pointer transition-all shadow-xs"
                onClick={() => switchNav('home')}
              >
                <i className="fa-solid fa-hotel" />
                <span>Explore Stays</span>
              </button>
              {!user && (
                <button 
                  type="button"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-white text-slate-800 border border-slate-300 font-bold text-xs hover:bg-slate-50 cursor-pointer transition-all" 
                  onClick={() => setIsAuthSheetOpen(true)}
                >
                  <i className="fa-solid fa-user" />
                  <span>Sign In for Past Stays</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            {displayedBookings.map(b => {
              const bId = b.id || b._id || '';
              const displayCode = b.bookingCode || (
                bId.startsWith('BK-') || bId.startsWith('bk-')
                  ? `HF-${bId.replace(/^bk-/i, '').slice(0, 8).toUpperCase()}`
                  : bId.length > 14
                    ? `HF-${bId.slice(-8).toUpperCase()}`
                    : bId || 'HF-RESERVATION'
              );
              
              const rawCheckIn = b.checkInDate || b.checkIn || '';
              const rawCheckOut = b.checkOutDate || b.checkOut || '';
              const checkInLabel = rawCheckIn ? formatDate(rawCheckIn, { weekday: 'short', day: 'numeric', month: 'short' }) : 'Confirmed on Arrival';
              const checkOutLabel = rawCheckOut ? formatDate(rawCheckOut, { weekday: 'short', day: 'numeric', month: 'short' }) : 'Confirmed on Arrival';
              const computedNights = nightsBetween(rawCheckIn, rawCheckOut);
              const nights = Number(b.nights) || computedNights || 1;
              const roomsCount = Number(b.roomsCount) || 1;

              const normalizedStatus = String(b.status || 'Confirmed').toLowerCase();
              const isConfirmed = normalizedStatus === 'confirmed' || normalizedStatus === 'paid';
              const isCancelled = normalizedStatus === 'cancelled';

              return (
                <article
                  key={bId}
                  className="rounded-md border border-slate-200/90 bg-white hover:border-slate-400 hover:shadow-md transition-all overflow-hidden flex flex-col justify-between w-full shadow-2xs group"
                >
                  {/* Top Confirmation Bar (Boarding Pass / Voucher Style) */}
                  <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-2.5 border-b border-slate-100 bg-slate-50/70">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">
                        CONFIRMATION
                      </span>
                      <strong className="text-xs sm:text-sm font-mono font-bold text-slate-900 truncate">
                        {displayCode}
                      </strong>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(b.bookingCode || bId);
                          showToast('Confirmation code copied!');
                        }}
                        className="text-slate-400 hover:text-black p-0.5 text-xs shrink-0 cursor-pointer transition-colors"
                        title="Copy confirmation code"
                        aria-label="Copy code"
                      >
                        <i className="fa-regular fa-copy text-[11px]" />
                      </button>
                    </div>

                    <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                      isConfirmed
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : isCancelled
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      <i className={`fa-solid ${
                        isConfirmed ? 'fa-circle-check text-emerald-600' :
                        isCancelled ? 'fa-circle-xmark text-rose-600' :
                        'fa-clock text-amber-600'
                      } text-[9px]`} />
                      <span>{isConfirmed ? 'Guaranteed Stay' : b.status || 'Confirmed'}</span>
                    </span>
                  </div>

                  {/* Main Body */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                    
                    {/* Hotel Details Row */}
                    <div className="flex gap-3.5 sm:gap-4 items-start">
                      <img 
                        src={b.hotelImage || PRESET_IMAGES.palace} 
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-md object-cover border border-slate-100 shrink-0 shadow-2xs" 
                        alt={b.hotelName} 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60 inline-flex items-center gap-1">
                            <i className="fa-solid fa-crown text-[8px]" />
                            <span>Hotel Factories Partner</span>
                          </span>
                        </div>
                        <h3 className="font-black text-base sm:text-lg text-slate-900 tracking-tight leading-snug truncate">
                          {b.hotelName}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 truncate mt-0.5">
                          <i className="fa-solid fa-location-dot text-slate-400 text-xs shrink-0" />
                          <span>{b.hotelCity || b.city || b.hotelLocation || 'India'}</span>
                        </p>
                        <p className="text-xs text-slate-700 font-semibold flex items-center gap-1.5 truncate mt-1">
                          <i className="fa-solid fa-bed text-sky-600 text-xs shrink-0" />
                          <span className="truncate">{b.roomName || 'Deluxe Luxury Room'} • {roomsCount} {roomsCount === 1 ? 'Room' : 'Rooms'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Check-in / Check-out Boarding Pass Strip */}
                    <div className="bg-slate-50/90 rounded-md p-3 border border-slate-100 grid grid-cols-2 gap-2 text-slate-800">
                      <div className="border-r border-slate-200/80 pr-2">
                        <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          CHECK-IN
                        </span>
                        <strong className="block text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 truncate">
                          {checkInLabel}
                        </strong>
                        <span className="block text-[11px] text-slate-500">
                          From 2:00 PM
                        </span>
                      </div>

                      <div className="pl-2">
                        <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          CHECK-OUT
                        </span>
                        <strong className="block text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 truncate">
                          {checkOutLabel}
                        </strong>
                        <span className="block text-[11px] text-slate-500">
                          By 11:00 AM ({nights} {nights === 1 ? 'Night' : 'Nights'})
                        </span>
                      </div>
                    </div>

                    {/* Inclusions & Guest Row */}
                    <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100 flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 truncate text-[11px]">
                        <i className="fa-solid fa-user text-slate-400 text-xs" />
                        <span className="truncate">
                          Guest: <strong className="text-slate-900 font-bold">{b.guestName || user?.name || 'Valued Guest'}</strong>
                          {b.guestCount && typeof b.guestCount === 'object' && (b.guestCount.adultsMale !== undefined || b.guestCount.adultsFemale !== undefined) ? (
                            <span className="text-slate-500 font-medium ml-1">
                              ({b.guestCount.adultsMale || 0}M, {b.guestCount.adultsFemale || 0}F)
                            </span>
                          ) : null}
                        </span>
                      </div>
                      {/* Dynamic Inclusions & Verified Amenities from Booking */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                        {Array.isArray(b.amenities) && b.amenities.length > 0 ? (
                          b.amenities.slice(0, 2).map((am, amIdx) => (
                            <span key={amIdx} className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                              <i className="fa-solid fa-circle-check text-[9px]" /> {am}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                            <i className="fa-solid fa-shield text-[9px] text-sky-600" /> Verified Property Reservation
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dynamic Refund & Cancellation Banner (When Cancelled) */}
                    {isCancelled && (
                      <div className="bg-rose-50/90 rounded-md p-3 border border-rose-200/80 text-xs text-rose-950 space-y-1">
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5 text-rose-900">
                            <i className="fa-solid fa-ban text-rose-600" />
                            Reservation Cancelled
                          </span>
                          {b.refundAmount > 0 ? (
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                              Refund: {formatPrice(b.refundAmount)} ({b.refundStatus === 'REFUNDED' ? 'Processed' : 'Processing'})
                            </span>
                          ) : (
                            <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              Non-Refundable
                            </span>
                          )}
                        </div>
                        {b.cancellationFee > 0 && (
                          <p className="text-[11px] text-rose-700">
                            Cancellation fee applied: {formatPrice(b.cancellationFee)}
                          </p>
                        )}
                      </div>
                    )}

                  </div>

                  {/* Card Action Footer */}
                  <div className="px-4 sm:px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {isCancelled 
                          ? 'BOOKING TOTAL' 
                          : b.paymentMode === 'hotel' || b.paymentStatus === 'PENDING' 
                            ? 'PAYABLE AT HOTEL' 
                            : 'TOTAL PAID ONLINE'}
                      </span>
                      <div className="text-base sm:text-lg font-black text-slate-900">
                        {formatPrice(b.totalAmount || b.pricing?.finalAmount || 0)}
                      </div>
                      {b.paymentMode === 'hotel' && !isCancelled && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/70 px-1.5 py-0.2 rounded inline-block mt-0.5">
                          Pay on Arrival
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.hotelName + ' ' + (b.hotelCity || b.city || ''))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-md border border-slate-200 hover:border-black text-slate-700 hover:text-black text-xs font-bold transition-all inline-flex items-center gap-1.5 bg-white cursor-pointer"
                        title="Get Hotel Directions"
                      >
                        <i className="fa-solid fa-location-arrow text-sky-600 text-xs" />
                        <span className="hidden sm:inline">Directions</span>
                      </a>

                      <button 
                        type="button"
                        className="px-4 py-2 rounded-md bg-slate-900 hover:bg-black text-white font-bold text-xs transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer active:scale-[0.98]"
                        onClick={() => openVoucherSheet(b)}
                      >
                        <i className="fa-solid fa-qrcode text-amber-400" />
                        <span>Digital Voucher</span>
                      </button>
                    </div>
                  </div>

                </article>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
