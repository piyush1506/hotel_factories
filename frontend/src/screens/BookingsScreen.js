'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PRESET_IMAGES } from '../utils/helpers';

export default function BookingsScreen() {
  const { bookings, formatPrice, openVoucherSheet, switchNav, showToast, user, setIsAuthSheetOpen } = useApp();
  const [tripTab, setTripTab] = useState('upcoming'); // upcoming | completed

  return (
    <div className="hf-page-wrapper container max-w-[1360px] mx-auto px-4 sm:px-8 py-6">
      {/* Top Breadcrumbs */}
      <div className="hf-breadcrumb-bar flex items-center gap-2 text-xs text-slate-500 py-3">
        <button className="breadcrumb-link inline-flex items-center gap-1.5 hover:text-brand cursor-pointer" onClick={() => switchNav('home')}>
          <i className="fa-solid fa-house"></i> Home
        </button>
        <span className="breadcrumb-separator text-slate-300">/</span>
        <span className="breadcrumb-current text-slate-700 font-semibold">My Bookings &amp; Reservations</span>
      </div>

      <div className="hf-section-head-clean flex items-center justify-between mb-6">
        <div>
          <h1 className="hf-page-title text-2xl font-extrabold text-ink tracking-tight">My Trips &amp; Reservations</h1>
          <p className="hf-page-subtitle text-xs text-slate-500 mt-1">Access your instant e-tickets, hotel vouchers, check-in QR codes, and cancellation options.</p>
        </div>
        <button className="hf-icon-pill-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer transition-colors" onClick={() => showToast('Reservations refreshed')} title="Refresh">
          <i className="fa-solid fa-rotate-right text-brand"></i>
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="hf-tabs-bar flex items-center gap-2 border-b border-slate-200 mb-6">
        <button 
          className={`hf-tab-item inline-flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 cursor-pointer transition-colors ${tripTab === 'upcoming' ? 'active border-brand text-brand' : 'border-transparent text-slate-500 hover:text-ink'}`}
          onClick={() => setTripTab('upcoming')}
        >
          <i className="fa-solid fa-calendar-check"></i>
          <span>Upcoming Stays ({bookings.length})</span>
        </button>
        <button 
          className={`hf-tab-item inline-flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 cursor-pointer transition-colors ${tripTab === 'completed' ? 'active border-brand text-brand' : 'border-transparent text-slate-500 hover:text-ink'}`}
          onClick={() => setTripTab('completed')}
        >
          <i className="fa-solid fa-circle-check"></i>
          <span>Completed Trips (0)</span>
        </button>
      </div>

      {/* Bookings List or Empty State */}
      <div className="hf-bookings-container">
        {bookings.length === 0 || tripTab === 'completed' ? (
          <div className="hf-empty-state-card text-center p-12 bg-white rounded-2xl border border-dashed border-slate-300 my-6 flex flex-col items-center">
            <i className="fa-solid fa-plane-departure empty-icon text-4xl text-brand mb-3"></i>
            <h3 className="text-lg font-bold text-ink mb-1">No {tripTab === 'upcoming' ? 'Upcoming' : 'Completed'} Trips Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mb-5">You have no reservations currently scheduled. Browse our handpicked luxury properties and book your next unforgettable getaway.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button className="hf-search-main-btn inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand text-white font-bold text-xs hover:bg-brand-hover cursor-pointer transition-all" onClick={() => switchNav('home')}>
                <i className="fa-solid fa-compass"></i> Explore Stays
              </button>
              {!user && (
                <button 
                  className="hf-search-main-btn inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-brand border border-slate-200 font-bold text-xs hover:bg-slate-50 cursor-pointer transition-all" 
                  onClick={() => setIsAuthSheetOpen(true)}
                >
                  <i className="fa-solid fa-user"></i> Sign In to View Past Stays
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="hf-bookings-grid grid grid-cols-1 md:grid-cols-2 gap-5">
            {bookings.map(b => {
              const bId = b.id || b._id;
              return (
                <div key={bId} className="hf-booking-card-luxury rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="b-card-header flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="b-ref-col">
                      <span className="b-ref-label block text-[10px] font-bold text-slate-400 uppercase tracking-wider">RESERVATION REF</span>
                      <strong className="b-ref-code text-sm font-mono font-bold text-ink whitespace-nowrap">{bId}</strong>
                    </div>
                    <span className="b-status-pill confirmed inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      <i className="fa-solid fa-circle-check"></i> {b.status || 'Confirmed'}
                    </span>
                  </div>

                  <div className="b-card-body flex gap-4 py-4">
                    <img 
                      src={b.hotelImage || PRESET_IMAGES.palace} 
                      className="b-hotel-thumb w-24 h-24 rounded-xl object-cover shrink-0" 
                      alt={b.hotelName} 
                    />
                    <div className="b-hotel-info flex-1 min-w-0">
                      <h3 className="b-hotel-name font-bold text-base text-ink truncate mb-1">{b.hotelName}</h3>
                      <div className="b-room-name text-xs text-slate-600 mb-1 flex items-center gap-1.5"><i className="fa-solid fa-bed text-brand"></i> {b.roomName}</div>
                      <div className="b-dates-row text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                        <i className="fa-regular fa-calendar-days text-slate-400"></i>
                        <span>{b.checkIn} &rarr; {b.checkOut} ({b.nights || 1} {(b.nights || 1) === 1 ? 'Night' : 'Nights'})</span>
                      </div>
                      <div className="b-guest-text text-xs text-slate-500 flex items-center gap-1.5">
                        <i className="fa-solid fa-user text-slate-400"></i> Primary Guest: <strong>{b.guestName || user?.name || ''}</strong>{b.guests || b.guestCount ? ` (${b.guests || `${b.guestCount} Guests`})` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="b-card-footer flex items-center justify-between pt-3 border-t border-slate-100">
                    <div>
                      <span className="b-total-label block text-[10px] text-slate-400 font-semibold uppercase">Total Amount Paid</span>
                      <div className="b-total-price font-extrabold text-base text-ink">
                        {formatPrice(b.totalAmount || b.pricing?.finalAmount || 0)}
                      </div>
                    </div>
                    <button 
                      className="b-voucher-btn inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                      onClick={() => openVoucherSheet(b)}
                    >
                      <i className="fa-solid fa-qrcode"></i> View E-Ticket Voucher
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
