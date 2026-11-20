'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

const LOCAL_CITY_IMAGES = {
  Goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
  Udaipur: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
  Manali: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80',
  Jaipur: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
  Munnar: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
  Alleppey: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
  Mumbai: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80',
  Bengaluru: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
  Delhi: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80',
  Bhilwara: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
};

const CITY_DETAILS = {
  Goa: { 
    tag: 'Beach Escapes', 
    category: 'beach',
    icon: 'fa-umbrella-beach', 
    highlight: 'Candolim, Baga & Calangute beachfront stays',
    description: 'Golden beaches, vibrant beach shacks, private villas, and heritage Portuguese quarters.',
    bestTimeToVisit: 'Nov - Feb'
  },
  Udaipur: { 
    tag: 'Royal Palaces', 
    category: 'palaces',
    icon: 'fa-landmark', 
    highlight: 'Lake Pichola & historic Havelis',
    description: 'Majestic marble palaces on romantic lakes, royal courtyards, and sunset boat rides.',
    bestTimeToVisit: 'Oct - Mar'
  },
  Manali: { 
    tag: 'Hill Stations', 
    category: 'hills',
    icon: 'fa-mountain', 
    highlight: 'Solang Valley & cedar forests',
    description: 'Snow-capped Himalayan peaks, pine-scented valleys, adventure camps, and cozy log cottages.',
    bestTimeToVisit: 'All Year'
  },
  Jaipur: { 
    tag: 'Heritage & Forts', 
    category: 'palaces',
    icon: 'fa-archway', 
    highlight: 'Pink City forts & luxury courtyards',
    description: 'Grand Amber Fort, royal heritage palaces, historic bazaars, and traditional Rajasthani hospitality.',
    bestTimeToVisit: 'Oct - Mar'
  },
  Munnar: { 
    tag: 'Nature Retreats', 
    category: 'hills',
    icon: 'fa-tree', 
    highlight: 'Misty tea plantations & valleys',
    description: 'Rolling emerald tea hills, mountain waterfalls, cool mountain mist, and boutique plantations.',
    bestTimeToVisit: 'Sep - May'
  },
  Alleppey: { 
    tag: 'Backwaters', 
    category: 'beach',
    icon: 'fa-water', 
    highlight: 'Vembanad Lake & private houseboats',
    description: 'Serene palm-fringed canals, traditional houseboats, authentic Ayurvedic spas, and lagoon villas.',
    bestTimeToVisit: 'Nov - Feb'
  },
  Mumbai: { 
    tag: 'Metros & Commercial', 
    category: 'metro',
    icon: 'fa-city', 
    highlight: 'Marine Drive & business hubs',
    description: 'The City of Dreams, iconic coastal drives, boutique suburban hotels, and commercial centers.',
    bestTimeToVisit: 'Oct - Mar'
  },
  Bengaluru: { 
    tag: 'Metros & Commercial', 
    category: 'metro',
    icon: 'fa-building', 
    highlight: 'IT corridor & luxury business hotels',
    description: 'India\'s Silicon Valley, lush parks, contemporary dining, and premier executive suites.',
    bestTimeToVisit: 'All Year'
  },
  Delhi: { 
    tag: 'Metros & Heritage', 
    category: 'metro',
    icon: 'fa-monument', 
    highlight: 'Connaught Place & Aerocity',
    description: 'India\'s historic capital, diplomatic quarter, sprawling Mughal monuments, and luxury transit hotels.',
    bestTimeToVisit: 'Oct - Mar'
  },
  Bhilwara: { 
    tag: 'Heritage & Textiles', 
    category: 'palaces',
    icon: 'fa-hotel', 
    highlight: 'Historic palaces & textile centres',
    description: 'Famous City of Textiles with majestic fortresses, peaceful shrines, and boutique heritage suites.',
    bestTimeToVisit: 'Oct - Mar'
  },
};

export default function DestinationsScreen() {
  const {
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
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'beach' | 'palaces' | 'hills' | 'metro'
  const [sortBy, setSortBy] = useState('popular'); // 'popular' | 'stays' | 'price' | 'name'

  // Aggregate destination list from backend cities and hotels
  const allDestinations = useMemo(() => {
    const list = Array.isArray(cities) && cities.length > 0 ? [...cities] : [];

    // Fallback if cities is empty: extract from hotels list
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
      return Object.values(cityMap).map((c) => {
        const extra = CITY_DETAILS[c.name] || {};
        return {
          ...c,
          image: c.image || LOCAL_CITY_IMAGES[c.name] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
          tag: extra.tag || 'Popular Destination',
          category: extra.category || 'all',
          highlight: extra.highlight || `${c.state || 'India'} stays & resorts`,
          description: extra.description || `Handpicked verified accommodations in ${c.name}.`,
          bestTimeToVisit: extra.bestTimeToVisit || 'Oct - Mar',
        };
      });
    }

    return list.map((c) => {
      const extra = CITY_DETAILS[c.name] || {};
      const img = c.image || LOCAL_CITY_IMAGES[c.name] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';
      return {
        ...c,
        image: img,
        tag: extra.tag || 'Popular Destination',
        category: extra.category || 'all',
        highlight: extra.highlight || `${c.state || 'India'} stays & resorts`,
        description: extra.description || `Handpicked verified accommodations in ${c.name}.`,
        bestTimeToVisit: extra.bestTimeToVisit || 'Oct - Mar',
      };
    });
  }, [cities, hotels]);

  // Filtered and sorted list
  const filteredDestinations = useMemo(() => {
    let result = [...allDestinations];
    const q = searchFilter.trim().toLowerCase();

    if (q) {
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.state && item.state.toLowerCase().includes(q)) ||
          (item.tag && item.tag.toLowerCase().includes(q)) ||
          (item.highlight && item.highlight.toLowerCase().includes(q))
      );
    }

    if (activeCategory !== 'all') {
      result = result.filter((item) => item.category === activeCategory);
    }

    if (sortBy === 'stays') {
      result.sort((a, b) => (b.hotelsCount || 0) - (a.hotelsCount || 0));
    } else if (sortBy === 'price') {
      result.sort((a, b) => (a.minPrice || 0) - (b.minPrice || 0));
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [allDestinations, searchFilter, activeCategory, sortBy]);

  // Dynamically compute category counts and metadata from live destinations
  const dynamicCategories = useMemo(() => {
    const categoryMeta = {
      all: { label: 'All Destinations', icon: 'fa-globe' },
      beach: { label: 'Beach & Coastal', icon: 'fa-umbrella-beach' },
      palaces: { label: 'Palaces & Heritage', icon: 'fa-landmark' },
      hills: { label: 'Hills & Nature', icon: 'fa-mountain' },
      metro: { label: 'Metros & Commercial', icon: 'fa-city' },
    };

    const counts = { all: allDestinations.length };
    const propertyCounts = { all: allDestinations.reduce((acc, d) => acc + (d.hotelsCount || 1), 0) };

    allDestinations.forEach((d) => {
      const cat = d.category || 'metro';
      counts[cat] = (counts[cat] || 0) + 1;
      propertyCounts[cat] = (propertyCounts[cat] || 0) + (d.hotelsCount || 1);
    });

    const standardOrder = ['all', 'beach', 'palaces', 'hills', 'metro'];
    const extraCats = Object.keys(counts).filter((c) => !standardOrder.includes(c));
    const allCatIds = [...standardOrder, ...extraCats];

    return allCatIds
      .filter((id) => id === 'all' || (counts[id] && counts[id] > 0))
      .map((catId) => {
        const meta = categoryMeta[catId] || {
          label: catId.charAt(0).toUpperCase() + catId.slice(1),
          icon: 'fa-map-pin',
        };
        return {
          id: catId,
          label: meta.label,
          icon: meta.icon,
          count: counts[catId] || 0,
          propertiesCount: propertyCounts[catId] || 0,
        };
      });
  }, [allDestinations]);

  const handleCityClick = (cityName) => {
    setSelectedDestination(cityName);
    setSearchQuery(cityName);
    if (setSelectedCategory) setSelectedCategory('All');
    switchNav('search');
    showToast(`Showing verified hotels in ${cityName}`);
  };

  return (
    <div className="w-full bg-[#f8fafc] text-slate-900 pb-20">
      
      {/* 1. HERO BANNER */}
      <section className="relative bg-slate-900 text-white py-12 sm:py-16 px-4 sm:px-8 overflow-hidden">
        {/* Scenic Background with subtle darken */}
        <div 
          className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-40"
          style={{
            backgroundImage: "url('/images/hero-bg.png')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-900/70" />

        <div className="relative z-10 max-w-[1360px] mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-slate-400 mb-4" aria-label="Breadcrumb">
            <button 
              onClick={() => switchNav('home')} 
              className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <i className="fa-solid fa-house text-[10px]" />
              <span>Home</span>
            </button>
            <span>/</span>
            <span className="text-white font-semibold">Service Destinations</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-400 text-xs font-bold uppercase tracking-wider mb-3 border border-white/10">
                <i className="fa-solid fa-map-location-dot" />
                <span>NATIONWIDE OPERATING NETWORK</span>
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Where We Provide Service
              </h1>
              <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-2xl leading-relaxed">
                Explore handpicked boutique properties, heritage palaces, beach resorts, and business hotels across verified destinations in India.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0 bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/10">
              <div className="text-center px-3 border-r border-white/20">
                <span className="block text-xl sm:text-2xl font-black text-white">{allDestinations.length}</span>
                <span className="block text-[10px] text-slate-300 uppercase font-semibold">Cities</span>
              </div>
              <div className="text-center px-3 border-r border-white/20">
                <span className="block text-xl sm:text-2xl font-black text-white">{hotels?.length || 25}+</span>
                <span className="block text-[10px] text-slate-300 uppercase font-semibold">Stays</span>
              </div>
              <div className="text-center px-3">
                <span className="block text-xl sm:text-2xl font-black text-emerald-400">100%</span>
                <span className="block text-[10px] text-slate-300 uppercase font-semibold">Verified</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SEARCH, CATEGORY TABS & SORT CONTROLS */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-8 -mt-6 relative z-20">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/90 p-4 sm:p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search by city, state (e.g. Goa, Rajasthan, Kerala)..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl outline-none focus:border-black focus:ring-1 focus:ring-black text-xs sm:text-sm font-semibold text-slate-900 transition-all placeholder:text-slate-400"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                aria-label="Clear destination search"
              >
                <i className="fa-solid fa-circle-xmark text-xs" />
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none text-xs">
            {dynamicCategories.map((cat) => {
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-black text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-black border border-transparent hover:border-slate-300'
                  }`}
                >
                  <i className={`fa-solid ${cat.icon} text-[11px] ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200/90 text-slate-700'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
            <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-black cursor-pointer"
            >
              <option value="popular">Most Popular</option>
              <option value="stays">Most Properties</option>
              <option value="price">Starting Price: Low to High</option>
              <option value="name">Alphabetical (A-Z)</option>
            </select>
          </div>

        </div>
      </section>

      {/* 3. DESTINATIONS DIRECTORY GRID */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-8 mt-10">
        
        {/* Grid Title Row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Verified Domestic Service Cities
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Showing {filteredDestinations.length} of {allDestinations.length} operating destinations across India
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedDestination('All Destinations');
              setSearchQuery('');
              if (setSelectedCategory) setSelectedCategory('All');
              switchNav('search');
            }}
            className="text-xs sm:text-sm font-bold text-zinc-900 hover:text-black hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>View all hotel listings</span>
            <i className="fa-solid fa-arrow-right text-[10px]" />
          </button>
        </div>

        {/* Empty State */}
        {filteredDestinations.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center my-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4 text-2xl">
              <i className="fa-solid fa-map-location" />
            </div>
            <h3 className="text-lg font-black text-slate-900">No destinations match your filter</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
              We couldn&apos;t find any service cities matching &ldquo;{searchFilter}&rdquo;. Try another term or reset your filters.
            </p>
            <button
              onClick={() => {
                setSearchFilter('');
                setActiveCategory('all');
              }}
              className="mt-5 px-5 py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-zinc-800 transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Cards Grid: 1 col on mobile, 2 on sm/md, 3 on lg */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {filteredDestinations.map((city) => (
              <div
                key={city.name}
                onClick={() => handleCityClick(city.name)}
                className="group bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-2xl hover:border-slate-300 transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  {/* Photo Container */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                    <img
                      src={city.image}
                      alt={city.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';
                      }}
                    />

                    {/* State Badge Top Left */}
                    <span className="absolute top-3.5 left-3.5 px-2.5 py-1 rounded-lg bg-slate-950/85 backdrop-blur-md text-white text-[10px] font-bold tracking-wider uppercase shadow-xs">
                      {city.state || 'India'}
                    </span>

                    {/* Category Tag Top Right */}
                    {city.tag && (
                      <span className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-xs">
                        {city.tag}
                      </span>
                    )}

                    {/* Gradient Overlay at Bottom of Photo */}
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent text-white">
                      <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider block">
                        INDIA · VERIFIED STAY DESTINATION
                      </span>
                      <strong className="text-xl sm:text-2xl font-black tracking-tight">{city.name}</strong>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-5 sm:p-6">
                    <p className="text-xs font-bold text-[#003b95] mb-1.5 flex items-center gap-1.5">
                      <i className="fa-solid fa-location-dot text-[11px]" />
                      <span>{city.highlight}</span>
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-4">
                      {city.description}
                    </p>

                    {/* Best Time & Verified Count */}
                    <div className="flex items-center justify-between text-xs pt-3.5 border-t border-slate-100">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-semibold uppercase">Properties</span>
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-slate-900 mt-0.5">
                          <i className="fa-solid fa-hotel text-slate-400 text-[11px]" />
                          <span>{city.hotelsCount || 1}+ verified stays</span>
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Starting from</span>
                        <span className="text-base font-black text-slate-900 mt-0.5 block">
                          {formatPrice ? formatPrice(city.minPrice || 2499) : `₹${city.minPrice || 2499}`}
                          <span className="text-[10px] font-normal text-slate-500">/night</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer Button */}
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-800 group-hover:bg-black group-hover:text-white transition-colors duration-200">
                  <span>Explore stays in {city.name}</span>
                  <i className="fa-solid fa-arrow-right text-[11px] group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}

      </section>

      {/* 4. EXPANSION BANNER */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-8 mt-14">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="max-w-2xl text-left">
            <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider inline-block mb-3 border border-amber-400/30">
              EXPANDING ACROSS INDIA
            </span>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
              Are you a hotelier or resort owner?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Join Hotel Factories direct network. List your hotel, manage room inventory in real-time, and get direct booking payouts with zero commission surprises.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => switchNav('admin')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-slate-950 font-bold text-xs sm:text-sm hover:bg-slate-100 shadow-md transition-all cursor-pointer text-center"
            >
              List Your Hotel Property
            </button>
            <button
              onClick={() => switchNav('home')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all cursor-pointer text-center"
            >
              Back to Home
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
