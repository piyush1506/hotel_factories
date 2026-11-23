'use client';

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { PRESET_IMAGES } from '../../utils/helpers';

const FALLBACK_POOL = [
  PRESET_IMAGES.palace,
  PRESET_IMAGES.suite,
  PRESET_IMAGES.villa,
  PRESET_IMAGES.balcony,
  PRESET_IMAGES.city,
  PRESET_IMAGES.beach,
  PRESET_IMAGES.mountain
];

/**
 * Reusable, high-performance touch & drag image carousel for hotel cards
 * Features:
 * - Real-time 1:1 finger tracking (images follow finger live during drag)
 * - Zero-lag touch response with touch-action: pan-y
 * - Spring-ease deceleration (cubic-bezier(0.22, 1, 0.36, 1)) on release
 * - Edge rubber-band elasticity
 * - Velocity & flick detection
 * - Mouse drag support for desktop & mobile
 * - Anti-accidental-click suppression
 */
export default function HotelCardImageCarousel({
  hotel,
  images: customImages,
  hotelName = 'Hotel',
  aspectRatio = 'aspect-[16/10]',
  className = '',
  overlayTopLeft = null,
  overlayTopRight = null,
  initialIndex = 0,
  onCardClick = null
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  // Collect and deduplicate all images for this hotel
  const imagesList = useMemo(() => {
    const list = [];
    if (Array.isArray(customImages) && customImages.length > 0) {
      list.push(...customImages.filter(Boolean));
    }
    if (hotel) {
      if (Array.isArray(hotel.images) && hotel.images.length > 0) {
        hotel.images.forEach(img => {
          if (img && typeof img === 'string' && !list.includes(img)) list.push(img);
        });
      }
      if (hotel.image && typeof hotel.image === 'string' && !list.includes(hotel.image)) {
        list.unshift(hotel.image);
      }
      if (hotel.coverImage && typeof hotel.coverImage === 'string' && !list.includes(hotel.coverImage)) {
        list.push(hotel.coverImage);
      }
      if (Array.isArray(hotel.gallery) && hotel.gallery.length > 0) {
        hotel.gallery.forEach(img => {
          const src = typeof img === 'string' ? img : img?.src;
          if (src && !list.includes(src)) list.push(src);
        });
      }
      if (Array.isArray(hotel.rooms) && hotel.rooms.length > 0) {
        hotel.rooms.forEach(r => {
          const rImg = r.image || (Array.isArray(r.images) && r.images[0]);
          if (rImg && typeof rImg === 'string' && !list.includes(rImg)) list.push(rImg);
        });
      }
    }

    // Guarantee at least 3 high-quality images per hotel so every hotel has swipe feature
    if (list.length < 3) {
      for (const fallback of FALLBACK_POOL) {
        if (!list.includes(fallback)) {
          list.push(fallback);
        }
        if (list.length >= 3) break;
      }
    }

    return list.length > 0 ? list : [PRESET_IMAGES.palace];
  }, [hotel, customImages]);

  const total = imagesList.length;

  // Swipe & drag gesture state
  const dragRef = useRef({
    isDown: false,
    startX: 0,
    startY: 0,
    currentDx: 0,
    startTime: 0,
    isSwiping: false,
    lastSwipeTime: 0
  });

  const onStart = useCallback((clientX, clientY) => {
    dragRef.current.isDown = true;
    dragRef.current.startX = clientX;
    dragRef.current.startY = clientY;
    dragRef.current.currentDx = 0;
    dragRef.current.startTime = Date.now();
    dragRef.current.isSwiping = false;
  }, []);

  const onMove = useCallback((clientX, clientY) => {
    if (!dragRef.current.isDown) return;

    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;

    // Check if horizontal intent is established
    if (!dragRef.current.isSwiping) {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) {
        dragRef.current.isSwiping = true;
        setIsDragging(true);
      } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
        // Vertical scroll dominating, cancel drag tracking
        dragRef.current.isDown = false;
        return;
      }
    }

    if (dragRef.current.isSwiping) {
      let finalDx = dx;
      // Add rubber-band resistance at boundaries
      if ((currentIndex === 0 && dx > 0) || (currentIndex === total - 1 && dx < 0)) {
        finalDx = dx * 0.35;
      }
      dragRef.current.currentDx = finalDx;
      setDragOffset(finalDx);
    }
  }, [currentIndex, total]);

  const onEnd = useCallback(() => {
    if (!dragRef.current.isDown && !dragRef.current.isSwiping) return;

    const dx = dragRef.current.currentDx;
    const dt = Math.max(1, Date.now() - dragRef.current.startTime);
    const velocity = Math.abs(dx) / dt; // px/ms

    const containerWidth = containerRef.current?.offsetWidth || 300;
    const distanceThreshold = Math.min(containerWidth * 0.2, 55);

    dragRef.current.isDown = false;
    setIsDragging(false);
    setDragOffset(0);

    if (dragRef.current.isSwiping && Math.abs(dx) > 8) {
      dragRef.current.lastSwipeTime = Date.now();
    }

    // Determine if advance to next or previous slide
    if (Math.abs(dx) > distanceThreshold || (velocity > 0.25 && Math.abs(dx) > 20)) {
      if (dx < 0 && currentIndex < total - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else if (dx > 0 && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      } else if (dx < 0 && currentIndex === total - 1) {
        // Optional loop to first slide on left swipe at end
        setCurrentIndex(0);
      } else if (dx > 0 && currentIndex === 0) {
        // Optional loop to last slide on right swipe at start
        setCurrentIndex(total - 1);
      }
    }

    dragRef.current.currentDx = 0;
    dragRef.current.isSwiping = false;
  }, [currentIndex, total]);

  // Touch event listeners
  const handleTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    onStart(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    onMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    onEnd();
  };

  // Mouse event listeners for desktop drag
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only primary mouse button
    onStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    onMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    onEnd();
  };

  const handleMouseLeave = () => {
    if (dragRef.current.isDown) {
      onEnd();
    }
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const handleDotClick = (e, idx) => {
    e.stopPropagation();
    setCurrentIndex(idx);
  };

  // Safe container click: ignore if a drag or swipe gesture just completed within 350ms
  const handleContainerClick = (e) => {
    if (Date.now() - dragRef.current.lastSwipeTime < 350) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    if (onCardClick) {
      onCardClick(e);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-slate-100 select-none ${aspectRatio} ${className}`}
      style={{ touchAction: 'pan-y' }}
      onClick={handleContainerClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* 1:1 Live Following Sliding Track */}
      <div
        className="flex w-full h-full will-change-transform"
        style={{
          transform: `translate3d(calc(-${currentIndex * 100}% + ${dragOffset}px), 0, 0)`,
          transition: isDragging
            ? 'none'
            : 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)'
        }}
      >
        {imagesList.map((src, idx) => (
          <div key={`${src}-${idx}`} className="w-full h-full shrink-0 relative overflow-hidden select-none">
            <img
              src={src}
              alt={`${hotelName} photo ${idx + 1}`}
              loading="lazy"
              draggable={false}
              onError={(e) => {
                e.currentTarget.src = PRESET_IMAGES.palace;
              }}
              className="w-full h-full object-cover select-none pointer-events-none group-hover:scale-105 transition-transform duration-700 ease-out"
            />
          </div>
        ))}
      </div>

      {/* Top Left Badge Overlay */}
      {overlayTopLeft && (
        <div className="absolute top-2.5 left-2.5 z-20 pointer-events-auto">
          {overlayTopLeft}
        </div>
      )}

      {/* Top Right Actions Overlay */}
      {overlayTopRight && (
        <div className="absolute top-2.5 right-2.5 z-20 pointer-events-auto">
          {overlayTopRight}
        </div>
      )}

      {/* Desktop Chevron Navigation Controls */}
      {total > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={handlePrev}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/50 hover:bg-black/80 active:scale-90 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md"
          >
            <i className="fa-solid fa-chevron-left text-[10px] sm:text-xs" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={handleNext}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/50 hover:bg-black/80 active:scale-90 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md"
          >
            <i className="fa-solid fa-chevron-right text-[10px] sm:text-xs" />
          </button>
        </>
      )}

      {/* Interactive Bottom Pagination Indicator */}
      {total > 1 && (
        <div className="absolute bottom-2.5 inset-x-0 z-20 flex items-center justify-center px-3 pointer-events-none">
          {/* Centered Pill with Fluid Animated Dots */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-xs pointer-events-auto shadow-sm">
            {imagesList.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Go to slide ${idx + 1}`}
                onClick={(e) => handleDotClick(e, idx)}
                className={`rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentIndex
                    ? 'w-4 h-1.5 bg-white shadow-2xs'
                    : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
