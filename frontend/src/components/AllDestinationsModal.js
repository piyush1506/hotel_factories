'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const LOCAL_CITY_IMAGES = {
  Goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
  Udaipur: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
  Manali: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
  Jaipur: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
  Munnar: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
  Alleppey: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
  Mumbai: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80',
  Bengaluru: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
  Delhi: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',
  Bhilwara: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
};

const CITY_DETAILS = {
  Goa: { tag: 'Beach Escapes', icon: 'fa-umbrella-beach', highlight: 'Candolim, Baga & Calangute coast' },
  Udaipur: { tag: 'Royal Palaces', icon: 'fa-landmark', highlight: 'Lake Pichola & historic Havelis' },
  Manali: { tag: 'Hill Stations', icon: 'fa-mountain', highlight: 'Solang Valley & cedar forests' },
  Jaipur: { tag: 'Heritage', icon: 'fa-archway', highlight: 'Pink City forts & luxury courtyards' },
  Munnar: { tag: 'Nature Retreats', icon: 'fa-tree', highlight: 'Misty tea plantations & valleys' },
  Alleppey: { tag: 'Backwaters', icon: 'fa-water', highlight: 'Vembanad Lake & private houseboats' },
  Mumbai: { tag: 'Metros & Commercial', icon: 'fa-city', highlight: 'Marine Drive & business hubs' },
  Bengaluru: { tag: 'Metros & Commercial', icon: 'fa-building', highlight: 'IT corridor & luxury business hotels' },
  Delhi: { tag: 'Metros & Heritage', icon: 'fa-monument', highlight: 'Connaught Place & cultural hubs' },
  Bhilwara: { tag: 'Heritage & Textiles', icon: 'fa-hotel', highlight: 'Historic palaces & textile centres' },
};

export default function AllDestinationsModal() {
  const {
    isDestinationsModalOpen,
    setIsDestinationsModalOpen,
    cities,
    hotels,
    setSelectedDestination,
    setSearchQuery,
    setSelectedCategory,
    switchNav,
    showToast,
    formatPrice,
  } = useApp();

  const [searchFilter, setSearchFilter] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');

  // Close on Escape key
  useEffect(() => {
    if (!isDestinationsModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsDestinationsModalOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDestinationsModalOpen, setIsDestinationsModalOpen]);

  // Aggregate destination list from backend cities and hotels
  const combinedCities = useMemo(() => {
    const list = Array.isArray(cities) && cities.length > 0 ? [...cities] : [];

    // If cities array is sparse, backfill from hotels
    if (list.length === 0 && Array.isArray(hotels) && hotels.length > 0) {
      const cityMap = {};
      hotels.forEach((h) => {
        if (!h.city) return;
        if (!cityMap[h.city]) {
          cityMap[h.city] = {
            name: h.city,
            state: h.state || 'India',
            hotelsCount: 0,
            image: h.images?.[0] || h.image || LOCAL_CITY_IMAGES[h.city],
            minPrice: h.startingPrice || 1999,
          };
        }
        cityMap[h.city].hotelsCount += 1;
        if (h.startingPrice && h.startingPrice < cityMap[h.city].minPrice) {
          cityMap[h.city].minPrice = h.startingPrice;
        }
      });
      return Object.values(cityMap);
    }

    return list.map((c) => {
      const extra = CITY_DETAILS[c.name] || {};
      const img = c.image || LOCAL_CITY_IMAGES[c.name] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
      return {
        ...c,
        image: img,
        tag: extra.tag || 'Popular Stays',
        icon: extra.icon || 'fa-location-dot',
        highlight: extra.highlight || `${c.state || 'India'} stays & resorts`,
      };
    });
  }, [cities, hotels]);

  // Filtered by search term and tag
  const filteredList = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    return combinedCities.filter((item) => {
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.state && item.state.toLowerCase().includes(q)) ||
        (item.tag && item.tag.toLowerCase().includes(q));

      const matchesTag =
        selectedTag === 'All' ||
        (item.tag && item.tag.toLowerCase().includes(selectedTag.toLowerCase()));

      return matchesSearch && matchesTag;
    });
  }, [combinedCities, searchFilter, selectedTag]);

  const handleSelectCity = (cityName) => {
    setSelectedDestination(cityName);
    setSearchQuery(cityName);
    if (setSelectedCategory) setSelectedCategory('All');
    setIsDestinationsModalOpen(false);
    switchNav('search');
    showToast(`Showing verified hotels in ${cityName}`);
  };

  if (!isDestinationsModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={() => setIsDestinationsModalOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="All Service Destinations"
    >
      <div
        className="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-b from-slate-50/70 to-white flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wider mb-2">
              <i className="fa-solid fa-map-location-dot" />
              <span>Nationwide Presence · 10+ Operating Cities</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Where We Provide Service
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Choose from our verified network of cities across India with direct hotelier pricing, instant confirmations, and zero hidden markups.
            </p>
          </div>

          <button
            onClick={() => setIsDestinationsModalOpen(false)}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            aria-label="Close destinations modal"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        {/* Search & Tag Filter Bar */}
        <div className="px-5 sm:px-6 py-3 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Live Search Input */}
          <div className="relative flex-1 max-w-md">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search by city, state (e.g. Goa, Rajasthan, Kerala)..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/10 text-slate-900 transition-all"
              autoFocus
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                <i className="fa-solid fa-circle-xmark" />
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            {['All', 'Beach', 'Palaces', 'Hill', 'Metros'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tag === 'All' ? 'All Cities' : tag}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable City Grid */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/50">
          {filteredList.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-xl">
                <i className="fa-solid fa-city" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No destinations found</h3>
              <p className="text-xs text-slate-500 mt-1">
                No cities match &ldquo;{searchFilter}&rdquo;. Try another city or view all operating destinations.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchFilter('');
                  setSelectedTag('All');
                }}
                className="mt-4 px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredList.map((city) => (
                <div
                  key={city.name}
                  onClick={() => handleSelectCity(city.name)}
                  className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-slate-300 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Media */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                      <img
                        src={city.image}
                        alt={city.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                      {/* State Badge Top Left */}
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-bold tracking-wide uppercase">
                        {city.state || 'India'}
                      </span>

                      {/* Tag Top Right */}
                      {city.tag && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                          {city.tag}
                        </span>
                      )}

                      {/* Overlay Title */}
                      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent text-white">
                        <span className="text-[10px] uppercase font-bold text-slate-300 block">
                          INDIA · VERIFIED DESTINATION
                        </span>
                        <strong className="text-lg font-black tracking-tight">{city.name}</strong>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-4">
                      <p className="text-xs text-slate-500 line-clamp-1 mb-3">
                        {city.highlight}
                      </p>

                      <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100">
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
                          {city.hotelsCount || 1}+ verified properties
                        </span>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">From</span>
                          <span className="font-black text-slate-900 text-sm">
                            {formatPrice ? formatPrice(city.minPrice || 2499) : `₹${city.minPrice || 2499}`}
                            <span className="text-[10px] font-normal text-slate-500">/night</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Strip */}
                  <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs group-hover:text-teal-500 transition-colors">
                    <span className="font-bold">Explore stays in {city.name}</span>
                    <i className="fa-solid fa-arrow-right text-[11px] group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-6 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <i className="fa-solid fa-shield-check text-emerald-600" />
            <span>All properties 100% verified by Hotel Factories field teams</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setIsDestinationsModalOpen(false);
                switchNav('destinations');
              }}
              className="px-3 py-1.5 rounded-full bg-black hover:bg-zinc-800 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
            >
              <i className="fa-solid fa-map-location-dot text-[11px]" />
              <span>Full Destinations Page</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedDestination('All Destinations');
                setSearchQuery('');
                if (setSelectedCategory) setSelectedCategory('All');
                setIsDestinationsModalOpen(false);
                switchNav('search');
                showToast('Showing all hotels across India');
              }}
              className="text-slate-600 hover:text-black font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Or browse all hotel listings directly</span>
              <i className="fa-solid fa-chevron-right text-[10px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
