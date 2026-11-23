'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PRESET_IMAGES, getAmenityIcon, getRoomCapacity, getRoomSize, getRoomPrice } from '../utils/helpers';

export default function RoomCard({ hotel, room }) {
  const { formatPrice, openBookingSheet } = useApp();

  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [selectedPlanId, setSelectedPlanId] = useState('breakfast');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Compute multiple high-resolution images for this room
  const roomImages = useMemo(() => {
    if (room.images && Array.isArray(room.images) && room.images.length > 0) {
      return room.images;
    }
    const list = [];
    if (room.image) list.push(room.image);

    // Provide diverse perspectives (suite interior, balcony, bathroom, luxury bedroom)
    const alternates = [
      PRESET_IMAGES?.suite,
      PRESET_IMAGES?.balcony,
      PRESET_IMAGES?.villa,
      ...(hotel?.images || [])
    ].filter(Boolean);

    for (const alt of alternates) {
      if (!list.includes(alt) && list.length < 5) {
        list.push(alt);
      }
    }

    if (list.length === 0) {
      list.push(PRESET_IMAGES?.suite || '/placeholder-hotel.jpg');
    }
    return list;
  }, [room, hotel]);

  const prevImage = (e) => {
    if (e) e.stopPropagation();
    setActiveImgIndex((prev) => (prev > 0 ? prev - 1 : roomImages.length - 1));
  };

  const nextImage = (e) => {
    if (e) e.stopPropagation();
    setActiveImgIndex((prev) => (prev < roomImages.length - 1 ? prev + 1 : 0));
  };

  // Keyboard navigation when detail modal is open
  useEffect(() => {
    if (!isDetailModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsDetailModalOpen(false);
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDetailModalOpen, roomImages.length]);

  const basePrice = getRoomPrice(room);
  const rawOriginal = Number(room.originalPrice || Math.round(basePrice * 1.25));

  // Dynamic Room / Property Cancellation & Refund Policy
  const roomPolicy = room?.cancellationPolicy || hotel?.cancellationPolicy;
  const cancellationNote = useMemo(() => {
    if (roomPolicy) {
      if (roomPolicy.refundable !== false && String(roomPolicy.type || '').toUpperCase() !== 'NON_REFUNDABLE') {
        return roomPolicy.badgeText || (roomPolicy.windowHours ? `Refundable (${roomPolicy.windowHours}h window)` : 'Refundable stay');
      }
      return roomPolicy.badgeText || 'Non-Refundable (Property Policy)';
    }
    return hotel?.policies?.cancellation || 'Property cancellation terms apply';
  }, [roomPolicy, hotel?.policies]);

  // Dynamic Rate Plan Options based on room package configuration
  const ratePlans = useMemo(() => {
    if (Array.isArray(room.ratePlans) && room.ratePlans.length > 0) {
      return room.ratePlans.map((p) => ({
        ...p,
        cancellation: p.cancellation || cancellationNote
      }));
    }
    if (room.freeBreakfast) {
      return [
        {
          id: 'breakfast',
          name: 'Breakfast Included',
          description: 'Daily buffet breakfast included with your reservation',
          priceDelta: 0,
          badge: 'INCLUDED',
          cancellation: cancellationNote
        },
        {
          id: 'half_board',
          name: 'Breakfast + Dinner Included',
          description: 'Lavish dinner buffet & complimentary morning breakfast',
          priceDelta: Math.max(800, Math.round(basePrice * 0.16)),
          badge: 'BEST VALUE',
          cancellation: cancellationNote
        }
      ];
    }
    return [
      {
        id: 'room_only',
        name: 'Room Only (Standard)',
        description: 'Flexible stay with option to order dining a-la-carte',
        priceDelta: 0,
        badge: 'ECONOMY',
        cancellation: cancellationNote
      },
      {
        id: 'breakfast_addon',
        name: 'Room + Breakfast Buffet',
        description: 'Chef breakfast spread added for all registered guests',
        priceDelta: Math.max(450, Math.round(basePrice * 0.12)),
        badge: 'RECOMMENDED',
        cancellation: cancellationNote
      }
    ];
  }, [room.ratePlans, room.freeBreakfast, basePrice, cancellationNote]);

  // Dynamic Combined Room Amenities & In-Suite Facilities
  const dynamicRoomAmenities = useMemo(() => {
    const list = [];
    if (Array.isArray(room.amenities)) list.push(...room.amenities);
    if (Array.isArray(room.facilities)) list.push(...room.facilities);
    if (Array.isArray(room.features)) list.push(...room.features);
    if (list.length === 0 && Array.isArray(hotel?.amenities)) {
      list.push(...hotel.amenities);
    }
    return Array.from(new Set(list.filter(Boolean)));
  }, [room.amenities, room.facilities, room.features, hotel?.amenities]);

  const selectedPlan = ratePlans.find((p) => p.id === selectedPlanId) || ratePlans[0];
  const finalPrice = Math.max(500, basePrice + selectedPlan.priceDelta);
  const finalOriginal = Math.max(finalPrice + 400, rawOriginal + selectedPlan.priceDelta);
  const taxesApprox = Math.round(finalPrice * 0.12);
  const discountPercent = Math.round(((finalOriginal - finalPrice) / finalOriginal) * 100);

  // Specifications
  const roomSizeStr = getRoomSize(room) || '480 sq ft';
  const roomCapacityStr = getRoomCapacity(room);
  const bedTypeStr = room.bedType || '1 King Bed';
  const roomTypeLabel = (room.type || room.category || 'DELUXE ROOM').toUpperCase();

  // Extract or infer view from amenities/name
  const viewBadge = useMemo(() => {
    const combined = `${room.name || ''} ${(room.amenities || []).join(' ')}`.toLowerCase();
    if (combined.includes('lake view')) return 'Lake View';
    if (combined.includes('sea view') || combined.includes('ocean')) return 'Sea View';
    if (combined.includes('courtyard')) return 'Courtyard View';
    if (combined.includes('garden')) return 'Garden View';
    if (combined.includes('himalayan') || combined.includes('mountain')) return 'Mountain View';
    if (combined.includes('skyline') || combined.includes('city')) return 'Skyline View';
    if (combined.includes('balcony')) return 'Private Balcony';
    return 'Scenic View';
  }, [room]);

  // Handle Booking with selected package configuration
  const handleBook = () => {
    const configuredRoom = {
      ...room,
      basePrice: finalPrice,
      pricePerNight: finalPrice,
      selectedMealPlan: selectedPlan.name,
      mealPlan: selectedPlan.name
    };
    openBookingSheet(hotel, configuredRoom);
  };

  const inventoryLeft = Number(room.totalInventory || 5);

  return (
    <>
      <article className="mmt-room-card group">
        {/* ================= COLUMN 1: VISUAL SHOWCASE ================= */}
        <div className="mmt-room-gallery-col">
          {/* Main Stage Image */}
          <div 
            className="mmt-room-main-img-box relative cursor-pointer" 
            onClick={() => setIsDetailModalOpen(true)}
            title="Click to view full room photo gallery"
          >
            <img 
              src={roomImages[activeImgIndex] || roomImages[0]} 
              alt={`${room.name} - Photo ${activeImgIndex + 1}`}
              loading="lazy"
              onError={(e) => { 
                e.currentTarget.src = PRESET_IMAGES?.suite || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'; 
              }}
              className="mmt-room-stage-img"
            />

            {/* Gradient Overlay for Top Badges */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-slate-900/40 pointer-events-none" />

            {/* Top Badge: Room Category */}
            <div className="room-category-pill absolute top-3 left-3 z-10">
              <i className="fa-solid fa-crown text-[10px] text-amber-300 mr-1" />
              <span>{roomTypeLabel}</span>
            </div>

            {/* View Pill */}
            <div className="room-view-pill absolute top-3 right-3 z-10">
              <i className="fa-solid fa-eye text-[10px] mr-1" />
              <span>{viewBadge}</span>
            </div>

            {/* Bottom Overlay Info: Photo Counter + Lightbox Trigger */}
            <div className="room-photo-counter-bar absolute bottom-2 left-3 right-3 z-10 flex items-center justify-between text-white text-[11px] font-semibold">
              <span className="inline-flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full">
                <i className="fa-solid fa-camera text-[10px]" />
                {activeImgIndex + 1}/{roomImages.length} Photos
              </span>
              <button 
                type="button" 
                className="room-expand-photo-btn inline-flex items-center gap-1 bg-white/90 hover:bg-white text-slate-800 backdrop-blur-md px-2 py-0.5 rounded-full shadow-xs transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDetailModalOpen(true);
                }}
              >
                <i className="fa-solid fa-expand text-[10px]" /> Expand
              </button>
            </div>

            {/* Carousel Arrow Controls */}
            {roomImages.length > 1 && (
              <>
                <button
                  type="button"
                  className="room-carousel-arrow room-carousel-prev"
                  onClick={prevImage}
                  aria-label="Previous photo"
                  title="Previous photo"
                >
                  <i className="fa-solid fa-chevron-left" />
                </button>
                <button
                  type="button"
                  className="room-carousel-arrow room-carousel-next"
                  onClick={nextImage}
                  aria-label="Next photo"
                  title="Next photo"
                >
                  <i className="fa-solid fa-chevron-right" />
                </button>
              </>
            )}
          </div>

          {/* Mini Thumbnail Strip (Instant Switching) */}
          {roomImages.length > 1 && (
            <div className="mmt-room-thumbnails-strip">
              {roomImages.slice(0, 4).map((thumb, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`room-thumb-btn ${idx === activeImgIndex ? 'active-thumb' : ''}`}
                  onClick={() => setActiveImgIndex(idx)}
                  title={`View photo ${idx + 1}`}
                >
                  <img src={thumb} alt="" onError={(e) => { e.currentTarget.src = PRESET_IMAGES?.suite; }} />
                </button>
              ))}
              {roomImages.length > 4 && (
                <button
                  type="button"
                  className="room-thumb-btn room-thumb-more"
                  onClick={() => setIsDetailModalOpen(true)}
                  title="View all photos"
                >
                  <span>+{roomImages.length - 4}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ================= COLUMN 2: SPECS, INCLUSIONS & AMENITIES ================= */}
        <div className="mmt-room-details-col">
          {/* Header Row: Title & Feature Tags */}
          <div className="room-title-block">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="room-popular-tag">
                <i className="fa-solid fa-star text-[10px]" /> Highly Rated
              </span>
              <span className="room-verified-tag">
                <i className="fa-solid fa-circle-check text-[10px]" /> Certified Clean Stay
              </span>
            </div>

            <h3 className="room-name-heading">{room.name}</h3>
          </div>

          {/* Key Specifications Grid Strip */}
          <div className="room-specs-strip">
            <div className="room-spec-chip" title="Room Size">
              <i className="fa-solid fa-vector-square text-brand text-xs" />
              <span>{roomSizeStr}</span>
            </div>
            <span className="spec-dot" />
            <div className="room-spec-chip" title="Bed Type">
              <i className="fa-solid fa-bed text-brand text-xs" />
              <span>{bedTypeStr}</span>
            </div>
            <span className="spec-dot" />
            <div className="room-spec-chip" title="Occupancy">
              <i className="fa-solid fa-user-group text-brand text-xs" />
              <span>{roomCapacityStr}</span>
            </div>
            <span className="spec-dot" />
            <div className="room-spec-chip" title="Room View">
              <i className="fa-solid fa-mountain-sun text-brand text-xs" />
              <span>{viewBadge}</span>
            </div>
          </div>

          {/* Inclusions Feature Card */}
          <div className="room-inclusions-box">
            <div className="inclusion-item meal-inclusion">
              <div className="inclusion-icon-wrap bg-emerald-100 text-emerald-700">
                <i className="fa-solid fa-utensils text-xs" />
              </div>
              <div className="inclusion-text">
                <strong className="text-emerald-900">{selectedPlan.name}</strong>
                <p className="text-emerald-700 text-[11px]">{selectedPlan.description}</p>
              </div>
            </div>

            <div className="inclusion-divider" />

            <div className={`inclusion-item cancellation-inclusion ${roomPolicy?.refundable !== false ? 'bg-sky-50/70 border-sky-100' : 'bg-amber-50/70 border-amber-100'}`}>
              <div className={`inclusion-icon-wrap ${roomPolicy?.refundable !== false ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'}`}>
                <i className={`fa-solid ${roomPolicy?.refundable !== false ? 'fa-shield-halved' : 'fa-ban'} text-xs`} />
              </div>
              <div className="inclusion-text">
                <strong className={roomPolicy?.refundable !== false ? 'text-sky-900' : 'text-amber-900'}>
                  {roomPolicy?.badgeText || (roomPolicy?.refundable !== false ? 'Refundable Booking' : 'Non-Refundable')}
                </strong>
                <p className={`${roomPolicy?.refundable !== false ? 'text-sky-700' : 'text-amber-700'} text-[11px]`}>
                  {roomPolicy?.summary || (roomPolicy?.refundable !== false ? 'Subject to individual property cancellation window' : 'No refunds on cancellation or no-show (Property policy)')}
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic Room Amenities Chips */}
          {dynamicRoomAmenities.length > 0 && (
            <div className="room-amenities-wrap">
              <div className="room-amenities-chips">
                {dynamicRoomAmenities.slice(0, 5).map((amenity, idx) => (
                  <span key={idx} className="room-amenity-chip">
                    <i className={`fa-solid ${getAmenityIcon(amenity)} text-[11px] text-slate-500`} />
                    <span>{amenity}</span>
                  </span>
                ))}
              </div>

              <button
                type="button"
                className="room-details-trigger-btn"
                onClick={() => setIsDetailModalOpen(true)}
              >
                <span>View all room amenities &amp; rules</span>
                <i className="fa-solid fa-chevron-right text-[10px]" />
              </button>
            </div>
          )}
        </div>

        {/* ================= COLUMN 3: RATE OPTIONS, PRICING & CTA ================= */}
        <div className="mmt-room-pricing-col">
          {/* Rate Plan Selector */}
          <div className="rate-plan-picker">
            <span className="rate-picker-label">Choose Package:</span>
            <div className="rate-plan-options-stack">
              {ratePlans.map((plan) => (
                <label
                  key={plan.id}
                  className={`rate-plan-option-row ${selectedPlanId === plan.id ? 'active-plan' : ''}`}
                >
                  <input
                    type="radio"
                    name={`rate_plan_${room.id || room._id}`}
                    value={plan.id}
                    checked={selectedPlanId === plan.id}
                    onChange={() => setSelectedPlanId(plan.id)}
                    className="plan-radio"
                  />
                  <div className="plan-label-info">
                    <div className="flex items-center justify-between">
                      <span className="plan-title">{plan.name}</span>
                      {plan.priceDelta !== 0 && (
                        <span className={`plan-diff ${plan.priceDelta > 0 ? 'text-slate-600' : 'text-emerald-600 font-bold'}`}>
                          {plan.priceDelta > 0 ? `+${formatPrice(plan.priceDelta)}` : formatPrice(plan.priceDelta)}
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="price-box-divider" />

          {/* Price Breakdown */}
          <div className="room-price-display-block">
            {discountPercent > 0 && (
              <div className="price-top-meta flex items-center justify-between mb-1">
                <span className="room-discount-badge">
                  <i className="fa-solid fa-tag text-[10px] mr-1" />
                  {discountPercent}% OFF
                </span>
                <span className="room-original-strike">
                  {formatPrice(finalOriginal)}
                </span>
              </div>
            )}

            <div className="room-final-rate-row">
              <span className="room-price-currency-val">{formatPrice(finalPrice)}</span>
              <span className="room-rate-unit">/ night</span>
            </div>

            <div className="room-taxes-note">
              + {formatPrice(taxesApprox)} approx. taxes & fees
            </div>
          </div>

          {/* Urgency Badge */}
          <div className="room-inventory-alert">
            {inventoryLeft <= 3 ? (
              <span className="urgency-pill urgency-critical">
                <i className="fa-solid fa-fire text-amber-500 animate-pulse" />
                Only {inventoryLeft} rooms left at this price!
              </span>
            ) : (
              <span className="urgency-pill urgency-normal">
                <i className="fa-solid fa-bolt text-emerald-600" />
                Instant confirmation available
              </span>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            className="mmt-book-now-btn"
            onClick={handleBook}
            title={`Book ${room.name}`}
          >
            <span>Book This Room</span>
            <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Trust Guarantees */}
          <div className="room-trust-reassurance">
            <span className="inline-flex items-center gap-1">
              <i className="fa-solid fa-lock text-[10px] text-slate-400" />
              Best Rate Guarantee
            </span>
            <span>•</span>
            <span>No hidden fees</span>
          </div>
        </div>
      </article>

      {/* ================= MODAL: ROOM PHOTO LIGHTBOX & FULL DETAILS ================= */}
      {isDetailModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setIsDetailModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-header-bar flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-900 text-white uppercase tracking-wider">
                    {roomTypeLabel}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    {viewBadge}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">{room.name}</h3>
              </div>

              <button
                type="button"
                className="w-9 h-9 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                onClick={() => setIsDetailModalOpen(false)}
                title="Close dialog"
              >
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="modal-body-scroll p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* Photo Showcase Carousel */}
              <div className="relative w-full h-72 sm:h-96 rounded-xl overflow-hidden bg-slate-900 shadow-inner">
                <img
                  src={roomImages[activeImgIndex] || roomImages[0]}
                  alt={`${room.name} view ${activeImgIndex + 1}`}
                  className="w-full h-full object-cover transition-all duration-300"
                />

                {roomImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="room-carousel-arrow room-carousel-prev !opacity-100 !left-3"
                      onClick={prevImage}
                    >
                      <i className="fa-solid fa-chevron-left" />
                    </button>
                    <button
                      type="button"
                      className="room-carousel-arrow room-carousel-next !opacity-100 !right-3"
                      onClick={nextImage}
                    >
                      <i className="fa-solid fa-chevron-right" />
                    </button>
                  </>
                )}

                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold">
                  Photo {activeImgIndex + 1} of {roomImages.length}
                </div>
              </div>

              {/* Photo Thumbnail Strip */}
              {roomImages.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {roomImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`relative w-20 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${idx === activeImgIndex ? 'border-brand scale-105 shadow-md' : 'border-slate-200 opacity-70 hover:opacity-100'}`}
                      onClick={() => setActiveImgIndex(idx)}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <i className="fa-solid fa-vector-square text-brand text-lg mb-1 block" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Floor Area</span>
                  <strong className="text-sm text-slate-900 font-bold">{roomSizeStr}</strong>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <i className="fa-solid fa-bed text-brand text-lg mb-1 block" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Bed Setup</span>
                  <strong className="text-sm text-slate-900 font-bold">{bedTypeStr}</strong>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <i className="fa-solid fa-user-group text-brand text-lg mb-1 block" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Occupancy</span>
                  <strong className="text-sm text-slate-900 font-bold">{roomCapacityStr}</strong>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <i className="fa-solid fa-mountain-sun text-brand text-lg mb-1 block" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Window View</span>
                  <strong className="text-sm text-slate-900 font-bold">{viewBadge}</strong>
                </div>
              </div>

              {/* Categorized Room Amenities & Facilities (100% Dynamic) */}
              <div className="space-y-4">
                <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <i className="fa-solid fa-list-check text-brand text-sm" />
                  Room Amenities &amp; In-Suite Facilities ({dynamicRoomAmenities.length})
                </h4>

                {dynamicRoomAmenities.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {dynamicRoomAmenities.map((amenity, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700">
                        <i className={`fa-solid ${getAmenityIcon(amenity)} text-brand text-sm`} />
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Verified essentials &amp; standard amenities provided upon check-in.</p>
                )}
              </div>

              {/* Room Policies & Dynamic Privileges */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
                <strong className="block text-slate-900 font-bold">Reservation Terms &amp; Privileges:</strong>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                  <div className="flex items-center gap-2">
                    <i className={`fa-solid ${roomPolicy?.refundable !== false ? 'fa-check text-emerald-600' : 'fa-ban text-amber-600'}`} />
                    <span>{roomPolicy?.badgeText || (roomPolicy?.refundable !== false ? 'Refundable terms apply' : 'Non-refundable reservation')}</span>
                  </div>
                  {hotel?.allowPayAtHotel !== false && (
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-building-columns text-slate-600" />
                      <span>Pay at Hotel option available</span>
                    </div>
                  )}
                  {roomPolicy?.summary && (
                    <div className="flex items-start gap-2 col-span-full text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/70">
                      <i className="fa-solid fa-shield-halved text-sky-600 mt-0.5 shrink-0" />
                      <span>{roomPolicy.summary}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Sticky Bottom Action Bar */}
            <div className="modal-footer-bar p-4 sm:p-5 border-t border-slate-200 bg-white flex items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Total per night</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black text-slate-900">{formatPrice(finalPrice)}</span>
                  <span className="text-xs text-slate-500">/ night</span>
                </div>
                <span className="text-[10px] text-slate-400">+ taxes approx {formatPrice(taxesApprox)}</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => setIsDetailModalOpen(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleBook();
                  }}
                >
                  <span>Book This Room</span>
                  <i className="fa-solid fa-arrow-right" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
