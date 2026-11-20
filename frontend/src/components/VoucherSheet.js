'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PRESET_IMAGES, formatDate, nightsBetween } from '../utils/helpers';
import DynamicQRCode from './DynamicQRCode';

export default function VoucherSheet() {
  const {
    isVoucherSheetOpen,
    closeAllSheets,
    activeVoucherBooking,
    formatPrice,
    switchNav,
    showToast,
  } = useApp();
  const [copied, setCopied] = useState(false);
  const scrollContainerRef = useRef(null);

  // Start each confirmation at the top, even when reusing the dialog.
  useEffect(() => {
    if (isVoucherSheetOpen && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [isVoucherSheetOpen, activeVoucherBooking]);

  if (!activeVoucherBooking) return null;

  const b = activeVoucherBooking;

  // Clean, displayable short booking reference (no raw UUID wrapping)
  const displayBookingCode = b.bookingCode || (
    b.id ? (
      b.id.startsWith('BK-') || b.id.startsWith('bk-')
        ? `HF-${b.id.replace(/^bk-/i, '').slice(0, 8).toUpperCase()}`
        : b.id
    ) : 'HF-2026-CONF'
  );

  const checkInRaw = b.checkInDate || b.checkIn || '';
  const checkOutRaw = b.checkOutDate || b.checkOut || '';

  const checkInLabel = checkInRaw ? formatDate(checkInRaw, { day: 'numeric', month: 'short' }) : '—';
  const checkOutLabel = checkOutRaw ? formatDate(checkOutRaw, { day: 'numeric', month: 'short' }) : '—';
  const checkInMeta = checkInRaw
    ? `${formatDate(checkInRaw, { weekday: 'short' })} · ${formatDate(checkInRaw, { year: 'numeric' })}`
    : 'Date to be confirmed';
  const checkOutMeta = checkOutRaw
    ? `${formatDate(checkOutRaw, { weekday: 'short' })} · ${formatDate(checkOutRaw, { year: 'numeric' })}`
    : 'Date to be confirmed';

  const computedNights = nightsBetween(checkInRaw, checkOutRaw);
  const nights = Number(b.nights) || computedNights || 1;
  const roomsCount = Number(b.roomsCount) || 1;

  const rawGuestCount = b.guestCount;
  const adults = rawGuestCount && typeof rawGuestCount === 'object'
    ? Number(rawGuestCount.adults) || 0
    : Number(rawGuestCount) || 0;
  const children = rawGuestCount && typeof rawGuestCount === 'object'
    ? Number(rawGuestCount.children) || 0
    : 0;
  const resolvedAdults = adults || (children > 0 ? 0 : 2);
  const totalGuests = resolvedAdults + children;
  const guestSummary = `${totalGuests} ${totalGuests === 1 ? 'guest' : 'guests'} · ${roomsCount} ${roomsCount === 1 ? 'room' : 'rooms'}`;

  const amountPaid = Number(b.totalAmount ?? b.pricing?.finalAmount ?? b.baseRoomPrice) || 0;
  const baseTariff = Number(b.totalBaseTariff)
    || ((Number(b.baseRoomPrice) || 0) * nights * roomsCount)
    || amountPaid;
  const discountAmount = Number(b.discountAmount) || 0;
  const gstAmount = Number(b.hotelGstAmount) || 0;
  const convenienceFee = (Number(b.platformConvenienceFee) || 0) + (Number(b.convenienceFeeGst) || 0);
  const taxesAndFees = (gstAmount + convenienceFee) > 0
    ? gstAmount + convenienceFee
    : Math.max(0, amountPaid - baseTariff + discountAmount);
  const couponCode = b.couponApplied || b.couponCode || b.appliedCoupon || '';

  const normalizedStatus = String(b.status || 'CONFIRMED').toUpperCase();
  const isConfirmed = normalizedStatus === 'CONFIRMED';
  const isPaid = !b.paymentStatus || String(b.paymentStatus).toUpperCase() === 'PAID';
  const statusLabel = isConfirmed
    ? 'Confirmed'
    : normalizedStatus
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (character) => character.toUpperCase());

  const rawPaymentMethod = String(b.paymentMethod || '').toUpperCase();
  let paymentMethodLabel = 'Online payment';
  if (rawPaymentMethod.includes('UPI')) paymentMethodLabel = 'UPI';
  else if (rawPaymentMethod.includes('CARD')) paymentMethodLabel = 'Card';
  else if (rawPaymentMethod.includes('NET')) paymentMethodLabel = 'Net banking';
  else if (rawPaymentMethod.includes('HOTEL')) paymentMethodLabel = 'Pay at hotel';
  else if (rawPaymentMethod) paymentMethodLabel = rawPaymentMethod.toLowerCase().replace(/_/g, ' ');

  const hotelImage = b.hotelImage || b.roomImage || PRESET_IMAGES.palace;
  const addressLine = b.hotelAddress || b.hotelLocality || b.hotelCity || 'Address available in your itinerary';
  const isBase64QR = typeof b.qrCodeData === 'string' && b.qrCodeData.startsWith('data:image/');

  const handleCopyCode = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(displayBookingCode);
        setCopied(true);
        showToast('Booking reference copied');
        window.setTimeout(() => setCopied(false), 2000);
        return;
      }
      throw new Error('Clipboard unavailable');
    } catch {
      showToast('Could not copy the booking reference');
    }
  };

  const handleShareWhatsApp = () => {
    const text = [
      'Hotel Factories — Booking Confirmation',
      '',
      `Hotel: ${b.hotelName || '—'}`,
      `Room: ${b.roomName || '—'}`,
      `Booking reference: ${displayBookingCode}`,
      `Guest: ${b.guestName || '—'}`,
      `Check-in: ${checkInLabel}`,
      `Check-out: ${checkOutLabel}`,
      `Total paid: ${formatPrice(amountPaid)}`,
      '',
      'Present the digital pass at reception for express check-in.',
    ].join('\n');

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const openGoogleMaps = () => {
    const query = encodeURIComponent(`${b.hotelName || ''}, ${b.hotelAddress || b.hotelCity || ''}`);
    if (typeof window !== 'undefined') {
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #hf-printable-receipt,
          #hf-printable-receipt * {
            visibility: visible !important;
          }
          #hf-printable-receipt {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
          }
          #hf-confirmation-dialog,
          #hf-confirmation-scroll {
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
          }
          #hf-confirmation-dialog {
            position: static !important;
            transform: none !important;
            border: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
          #hf-printable-receipt section {
            break-inside: avoid;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        id="hf-confirmation-dialog"
        className={`bottom-sheet ${isVoucherSheetOpen ? 'active' : ''} z-[1200] flex !max-h-[92dvh] !max-w-[640px] flex-col !overflow-hidden !p-0 rounded-t-[28px] border border-slate-200 bg-slate-50 shadow-2xl md:!max-h-[88vh] md:rounded-3xl`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-confirmation-title"
        aria-describedby="booking-confirmation-subtitle"
      >
        {/* Mobile touch handle */}
        <div className="sheet-handle mx-auto mt-2 mb-0.5 h-1 w-10 shrink-0 rounded-full bg-slate-300 md:hidden"></div>

        {/* Fixed header */}
        <header className="no-print shrink-0 border-b border-slate-200/80 bg-white px-4 pb-4 pt-3 sm:px-6 sm:pb-5 sm:pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3 sm:gap-3.5">
              <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ${
                isConfirmed
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                  : 'bg-amber-50 text-amber-700 ring-amber-100'
              }`}>
                <i className={`fa-solid ${isConfirmed ? 'fa-check' : 'fa-circle-info'} text-sm`} aria-hidden="true"></i>
              </span>

              <div className="min-w-0">
                <p className={`text-[11px] font-bold uppercase tracking-[0.16em] ${isConfirmed ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {isConfirmed ? 'Booking confirmed' : 'Reservation details'}
                </p>
                <h2 id="booking-confirmation-title" className="mt-1 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                  {isConfirmed ? 'Your stay is confirmed' : 'Your reservation'}
                </h2>
                <p id="booking-confirmation-subtitle" className="mt-1 break-words text-xs leading-relaxed text-slate-500 sm:text-[13px]">
                  {b.guestEmail ? (
                    <>
                      Reservation confirmed for{' '}
                      <span className="font-medium text-slate-700">{b.guestEmail}</span>.
                    </>
                  ) : (
                    'Your reservation has been confirmed successfully.'
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeAllSheets}
              className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 sm:h-10 sm:w-10"
              aria-label="Close confirmation"
            >
              <i className="fa-solid fa-xmark text-base" aria-hidden="true"></i>
            </button>
          </div>
        </header>

        {/* Scrollable body (works on mobile and desktop) */}
        <div
          ref={scrollContainerRef}
          id="hf-confirmation-scroll"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin]"
        >
          <div id="hf-printable-receipt" className="space-y-4 p-4 sm:space-y-5 sm:p-6">
            {/* Print-only document heading */}
            <div className="hidden border-b border-slate-200 pb-4 print:block">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Hotel Factories
              </p>
              <h1 className="mt-1 text-xl font-bold text-slate-900">Booking confirmation</h1>
              <p className="mt-1 text-xs text-slate-500">
                {displayBookingCode} · {b.guestName || 'Primary guest'}
              </p>
            </div>

            {/* Hotel + booking reference */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex gap-3.5 p-4 sm:gap-4 sm:p-5">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-28 sm:w-28">
                  <img
                    src={hotelImage}
                    alt={b.hotelName || 'Hotel'}
                    loading="lazy"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = PRESET_IMAGES.palace;
                    }}
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
                      isConfirmed
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                        : 'bg-amber-50 text-amber-700 ring-amber-100'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${isConfirmed ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      {statusLabel}
                    </span>
                    {b.hotelCity && (
                      <span className="text-[11px] font-medium text-slate-500">{b.hotelCity}</span>
                    )}
                  </div>

                  <h3 className="mt-1.5 truncate text-[15px] font-bold tracking-tight text-slate-900 sm:text-base">
                    {b.hotelName || 'Your hotel'}
                  </h3>

                  <p className="mt-1 flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500 sm:text-xs">
                    <i className="fa-solid fa-location-dot mt-0.5 shrink-0 text-slate-400" aria-hidden="true"></i>
                    <span className="line-clamp-2">{addressLine}</span>
                  </p>

                  <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs font-semibold text-slate-800 sm:text-[13px]">
                    <i className="fa-solid fa-bed text-slate-400" aria-hidden="true"></i>
                    <span className="truncate">{b.roomName || 'Room'}</span>
                    <span className="font-normal text-slate-300">·</span>
                    <span className="font-normal text-slate-500">
                      {roomsCount} {roomsCount === 1 ? 'room' : 'rooms'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
                <div className="min-w-0">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    Booking reference
                  </span>
                  <span className="mt-0.5 block truncate font-mono text-[13px] font-bold tracking-[0.08em] text-slate-800">
                    {displayBookingCode}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
                >
                  <i className={`fa-solid ${copied ? 'fa-check text-emerald-600' : 'fa-copy'} text-[10px]`} aria-hidden="true"></i>
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </section>

            {/* Stay details */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-900">Stay details</h3>
                <span className="text-[11px] font-medium text-slate-400">
                  {nights} {nights === 1 ? 'night' : 'nights'}
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Check-in</dt>
                  <dd className="mt-1 text-[15px] font-bold tracking-tight text-slate-900">{checkInLabel}</dd>
                  <dd className="mt-0.5 text-[11px] text-slate-500">{checkInMeta}</dd>
                </div>

                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Check-out</dt>
                  <dd className="mt-1 text-[15px] font-bold tracking-tight text-slate-900">{checkOutLabel}</dd>
                  <dd className="mt-0.5 text-[11px] text-slate-500">{checkOutMeta}</dd>
                </div>

                <div className="col-span-2 border-t border-slate-100 pt-4 sm:col-span-1 sm:border-0 sm:pt-0">
                  <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Guests</dt>
                  <dd className="mt-1 text-[15px] font-bold tracking-tight text-slate-900">
                    {totalGuests} {totalGuests === 1 ? 'guest' : 'guests'}
                  </dd>
                  <dd className="mt-0.5 text-[11px] text-slate-500">
                    {resolvedAdults} {resolvedAdults === 1 ? 'adult' : 'adults'}
                    {children > 0 ? ` · ${children} ${children === 1 ? 'child' : 'children'}` : ''}
                    {' · '}
                    {roomsCount} {roomsCount === 1 ? 'room' : 'rooms'}
                  </dd>
                </div>
              </dl>

              {b.specialRequests && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] leading-relaxed text-slate-600">
                  <i className="fa-regular fa-comment-dots mt-0.5 shrink-0 text-slate-400" aria-hidden="true"></i>
                  <span>{b.specialRequests}</span>
                </div>
              )}
            </section>

            {/* Live Dynamic QR Check-in Pass */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <DynamicQRCode booking={b} size={80} showLabel={true} />
            </section>

            {/* Payment summary */}
            <section className="rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-5">
                <h3 className="text-sm font-bold text-slate-900">Payment summary</h3>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
                  isPaid
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                    : 'bg-amber-50 text-amber-700 ring-amber-100'
                }`}>
                  <i className={`fa-solid ${isPaid ? 'fa-check' : 'fa-clock'} text-[8px]`} aria-hidden="true"></i>
                  {isPaid ? 'Paid' : 'Payment pending'}
                </span>
              </div>

              <div className="px-4 pb-4 pt-3 sm:px-5">
                <dl className="space-y-2.5 text-[13px]">
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-slate-500">
                      Room tariff
                      <span className="ml-1 text-[11px] text-slate-500">
                        × {nights} {nights === 1 ? 'night' : 'nights'}
                      </span>
                    </dt>
                    <dd className="shrink-0 font-medium text-slate-800">{formatPrice(baseTariff)}</dd>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-slate-500">
                        Offer discount
                        {couponCode ? <span className="ml-1 text-[11px] text-slate-500">({couponCode})</span> : null}
                      </dt>
                      <dd className="shrink-0 font-medium text-emerald-700">−{formatPrice(discountAmount)}</dd>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-slate-500">Taxes &amp; fees</dt>
                    <dd className="shrink-0 font-medium text-slate-800">{formatPrice(taxesAndFees)}</dd>
                  </div>
                </dl>

                <div className="mt-3 flex items-end justify-between gap-4 border-t border-slate-100 pt-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{isPaid ? 'Total paid' : 'Total amount'}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">Inclusive of all taxes and fees</p>
                  </div>
                  <p className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    {formatPrice(amountPaid)}
                  </p>
                </div>

                <p className="mt-2 text-[11px] text-slate-500">
                  {isPaid ? `Paid via ${paymentMethodLabel}` : `Payment method: ${paymentMethodLabel}`}
                </p>
              </div>
            </section>

            {/* Property address + support */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    Property address
                  </p>
                  <p className="mt-1 text-[13px] font-semibold text-slate-900">{b.hotelName}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{addressLine}</p>
                </div>

                <button
                  type="button"
                  onClick={openGoogleMaps}
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
                >
                  Directions
                  <i className="fa-solid fa-arrow-up-right-from-square text-[9px] text-slate-400" aria-hidden="true"></i>
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="inline-flex items-center gap-2 text-[11px] font-medium text-slate-500">
                  <i className="fa-solid fa-headset text-slate-400" aria-hidden="true"></i>
                  24/7 Hotel Factories guest care
                </span>
                <a
                  href="tel:+9118004207829"
                  className="text-[11px] font-bold text-slate-800 hover:underline"
                >
                  1800-420-STAY
                </a>
              </div>
            </section>

            <p className="flex items-start gap-2 px-1 pb-1 text-[11px] leading-relaxed text-slate-500">
              <i className="fa-regular fa-id-card mt-0.5 shrink-0" aria-hidden="true"></i>
              <span>
                All adult guests must present a valid government-issued photo ID at check-in.
                Special requests are subject to availability.
              </span>
            </p>
          </div>
        </div>

        {/* Fixed footer actions */}
        <footer
          className="no-print shrink-0 border-t border-slate-200 bg-white px-4 pt-3 sm:px-5"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
            >
              <i className="fa-brands fa-whatsapp text-sm text-emerald-600" aria-hidden="true"></i>
              WhatsApp
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
            >
              <i className="fa-solid fa-print text-xs text-slate-400" aria-hidden="true"></i>
              Print
            </button>

            <button
              type="button"
              onClick={() => {
                closeAllSheets();
                switchNav('bookings');
              }}
              className="col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 text-xs font-semibold text-white transition-colors hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 sm:col-span-1"
            >
              <i className="fa-solid fa-suitcase text-xs" aria-hidden="true"></i>
              My trips
            </button>
          </div>
        </footer>
      </div>
    </>
  );
}
