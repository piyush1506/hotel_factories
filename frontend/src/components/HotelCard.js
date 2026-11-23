'use client';

import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import HotelCardImageCarousel from './common/HotelCardImageCarousel';

export default function HotelCard({ hotel }) {
  const { openHotelDetail, toggleFavorite, favorites, formatPrice } = useApp();
  const hotelId = hotel.id || hotel._id;
  const isFavorite = favorites.includes(hotelId);

  const price = Number(hotel.startingPrice || hotel.pricePerNight || hotel.basePrice || 4999);
  const originalPrice = Number(hotel.originalPrice || Math.round(price * 1.5));
  const rating = Number(hotel.rating || 4.6);
  const reviewsCount = Number(hotel.reviewsCount || 1248);

  const amenities = useMemo(() => {
    if (hotel.amenities && Array.isArray(hotel.amenities) && hotel.amenities.length > 0) {
      return hotel.amenities.slice(0, 3);
    }
    return ['Pool', 'Restaurant', 'Beach access'];
  }, [hotel.amenities]);

  const getAmenityIcon = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('pool')) return 'fa-solid fa-person-swimming';
    if (n.includes('restaurant') || n.includes('dining') || n.includes('breakfast')) return 'fa-solid fa-utensils';
    if (n.includes('beach') || n.includes('sea')) return 'fa-solid fa-umbrella-beach';
    if (n.includes('bar') || n.includes('cocktail')) return 'fa-solid fa-martini-glass';
    if (n.includes('spa') || n.includes('wellness')) return 'fa-solid fa-spa';
    return 'fa-solid fa-check';
  };

  const imageSrc = hotel.image || hotel.coverImage || (hotel.images && hotel.images[0]) || '/images/hotel-leaf-goa.png';

  return (
    <article
      className="group relative cursor-pointer overflow-hidden rounded-md border border-slate-200/80 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-slate-200/40"
      onClick={() => openHotelDetail(hotelId, hotel)}
    >
      {/* Media Box with Swipeable Image Carousel */}
      <HotelCardImageCarousel
        hotel={hotel}
        hotelName={hotel.name}
        aspectRatio="aspect-[16/10]"
        overlayTopRight={(
          <button
            className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer ${
              isFavorite
                ? 'bg-black text-white shadow-md'
                : 'bg-white/80 text-slate-800 hover:bg-white hover:text-black shadow-xs'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(hotelId);
            }}
            aria-label={isFavorite ? 'Remove from saved' : 'Save to wishlist'}
            type="button"
          >
            <i className={`${isFavorite ? 'fa-solid text-rose-500' : 'fa-regular'} fa-heart text-sm`} />
          </button>
        )}
      />

      {/* Card Info Box */}
      <div className="p-5 flex flex-col gap-4">
        <div>
          {/* Rating Badge */}
          <div className="flex items-center gap-2 mb-2 text-xs">
            <span className="inline-flex items-center gap-1 text-slate-900 font-bold text-xs">
              <i className="fa-solid fa-star text-amber-500 text-[10px]" /> {rating.toFixed(1)}
            </span>
          </div>

          {/* Hotel Name */}
          <h3 className="font-semibold text-base text-slate-900 line-clamp-2">
            {hotel.name}
          </h3>

          {/* Location */}
          <p className="text-xs font-semibold text-slate-700 line-clamp-1 flex items-center gap-1.5">
            <i className="fa-solid fa-location-dot text-sky-600 text-[11px] shrink-0" />
            <span>{hotel.distanceFromBeach || hotel.locality || hotel.city || hotel.address}</span>
          </p>

          {/* Amenities Strip */}
          <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
            {amenities.map((amenity) => (
              <span
                key={amenity}
                className="inline-flex items-center gap-1 text-xs text-slate-600"
              >
                <i className={`${getAmenityIcon(amenity)} text-[11px] font-semibold text-slate-600`} />
                <span>{amenity}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Pricing and Feature Highlight Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-end justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <i className="fa-solid fa-shield-halved text-emerald-600 text-[10px]" />
            <span>Verified Stay</span>
          </div>

          <div className="flex flex-col items-end">
            {originalPrice > price && (
              <del className="text-xs text-slate-500 font-semibold line-through decoration-rose-500/70">
                {formatPrice(originalPrice)}
              </del>
            )}
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-slate-900">
                {formatPrice(price)}
              </span>
              <span className="text-xs font-semibold text-slate-600">per night</span>
            </div>
            <span className="text-[10px] text-slate-400">Incl. taxes & fees</span>
          </div>
        </div>
      </div>
    </article>
  );
}
