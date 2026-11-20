'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import CustomDatePicker from '../components/CustomDatePicker';
import { getDefaultDates } from '../utils/helpers';

export default function SearchScreen() {
  const { 
    hotels, 
    searchQuery, 
    setSearchQuery, 
    selectedCategory: contextCategory,
    setSelectedCategory: setContextCategory,
    resetFilters, 
    formatPrice, 
    filterSort, 
    setFilterSort, 
    switchNav,
    openHotelDetail,
    toggleFavorite,
    favorites,
    showToast,
    searchParams,
    setSearchParams
  } = useApp();

  // Top Bar Search States
  const [destinationInput, setDestinationInput] = useState(() => searchQuery || '');
  const [checkInDate, setCheckInDate] = useState(() => searchParams?.checkInDate || getDefaultDates().checkIn);
  const [checkOutDate, setCheckOutDate] = useState(() => searchParams?.checkOutDate || getDefaultDates().checkOut);
  const [rooms, setRooms] = useState(() => searchParams?.rooms || 1);
  const [adults, setAdults] = useState(() => searchParams?.adults || 2);
  const [childrenCount, setChildrenCount] = useState(() => searchParams?.childrenCount || 0);
  const [activePopover, setActivePopover] = useState(null); // 'dest' | 'checkin' | 'checkout' | 'guests'
  const topBarRef = useRef(null);

  // Sync internal state when searchParams changes from outside
  useEffect(() => {
    if (searchParams?.adults) setAdults(searchParams.adults);
    if (searchParams?.childrenCount !== undefined) setChildrenCount(searchParams.childrenCount);
    if (searchParams?.rooms) setRooms(searchParams.rooms);
    if (searchParams?.checkInDate) setCheckInDate(searchParams.checkInDate);
    if (searchParams?.checkOutDate) setCheckOutDate(searchParams.checkOutDate);
  }, [searchParams]);

  // AI Filter State
  const [aiFilterQuery, setAiFilterQuery] = useState('');

  // Sidebar Filter States
  const [selectedLocalities, setSelectedLocalities] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedPriceTier, setSelectedPriceTier] = useState('all'); // 'all' | 'under2k' | '2k-4k' | '4k-8k' | 'above8k'
  const [minRating, setMinRating] = useState(0); // 0, 3.5, 4.0, 4.5
  const [selectedCategory, setSelectedCategory] = useState(() => contextCategory || 'All');
  const [activeDealFilter, setActiveDealFilter] = useState('all'); // 'all' | 'flash' | 'budget' | 'under999' | 'exclusive'
  const [activeQuickChip, setActiveQuickChip] = useState(null);

  // Stable clean categories matching the platform theme
  const availableCategories = useMemo(() => {
    return ['All', 'Hotels', 'Resorts'];
  }, []);

  // Collapsible Accordions in Sidebar
  const [openSections, setOpenSections] = useState({
    price: true,
    rating: true,
    localities: true,
    propertyType: true,
    amenities: true
  });

  // Photo Carousel State for Each Hotel
  const [photoIndices, setPhotoIndices] = useState({});

  // Flash Deal Countdown Timer (Matches 15:19:08 from reference image)
  const [timeLeft, setTimeLeft] = useState({ hours: 15, minutes: 19, seconds: 8 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 15, minutes: 19, seconds: 8 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync searchQuery & contextCategory when parent context updates
  useEffect(() => {
    if (searchQuery !== undefined) {
      setDestinationInput(searchQuery);
      setSelectedLocalities([]);
      setSelectedPriceTier('all');
      setMinRating(0);
      setAiFilterQuery('');
      setActiveDealFilter('all');
      setActiveQuickChip(null);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (contextCategory) setSelectedCategory(contextCategory);
  }, [contextCategory]);

  // Handle click outside popovers
  useEffect(() => {
    function handleClickOutside(e) {
      if (topBarRef.current && !topBarRef.current.contains(e.target)) {
        setActivePopover(null);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setActivePopover(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Helper date display parser (e.g. "21 Oct, Wed")
  const parseDisplayDate = (dateStr) => {
    if (!dateStr) return { formatted: '21 Oct, Wed' };
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return { formatted: '21 Oct, Wed' };
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      formatted: `${d.getDate()} ${months[d.getMonth()]}, ${days[d.getDay()]}`
    };
  };

  // Live Count Statistics for Top Deal Filter Cards
  const dealCardStats = useMemo(() => {
    if (!Array.isArray(hotels)) return { flash: 0, budget: 0, under999: 0, exclusive: 0 };
    let flash = 0;
    let budget = 0;
    let under999 = 0;
    let exclusive = 0;

    hotels.forEach(h => {
      const p = Number(h.startingPrice || 0);
      const orig = Number(h.originalPrice || 0);
      // Flash deal: featured, marked as flash deal, or has valid strike-through discount
      if (h.featured || h.isFlashDeal || (h.badge && h.badge.toLowerCase().includes('flash')) || (orig > p)) {
        flash++;
      }
      // Budget: Under 3000
      if (p > 0 && p <= 3000) {
        budget++;
      }
      // Super Value: Under 2000
      if (p > 0 && p <= 2000) {
        under999++;
      }
      // HF Royal / Luxury: 5-star, high price (>=5000) or high rating (>=4.85)
      if (p >= 5000 || Number(h.starRating) >= 5 || Number(h.rating) >= 4.85) {
        exclusive++;
      }
    });

    return { flash, budget, under999, exclusive };
  }, [hotels]);

  const inDateInfo = useMemo(() => parseDisplayDate(checkInDate), [checkInDate]);
  const outDateInfo = useMemo(() => parseDisplayDate(checkOutDate), [checkOutDate]);

  const handleApplySearch = () => {
    setActivePopover(null);
    setSearchQuery(destinationInput);
    setSearchParams({
      checkInDate,
      checkOutDate,
      adults,
      rooms,
      childrenCount
    });
    showToast(`Updated search for "${destinationInput}"`);
  };

  const handleHotelClick = (hotelId, hotel) => {
    if (setSearchParams) {
      setSearchParams(prev => ({
        ...prev,
        checkInDate,
        checkOutDate,
        adults,
        rooms,
        childrenCount
      }));
    }
    openHotelDetail(hotelId, hotel);
  };

  const handleLocalityToggle = (loc) => {
    setSelectedLocalities(prev => 
      prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
    );
  };

  const handleAmenityToggle = (amenity) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleClearAllFilters = () => {
    setSelectedLocalities([]);
    setSelectedAmenities([]);
    setSelectedPriceTier('all');
    setMinRating(0);
    setSelectedCategory('All');
    setActiveDealFilter('all');
    setActiveQuickChip(null);
    setAiFilterQuery('');
    resetFilters();
    showToast('Filters cleared');
  };

  // Filtering Logic
  const filteredHotels = useMemo(() => {
    return hotels.filter(h => {
      // 1. Text Search Query
      const query = (destinationInput || '').trim().toLowerCase();
      if (query && query !== 'near me' && query !== 'all' && query !== 'all destinations') {
        const matchesQuery = 
          (h.name && h.name.toLowerCase().includes(query)) ||
          (h.city && h.city.toLowerCase().includes(query)) ||
          (h.state && h.state.toLowerCase().includes(query)) ||
          (h.country && h.country.toLowerCase().includes(query)) ||
          (h.locality && h.locality.toLowerCase().includes(query)) ||
          (h.address && h.address.toLowerCase().includes(query)) ||
          (h.category && h.category.toLowerCase().includes(query)) ||
          (h.description && h.description.toLowerCase().includes(query)) ||
          (h.amenities && h.amenities.some(a => a.toLowerCase().includes(query))) ||
          (h.rooms && h.rooms.some(r => (r.name && r.name.toLowerCase().includes(query)) || (r.type && r.type.toLowerCase().includes(query))));
        if (!matchesQuery) return false;
      }

      // 2. AI Smart Filter Query
      if (aiFilterQuery.trim()) {
        const aiQ = aiFilterQuery.toLowerCase();
        const matchesAi = 
          (h.name && h.name.toLowerCase().includes(aiQ)) ||
          (h.city && h.city.toLowerCase().includes(aiQ)) ||
          (h.locality && h.locality.toLowerCase().includes(aiQ)) ||
          (h.amenities && h.amenities.some(a => a.toLowerCase().includes(aiQ))) ||
          (h.description && h.description.toLowerCase().includes(aiQ));
        if (!matchesAi) return false;
      }

      // 3. Price Tier
      const price = Number(h.startingPrice || 0);
      if (selectedPriceTier === 'under2k' && price >= 2000) return false;
      if (selectedPriceTier === '2k-4k' && (price < 2000 || price > 4000)) return false;
      if (selectedPriceTier === '4k-8k' && (price < 4000 || price > 8000)) return false;
      if (selectedPriceTier === 'above8k' && price < 8000) return false;

      // 4. Rating Filter
      if (minRating > 0 && (Number(h.rating) || 0) < minRating) return false;

      // 5. Category / Property Type
      if (selectedCategory !== 'All') {
        const sel = selectedCategory.toLowerCase().trim();
        const hCat = (h.category || '').toLowerCase().trim();
        const matches =
          hCat === sel ||
          hCat.replace(/s$/, '') === sel.replace(/s$/, '') ||
          (sel === 'hotels' && (hCat === 'hotels' || hCat === 'hotel' || hCat === 'all'));
        if (!matches) return false;
      }

      // 6. Selected Localities / Cities
      if (selectedLocalities.length > 0) {
        const cityOrLoc = `${h.city || ''} ${h.locality || ''}`.toLowerCase();
        const matchesLoc = selectedLocalities.some(loc => cityOrLoc.includes(loc.toLowerCase()));
        if (!matchesLoc) return false;
      }

      // 7. Selected Amenities
      if (selectedAmenities.length > 0) {
        if (!h.amenities || !Array.isArray(h.amenities)) return false;
        const hasAllAmenities = selectedAmenities.every(req => 
          h.amenities.some(a => a.toLowerCase().includes(req.toLowerCase()))
        );
        if (!hasAllAmenities) return false;
      }

      // 8. Deal Filter Top Cards (Intuitive and transparent mapping)
      if (activeDealFilter === 'flash') {
        const orig = Number(h.originalPrice || 0);
        const isFlash = Boolean(h.featured || h.isFlashDeal || (h.badge && h.badge.toLowerCase().includes('flash')) || (orig > price));
        if (!isFlash) return false;
      } else if (activeDealFilter === 'budget') {
        if (price > 3000) return false;
      } else if (activeDealFilter === 'under999') {
        if (price > 2000) return false;
      } else if (activeDealFilter === 'exclusive') {
        const isRoyal = price >= 5000 || Number(h.starRating) >= 5 || Number(h.rating) >= 4.85;
        if (!isRoyal) return false;
      }

      return true;
    });
  }, [
    hotels, 
    destinationInput, 
    aiFilterQuery, 
    selectedPriceTier, 
    minRating, 
    selectedCategory, 
    selectedLocalities, 
    selectedAmenities, 
    activeDealFilter
  ]);

  // Sort
  const sortedHotels = useMemo(() => {
    const list = [...filteredHotels];
    if (filterSort === 'price_low') {
      list.sort((a, b) => (Number(a.startingPrice) || 0) - (Number(b.startingPrice) || 0));
    } else if (filterSort === 'price_high') {
      list.sort((a, b) => (Number(b.startingPrice) || 0) - (Number(a.startingPrice) || 0));
    } else if (filterSort === 'rating') {
      list.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    }
    return list;
  }, [filteredHotels, filterSort]);

  // Carousel Image Cycler
  const handleNextPhoto = (e, hotelId, max) => {
    e.stopPropagation();
    setPhotoIndices(prev => ({
      ...prev,
      [hotelId]: ((prev[hotelId] || 0) + 1) % max
    }));
  };

  const handlePrevPhoto = (e, hotelId, max) => {
    e.stopPropagation();
    setPhotoIndices(prev => ({
      ...prev,
      [hotelId]: ((prev[hotelId] || 0) - 1 + max) % max
    }));
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-900 pb-20">
      
      {/* =========================================================================
          TOP CONSOLIDATED SEARCH CONSOLE BAR
          Clean white card, subtle border, primary red search CTA (#0ea5e9)
          ========================================================================= */}
      <section className="bg-white border-b border-slate-200/80 py-3 shadow-2xs relative z-30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div 
            ref={topBarRef}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center relative"
          >
            {/* Segment 1: City, Area or Hotel Name */}
            <div 
              className="flex-1 px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors rounded-t-2xl lg:rounded-t-none lg:rounded-l-2xl border-b lg:border-b-0 lg:border-r border-slate-200"
              onClick={() => setActivePopover(activePopover === 'dest' ? null : 'dest')}
            >
              <i className="fa-solid fa-magnifying-glass text-slate-400 text-sm"></i>
              <div className="flex-1 min-w-0">
                <span className="block text-[11px] text-slate-400 font-medium leading-none mb-1">
                  City, area or hotel name
                </span>
                <input 
                  type="text"
                  value={destinationInput}
                  onChange={(e) => setDestinationInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplySearch()}
                  placeholder="Near me or City"
                  className="w-full bg-transparent font-bold text-slate-900 text-sm md:text-base outline-none truncate"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              {destinationInput && (
                <button 
                  type="button"
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); setDestinationInput(''); }}
                >
                  <i className="fa-solid fa-xmark text-xs"></i>
                </button>
              )}

              {/* Destination Dropdown Popover */}
              {activePopover === 'dest' && (
                <div 
                  className="absolute left-0 top-[calc(100%+8px)] z-50 w-full sm:w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 animate-in fade-in slide-in-from-top-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Popular Destinations</p>
                  <div className="space-y-1">
                    {['Near me', 'Bhilwara', 'Jaipur', 'Udaipur', 'Goa', 'Manali', 'Mumbai'].map(city => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => {
                          setDestinationInput(city);
                          setActivePopover(null);
                          setSearchQuery(city);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-[#0ea5e9] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <i className={`fa-solid ${city === 'Near me' ? 'fa-location-crosshairs text-[#0ea5e9]' : 'fa-location-dot text-slate-400'}`}></i>
                        <span>{city}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Segment 2: Check in */}
            <div 
              className="lg:w-44 xl:w-48 px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors border-b lg:border-b-0 lg:border-r border-slate-200 relative shrink-0"
              onClick={() => setActivePopover(activePopover === 'checkin' ? null : 'checkin')}
            >
              <i className="fa-regular fa-calendar-days text-slate-400 text-sm"></i>
              <div className="min-w-0">
                <span className="block text-[11px] text-slate-400 font-medium leading-none mb-1">
                  Check in
                </span>
                <span className="block font-bold text-slate-900 text-sm md:text-base leading-none truncate" suppressHydrationWarning>
                  {inDateInfo.formatted}
                </span>
              </div>

              {/* Checkin Datepicker Popover */}
              {activePopover === 'checkin' && (
                <div 
                  className="absolute left-0 top-[calc(100%+8px)] z-50 shadow-2xl rounded-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CustomDatePicker
                    checkInDate={checkInDate}
                    checkOutDate={checkOutDate}
                    initialFocus="checkin"
                    onChange={({ checkInDate: newIn, checkOutDate: newOut }) => {
                      setCheckInDate(newIn);
                      if (newOut) setCheckOutDate(newOut);
                      setActivePopover('checkout');
                    }}
                    onClose={() => setActivePopover(null)}
                  />
                </div>
              )}
            </div>

            {/* Segment 3: Check out */}
            <div 
              className="lg:w-44 xl:w-48 px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors border-b lg:border-b-0 lg:border-r border-slate-200 relative shrink-0"
              onClick={() => setActivePopover(activePopover === 'checkout' ? null : 'checkout')}
            >
              <i className="fa-regular fa-calendar-days text-slate-400 text-sm"></i>
              <div className="min-w-0">
                <span className="block text-[11px] text-slate-400 font-medium leading-none mb-1">
                  Check out
                </span>
                <span className="block font-bold text-slate-900 text-sm md:text-base leading-none truncate" suppressHydrationWarning>
                  {outDateInfo.formatted}
                </span>
              </div>

              {/* Checkout Datepicker Popover */}
              {activePopover === 'checkout' && (
                <div 
                  className="absolute left-0 lg:-left-20 top-[calc(100%+8px)] z-50 shadow-2xl rounded-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CustomDatePicker
                    checkInDate={checkInDate}
                    checkOutDate={checkOutDate}
                    initialFocus="checkout"
                    onChange={({ checkInDate: newIn, checkOutDate: newOut }) => {
                      if (newIn) setCheckInDate(newIn);
                      if (newOut) setCheckOutDate(newOut);
                      setActivePopover(null);
                    }}
                    onClose={() => setActivePopover(null)}
                  />
                </div>
              )}
            </div>

            {/* Segment 4: No. of rooms & guests */}
            <div 
              className="lg:w-48 xl:w-56 px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors relative shrink-0"
              onClick={() => setActivePopover(activePopover === 'guests' ? null : 'guests')}
            >
              <i className="fa-solid fa-user-group text-slate-400 text-sm"></i>
              <div className="min-w-0">
                <span className="block text-[11px] text-slate-400 font-medium leading-none mb-1">
                  No. of rooms &amp; guests
                </span>
                <span className="block font-bold text-slate-900 text-sm md:text-base leading-none truncate">
                  {rooms} Room · {adults} Adults
                </span>
              </div>

              {/* Rooms & Guests Stepper Popover */}
              {activePopover === 'guests' && (
                <div 
                  className="absolute right-0 top-[calc(100%+8px)] z-50 shadow-2xl rounded-2xl bg-white border border-slate-200/90 p-5 w-76 sm:w-80 animate-in fade-in slide-in-from-top-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="space-y-4">
                    {/* Room Stepper */}
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-sm">Room</span>
                      <div className="border border-slate-300 rounded-lg flex items-center justify-between w-24 h-9 px-2.5 bg-white">
                        <button
                          type="button"
                          disabled={rooms <= 1}
                          onClick={() => setRooms(Math.max(1, rooms - 1))}
                          className="text-slate-400 hover:text-slate-800 disabled:opacity-30 text-lg leading-none cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-bold text-slate-900 text-sm">{rooms}</span>
                        <button
                          type="button"
                          onClick={() => setRooms(rooms + 1)}
                          className="text-slate-500 hover:text-slate-900 text-lg leading-none cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Adults Stepper */}
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-sm">Adults</span>
                      <div className="border border-slate-300 rounded-lg flex items-center justify-between w-24 h-9 px-2.5 bg-white">
                        <button
                          type="button"
                          disabled={adults <= 1}
                          onClick={() => setAdults(Math.max(1, adults - 1))}
                          className="text-slate-400 hover:text-slate-800 disabled:opacity-30 text-lg leading-none cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-bold text-slate-900 text-sm">{adults}</span>
                        <button
                          type="button"
                          onClick={() => setAdults(adults + 1)}
                          className="text-slate-500 hover:text-slate-900 text-lg leading-none cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Children Stepper */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block font-bold text-slate-800 text-sm">Children</span>
                        <span className="block text-[11px] text-slate-400">0 - 17 Years Old</span>
                      </div>
                      <div className="border border-slate-300 rounded-lg flex items-center justify-between w-24 h-9 px-2.5 bg-white">
                        <button
                          type="button"
                          disabled={childrenCount <= 0}
                          onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                          className="text-slate-400 hover:text-slate-800 disabled:opacity-30 text-lg leading-none cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-bold text-slate-900 text-sm">{childrenCount}</span>
                        <button
                          type="button"
                          onClick={() => setChildrenCount(childrenCount + 1)}
                          className="text-slate-500 hover:text-slate-900 text-lg leading-none cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="w-full mt-2 py-2 rounded-xl bg-teal-500 text-white font-bold text-xs uppercase tracking-wider hover:bg-teal-600 transition-colors cursor-pointer"
                      onClick={() => setActivePopover(null)}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Segment 5: Search Button - Brand Coral Red */}
            <div className="p-2 sm:p-2.5 flex items-center justify-end lg:justify-center shrink-0">
              <button
                type="button"
                onClick={handleApplySearch}
                aria-label="Search properties"
                className="w-12 h-12 lg:w-11 lg:h-11 rounded-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white flex items-center justify-center shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <i className="fa-solid fa-magnifying-glass text-base"></i>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          MAIN 2-COLUMN VIEWPORT: LEFT FILTERS SIDEBAR + RIGHT RESULTS AREA
          ========================================================================= */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* ======================= LEFT COLUMN: SIDEBAR ======================= */}
          <aside className="w-full lg:w-[280px] xl:w-[300px] shrink-0 space-y-4">
            
            {/* 1. Simple Keyword Search Card */}
            <div className="rounded-2xl p-4 bg-white border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-extrabold text-slate-900 text-sm">
                  <i className="fa-solid fa-magnifying-glass text-slate-700 text-xs" />
                  <span>Search by Name &amp; Area</span>
                </div>
                {aiFilterQuery && (
                  <button
                    type="button"
                    onClick={() => setAiFilterQuery('')}
                    className="text-[11px] font-bold text-[#0ea5e9] hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Clean Simple Search Input */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 focus-within:border-slate-800 focus-within:bg-white focus-within:ring-1 focus-within:ring-slate-800 px-3 py-2 flex items-center gap-2 transition-all shadow-2xs">
                <i className="fa-solid fa-search text-slate-400 text-xs shrink-0" />
                <input
                  type="text"
                  value={aiFilterQuery}
                  onChange={(e) => setAiFilterQuery(e.target.value)}
                  placeholder="Search hotel name, location, amenity..."
                  className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 outline-none font-medium"
                />
                {aiFilterQuery && (
                  <button
                    type="button"
                    aria-label="Clear search input"
                    onClick={() => setAiFilterQuery('')}
                    className="w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] transition-colors cursor-pointer shrink-0"
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Main Filters Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Filters</h3>
                {(selectedLocalities.length > 0 || selectedAmenities.length > 0 || selectedPriceTier !== 'all' || minRating > 0 || selectedCategory !== 'All') && (
                  <button 
                    type="button"
                    onClick={handleClearAllFilters}
                    className="text-xs font-bold text-[#0ea5e9] hover:underline cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Quick Filter Pill Buttons (Matches Reference Image) */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {[
                  { id: 'price', label: 'Price per night' },
                  { id: 'breakfast', label: 'Free Breakfast' },
                  { id: 'localities', label: 'Localities' },
                  { id: 'rating', label: 'Customer Rating' }
                ].map(chip => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => {
                      if (chip.id === 'breakfast') {
                        handleAmenityToggle('Breakfast');
                      } else {
                        setActiveQuickChip(activeQuickChip === chip.id ? null : chip.id);
                        toggleSection(chip.id === 'rating' ? 'rating' : chip.id === 'localities' ? 'localities' : 'price');
                      }
                    }}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      (chip.id === 'breakfast' && selectedAmenities.some(a => a.toLowerCase().includes('breakfast'))) || activeQuickChip === chip.id
                        ? 'border-[#0ea5e9] bg-sky-50 text-[#0ea5e9]'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Accordion 1: Price per night */}
              <div className="border-t border-slate-100 pt-3 mb-3">
                <button
                  type="button"
                  className="w-full flex items-center justify-between text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2 cursor-pointer"
                  onClick={() => toggleSection('price')}
                >
                  <span>Price per night</span>
                  <i className={`fa-solid fa-chevron-down text-slate-400 text-[10px] transition-transform ${openSections.price ? 'rotate-180' : ''}`}></i>
                </button>
                {openSections.price && (
                  <div className="space-y-1.5 pt-1 text-xs">
                    {[
                      { id: 'all', label: 'All Prices' },
                      { id: 'under2k', label: 'Under ₹2,000' },
                      { id: '2k-4k', label: '₹2,000 - ₹4,000' },
                      { id: '4k-8k', label: '₹4,000 - ₹8,000' },
                      { id: 'above8k', label: '₹8,000+' }
                    ].map(tier => (
                      <label key={tier.id} className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-900 py-0.5">
                        <input
                          type="radio"
                          name="priceTier"
                          checked={selectedPriceTier === tier.id}
                          onChange={() => setSelectedPriceTier(tier.id)}
                          className="accent-[#0ea5e9] cursor-pointer"
                        />
                        <span>{tier.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Accordion 2: Customer Rating */}
              <div className="border-t border-slate-100 pt-3 mb-3">
                <button
                  type="button"
                  className="w-full flex items-center justify-between text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2 cursor-pointer"
                  onClick={() => toggleSection('rating')}
                >
                  <span>Customer Rating</span>
                  <i className={`fa-solid fa-chevron-down text-slate-400 text-[10px] transition-transform ${openSections.rating ? 'rotate-180' : ''}`}></i>
                </button>
                {openSections.rating && (
                  <div className="space-y-1.5 pt-1 text-xs">
                    {[
                      { val: 0, label: 'All Ratings' },
                      { val: 4.5, label: '4.5+ Exceptional' },
                      { val: 4.0, label: '4.0+ Very Good' },
                      { val: 3.5, label: '3.5+ Good' }
                    ].map(r => (
                      <label key={r.val} className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-900 py-0.5">
                        <input
                          type="radio"
                          name="ratingFilter"
                          checked={minRating === r.val}
                          onChange={() => setMinRating(r.val)}
                          className="accent-[#0ea5e9] cursor-pointer"
                        />
                        <span className="flex items-center gap-1">
                          {r.val > 0 && <span className="font-bold text-emerald-700">★</span>}
                          {r.label}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Accordion 3: Localities & Cities */}
              <div className="border-t border-slate-100 pt-3 mb-3">
                <button
                  type="button"
                  className="w-full flex items-center justify-between text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2 cursor-pointer"
                  onClick={() => toggleSection('localities')}
                >
                  <span>Popular Localities</span>
                  <i className={`fa-solid fa-chevron-down text-slate-400 text-[10px] transition-transform ${openSections.localities ? 'rotate-180' : ''}`}></i>
                </button>
                {openSections.localities && (
                  <div className="space-y-1.5 pt-1 text-xs">
                    {['Bhilwara', 'Jaipur', 'Udaipur', 'Goa', 'Manali'].map(loc => (
                      <label key={loc} className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-900 py-0.5">
                        <input
                          type="checkbox"
                          checked={selectedLocalities.includes(loc)}
                          onChange={() => handleLocalityToggle(loc)}
                          className="accent-[#0ea5e9] rounded cursor-pointer"
                        />
                        <span>{loc}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Accordion 4: Property Type / Category */}
              <div className="border-t border-slate-100 pt-3 mb-3">
                <button
                  type="button"
                  className="w-full flex items-center justify-between text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2 cursor-pointer"
                  onClick={() => toggleSection('propertyType')}
                >
                  <span>Property Type</span>
                  <i className={`fa-solid fa-chevron-down text-slate-400 text-[10px] transition-transform ${openSections.propertyType ? 'rotate-180' : ''}`}></i>
                </button>
                {openSections.propertyType && (
                  <div className="space-y-1.5 pt-1 text-xs">
                    {availableCategories.map(cat => {
                      const count = cat === 'All' 
                        ? (hotels?.length || 0)
                        : (hotels?.filter(h => h.category === cat).length || 0);
                      return (
                        <label key={cat} className="flex items-center justify-between cursor-pointer text-slate-600 hover:text-slate-900 py-0.5 group">
                          <span className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="categoryFilter"
                              checked={selectedCategory === cat}
                              onChange={() => setSelectedCategory(cat)}
                              className="accent-[#0ea5e9] cursor-pointer"
                            />
                            <span>{cat}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 group-hover:text-slate-600 font-semibold">
                            {count}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Accordion 5: Amenities */}
              <div className="border-t border-slate-100 pt-3">
                <button
                  type="button"
                  className="w-full flex items-center justify-between text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2 cursor-pointer"
                  onClick={() => toggleSection('amenities')}
                >
                  <span>Popular Amenities</span>
                  <i className={`fa-solid fa-chevron-down text-slate-400 text-[10px] transition-transform ${openSections.amenities ? 'rotate-180' : ''}`}></i>
                </button>
                {openSections.amenities && (
                  <div className="space-y-1.5 pt-1 text-xs">
                    {[
                      { id: 'Breakfast', label: 'Free Breakfast' },
                      { id: 'Pool', label: 'Swimming Pool' },
                      { id: 'WiFi', label: 'High-Speed WiFi' },
                      { id: 'Spa', label: 'Luxury Spa' },
                      { id: 'Bar', label: 'Bar & Lounge' },
                      { id: 'Parking', label: 'Free Parking' }
                    ].map(am => (
                      <label key={am.id} className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-900 py-0.5">
                        <input
                          type="checkbox"
                          checked={selectedAmenities.includes(am.id)}
                          onChange={() => handleAmenityToggle(am.id)}
                          className="accent-[#0ea5e9] rounded cursor-pointer"
                        />
                        <span>{am.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </aside>

          {/* ======================= RIGHT COLUMN: RESULTS ======================= */}
          <main className="flex-1 w-full min-w-0 space-y-4">
            
            {/* Top 4 Promotional Deal Cards - Clean Luxury Theme with Live Counts & Active States */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              
              {/* Card 1: Flash Deals */}
              <div 
                onClick={() => {
                  const next = activeDealFilter === 'flash' ? 'all' : 'flash';
                  setActiveDealFilter(next);
                  showToast(next === 'flash' ? `Filtered ${dealCardStats.flash} Flash Deals` : 'Cleared Flash Deals filter');
                }}
                className={`group rounded-2xl p-3.5 border cursor-pointer hover:shadow-md transition-all flex flex-col justify-between min-h-[102px] ${
                  activeDealFilter === 'flash' 
                    ? 'bg-black text-white border-black shadow-md ring-2 ring-black' 
                    : 'bg-white border-slate-200/90 hover:border-black shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                      activeDealFilter === 'flash' ? 'bg-white/20 text-white' : 'bg-sky-50 text-[#003b95] border border-sky-100'
                    }`}>
                      <i className="fa-regular fa-clock text-[9px]" />
                      <span>Flash Deals</span>
                    </span>
                    <span className={`text-[10px] font-extrabold ${activeDealFilter === 'flash' ? 'text-amber-300' : 'text-slate-500'}`}>
                      {dealCardStats.flash} Live
                    </span>
                  </div>
                  <div className={`text-[10px] font-medium leading-none mt-1 ${activeDealFilter === 'flash' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Ends in
                  </div>
                  <div className={`font-black text-xs sm:text-sm font-mono mt-0.5 tracking-wider ${activeDealFilter === 'flash' ? 'text-white' : 'text-slate-900'}`}>
                    {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className={`text-[10px] font-bold ${activeDealFilter === 'flash' ? 'text-white' : 'text-slate-500'}`}>
                    {activeDealFilter === 'flash' ? '✓ Applied' : 'Tap to apply'}
                  </span>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-all ${
                    activeDealFilter === 'flash' ? 'bg-white text-black' : 'bg-slate-100 text-slate-700 group-hover:bg-black group-hover:text-white'
                  }`}>
                    <i className={activeDealFilter === 'flash' ? 'fa-solid fa-check text-[9px]' : 'fa-solid fa-arrow-right text-[9px]'} />
                  </span>
                </div>
              </div>

              {/* Card 2: Budget Brands */}
              <div 
                onClick={() => {
                  const next = activeDealFilter === 'budget' ? 'all' : 'budget';
                  setActiveDealFilter(next);
                  showToast(next === 'budget' ? `Showing ${dealCardStats.budget} Budget Brands under ₹3,000` : 'Cleared Budget filter');
                }}
                className={`group rounded-2xl p-3.5 border cursor-pointer hover:shadow-md transition-all flex flex-col justify-between min-h-[102px] ${
                  activeDealFilter === 'budget' 
                    ? 'bg-black text-white border-black shadow-md ring-2 ring-black' 
                    : 'bg-white border-slate-200/90 hover:border-black shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                      activeDealFilter === 'budget' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      Verified Stays
                    </span>
                    <span className={`text-[10px] font-extrabold ${activeDealFilter === 'budget' ? 'text-slate-200' : 'text-slate-500'}`}>
                      {dealCardStats.budget} Stays
                    </span>
                  </div>
                  <div className={`text-sm font-black tracking-tight leading-tight ${activeDealFilter === 'budget' ? 'text-white' : 'text-slate-900'}`}>
                    Budget Brands
                  </div>
                  <div className={`text-[11px] font-medium mt-0.5 ${activeDealFilter === 'budget' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Under ₹3,000
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className={`text-[10px] font-bold ${activeDealFilter === 'budget' ? 'text-white' : 'text-slate-500'}`}>
                    {activeDealFilter === 'budget' ? '✓ Applied' : 'Tap to apply'}
                  </span>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-all ${
                    activeDealFilter === 'budget' ? 'bg-white text-black' : 'bg-slate-100 text-slate-700 group-hover:bg-black group-hover:text-white'
                  }`}>
                    <i className={activeDealFilter === 'budget' ? 'fa-solid fa-check text-[9px]' : 'fa-solid fa-arrow-right text-[9px]'} />
                  </span>
                </div>
              </div>

              {/* Card 3: Under ₹1,999 / Value Stays */}
              <div 
                onClick={() => {
                  const next = activeDealFilter === 'under999' ? 'all' : 'under999';
                  setActiveDealFilter(next);
                  showToast(next === 'under999' ? `Showing ${dealCardStats.under999} stays under ₹1,999` : 'Cleared pocket-friendly filter');
                }}
                className={`group rounded-2xl p-3.5 border cursor-pointer hover:shadow-md transition-all flex flex-col justify-between min-h-[102px] ${
                  activeDealFilter === 'under999' 
                    ? 'bg-black text-white border-black shadow-md ring-2 ring-black' 
                    : 'bg-white border-slate-200/90 hover:border-black shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                      activeDealFilter === 'under999' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      Super Value
                    </span>
                    <span className={`text-[10px] font-extrabold ${activeDealFilter === 'under999' ? 'text-slate-200' : 'text-slate-500'}`}>
                      {dealCardStats.under999} Stays
                    </span>
                  </div>
                  <div className={`text-sm sm:text-base font-black tracking-tight leading-tight ${activeDealFilter === 'under999' ? 'text-white' : 'text-slate-900'}`}>
                    Under ₹1,999
                  </div>
                  <div className={`text-[11px] font-medium mt-0.5 ${activeDealFilter === 'under999' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Pocket Friendly
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className={`text-[10px] font-bold ${activeDealFilter === 'under999' ? 'text-white' : 'text-slate-500'}`}>
                    {activeDealFilter === 'under999' ? '✓ Applied' : 'Tap to apply'}
                  </span>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-all ${
                    activeDealFilter === 'under999' ? 'bg-white text-black' : 'bg-slate-100 text-slate-700 group-hover:bg-black group-hover:text-white'
                  }`}>
                    <i className={activeDealFilter === 'under999' ? 'fa-solid fa-check text-[9px]' : 'fa-solid fa-arrow-right text-[9px]'} />
                  </span>
                </div>
              </div>

              {/* Card 4: Exclusive HF Deals */}
              <div 
                onClick={() => {
                  const next = activeDealFilter === 'exclusive' ? 'all' : 'exclusive';
                  setActiveDealFilter(next);
                  showToast(next === 'exclusive' ? `Showing ${dealCardStats.exclusive} Luxury & Heritage Stays` : 'Cleared Royal Deals filter');
                }}
                className={`group rounded-2xl p-3.5 border cursor-pointer hover:shadow-md transition-all flex flex-col justify-between min-h-[102px] ${
                  activeDealFilter === 'exclusive' 
                    ? 'bg-black text-white border-black shadow-md ring-2 ring-black' 
                    : 'bg-white border-slate-200/90 hover:border-black shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                      activeDealFilter === 'exclusive' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-900 border border-amber-200/80'
                    }`}>
                      ✦ Exclusive
                    </span>
                    <span className={`text-[10px] font-extrabold ${activeDealFilter === 'exclusive' ? 'text-amber-200' : 'text-slate-500'}`}>
                      {dealCardStats.exclusive} Stays
                    </span>
                  </div>
                  <div className={`text-sm font-black tracking-tight leading-tight ${activeDealFilter === 'exclusive' ? 'text-white' : 'text-slate-900'}`}>
                    HF Royal Deals
                  </div>
                  <div className={`text-[11px] font-medium mt-0.5 ${activeDealFilter === 'exclusive' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Luxury &amp; Heritage
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className={`text-[10px] font-bold ${activeDealFilter === 'exclusive' ? 'text-white' : 'text-slate-500'}`}>
                    {activeDealFilter === 'exclusive' ? '✓ Applied' : 'Tap to apply'}
                  </span>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-all ${
                    activeDealFilter === 'exclusive' ? 'bg-white text-black' : 'bg-slate-100 text-slate-700 group-hover:bg-black group-hover:text-white'
                  }`}>
                    <i className={activeDealFilter === 'exclusive' ? 'fa-solid fa-check text-[9px]' : 'fa-solid fa-arrow-right text-[9px]'} />
                  </span>
                </div>
              </div>

            </div>

            {/* Active Filters Summary Bar (Easy for customers to understand & 1-click remove) */}
            {(activeDealFilter !== 'all' || selectedCategory !== 'All' || Boolean(aiFilterQuery.trim()) || selectedPriceTier !== 'all' || minRating > 0 || selectedLocalities.length > 0 || selectedAmenities.length > 0) && (
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mr-1">
                    <i className="fa-solid fa-sliders text-[#0ea5e9] text-xs" />
                    <span>Applied Filters:</span>
                  </span>

                  {/* Deal filter chip */}
                  {activeDealFilter !== 'all' && (
                    <span className="inline-flex items-center gap-1.5 bg-black text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-2xs">
                      <span>
                        {activeDealFilter === 'flash' && `⚡ Flash Deals (${dealCardStats.flash})`}
                        {activeDealFilter === 'budget' && `🏷️ Under ₹3,000 (${dealCardStats.budget})`}
                        {activeDealFilter === 'under999' && `💰 Under ₹1,999 (${dealCardStats.under999})`}
                        {activeDealFilter === 'exclusive' && `👑 HF Royal (${dealCardStats.exclusive})`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveDealFilter('all')}
                        className="hover:text-rose-300 ml-0.5 cursor-pointer font-black"
                        aria-label="Remove deal filter"
                      >
                        ✕
                      </button>
                    </span>
                  )}

                  {/* Category chip */}
                  {selectedCategory !== 'All' && (
                    <span className="inline-flex items-center gap-1.5 bg-white text-slate-800 border border-slate-200 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-2xs">
                      <span>🏨 {selectedCategory}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory('All');
                          if (setContextCategory) setContextCategory('All');
                        }}
                        className="hover:text-rose-500 ml-0.5 cursor-pointer font-black"
                        aria-label="Remove category filter"
                      >
                        ✕
                      </button>
                    </span>
                  )}

                  {/* Keyword query chip */}
                  {aiFilterQuery.trim() && (
                    <span className="inline-flex items-center gap-1.5 bg-white text-slate-800 border border-slate-200 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-2xs">
                      <span>🔍 "{aiFilterQuery}"</span>
                      <button
                        type="button"
                        onClick={() => setAiFilterQuery('')}
                        className="hover:text-rose-500 ml-0.5 cursor-pointer font-black"
                        aria-label="Clear search keyword"
                      >
                        ✕
                      </button>
                    </span>
                  )}

                  {/* Price tier chip */}
                  {selectedPriceTier !== 'all' && (
                    <span className="inline-flex items-center gap-1.5 bg-white text-slate-800 border border-slate-200 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-2xs">
                      <span>
                        💵 {selectedPriceTier === 'under2k' ? 'Under ₹2,000' : selectedPriceTier === '2k-4k' ? '₹2,000 - ₹4,000' : selectedPriceTier === '4k-8k' ? '₹4,000 - ₹8,000' : '₹8,000+'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedPriceTier('all')}
                        className="hover:text-rose-500 ml-0.5 cursor-pointer font-black"
                        aria-label="Remove price filter"
                      >
                        ✕
                      </button>
                    </span>
                  )}

                  {/* Rating chip */}
                  {minRating > 0 && (
                    <span className="inline-flex items-center gap-1.5 bg-white text-slate-800 border border-slate-200 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-2xs">
                      <span>★ {minRating}+ Rating</span>
                      <button
                        type="button"
                        onClick={() => setMinRating(0)}
                        className="hover:text-rose-500 ml-0.5 cursor-pointer font-black"
                        aria-label="Remove rating filter"
                      >
                        ✕
                      </button>
                    </span>
                  )}

                  {/* Localities chips */}
                  {selectedLocalities.map(loc => (
                    <span key={loc} className="inline-flex items-center gap-1.5 bg-white text-slate-800 border border-slate-200 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-2xs">
                      <span>📍 {loc}</span>
                      <button
                        type="button"
                        onClick={() => handleLocalityToggle(loc)}
                        className="hover:text-rose-500 ml-0.5 cursor-pointer font-black"
                        aria-label={`Remove ${loc} filter`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}

                  {/* Amenities chips */}
                  {selectedAmenities.map(am => (
                    <span key={am} className="inline-flex items-center gap-1.5 bg-white text-slate-800 border border-slate-200 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-2xs">
                      <span>✨ {am}</span>
                      <button
                        type="button"
                        onClick={() => handleAmenityToggle(am)}
                        className="hover:text-rose-500 ml-0.5 cursor-pointer font-black"
                        aria-label={`Remove ${am} filter`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>

                {/* Reset all button */}
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1"
                >
                  <i className="fa-solid fa-rotate-left text-[10px]" />
                  <span>Clear all</span>
                </button>
              </div>
            )}

            {/* Results Count & Sort By Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/90 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="text-sm font-extrabold text-slate-800">
                <span>{sortedHotels.length} properties found</span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-semibold">Sort by:</span>
                <div className="flex items-center gap-1">
                  {[
                    { id: 'featured', label: 'Popularity ↓' },
                    { id: 'rating', label: 'Ratings' },
                    { id: 'price_low', label: 'Price' }
                  ].map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setFilterSort(s.id)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        filterSort === s.id
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Location Banner: "Hotels near you" */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  Hotels in {destinationInput || 'your selected area'}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  See verified stays and available boutique suites in this destination.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDestinationInput('Near me');
                  showToast('Detecting precise location for nearby stays...');
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer transition-colors shadow-2xs shrink-0"
              >
                <i className="fa-solid fa-location-crosshairs text-[#0ea5e9]"></i>
                <span>Use precise location</span>
              </button>
            </div>

            {/* Section Heading */}
            <div className="pt-2">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Showing properties in {destinationInput || 'all destinations'}
              </h2>
            </div>

            {/* Hotel Cards List (Horizontal Layout Matching Reference Image) */}
            <div className="space-y-4">
              {sortedHotels.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center my-6 flex flex-col items-center">
                  <i className="fa-solid fa-hotel text-4xl text-slate-300 mb-3"></i>
                  <h3 className="text-base font-bold text-slate-800 mb-1">No hotels match your filters</h3>
                  <p className="text-xs text-slate-500 max-w-sm mb-4">
                    Try relaxing your price, rating, or location filters to see more available properties.
                  </p>
                  <button
                    type="button"
                    onClick={handleClearAllFilters}
                    className="px-5 py-2 rounded-xl bg-[#0ea5e9] text-white text-xs font-bold hover:bg-[#0284c7] transition-colors cursor-pointer active:scale-[0.98]"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                sortedHotels.map(hotel => {
                  const hotelId = hotel.id || hotel._id;
                  const isFavorite = favorites.includes(hotelId);
                  const price = Number(hotel.startingPrice || 2950);
                  const rawOrig = Number(hotel.originalPrice || 0);
                  const originalPrice = rawOrig > price ? rawOrig : Math.round(price * 1.35);
                  const savingsAmount = originalPrice - price;
                  const discountPercent = Math.max(10, Math.round((savingsAmount / originalPrice) * 100));
                  const isFlashEligible = Boolean(hotel.featured || hotel.isFlashDeal || (hotel.badge && hotel.badge.toLowerCase().includes('flash')) || (rawOrig > price));
                  const taxAmount = Math.round(price * 0.12);
                  const rating = Number(hotel.rating || 4.3);
                  const reviewsCount = Number(hotel.reviewsCount || 141);
                  const imagesList = hotel.images && hotel.images.length > 0 ? hotel.images : [hotel.image || '/images/hotel-leaf-goa.png'];
                  const activeImgIdx = photoIndices[hotelId] || 0;
                  const currentImage = imagesList[activeImgIdx % imagesList.length];

                  return (
                    <article
                      key={hotelId}
                      onClick={() => handleHotelClick(hotelId, hotel)}
                      className="w-full bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group cursor-pointer"
                    >
                      {/* Main Card Body (Horizontal Row: Image | Details | Price CTA) */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:h-[235px] md:h-[245px]">
                        
                        {/* 1. Left: Thumbnail & Carousel */}
                        <div className="w-full sm:w-64 md:w-72 h-56 sm:h-full relative overflow-hidden bg-slate-100 shrink-0">
                          <img
                            src={currentImage}
                            alt={hotel.name}
                            loading="lazy"
                            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'; }}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />

                          {/* Flash Deal Overlay Badge on Image */}
                          {isFlashEligible && (
                            <div className="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs border border-white/10">
                              <i className="fa-solid fa-bolt text-amber-400 text-[9px]" />
                              <span>Flash Deal</span>
                            </div>
                          )}

                          {/* Prev / Next photo arrows on desktop hover */}
                          {imagesList.length > 1 && (
                            <>
                              <button
                                type="button"
                                aria-label="Previous photo"
                                onClick={(e) => handlePrevPhoto(e, hotelId, imagesList.length)}
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              >
                                <i className="fa-solid fa-chevron-left text-[10px]"></i>
                              </button>
                              <button
                                type="button"
                                aria-label="Next photo"
                                onClick={(e) => handleNextPhoto(e, hotelId, imagesList.length)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              >
                                <i className="fa-solid fa-chevron-right text-[10px]"></i>
                              </button>
                            </>
                          )}

                          {/* Carousel Pagination Dots */}
                          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-xs">
                            {imagesList.slice(0, 4).map((_, idx) => (
                              <span
                                key={idx}
                                className={`block rounded-full transition-all ${
                                  idx === (activeImgIdx % 4) ? 'w-1.5 h-1.5 bg-white' : 'w-1 h-1 bg-white/50'
                                }`}
                              />
                            ))}
                          </div>

                          {/* Mobile Wishlist Button */}
                          <button
                            type="button"
                            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(hotelId);
                            }}
                            className={`sm:hidden absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full flex items-center justify-center shadow-xs backdrop-blur-xs cursor-pointer ${
                              isFavorite ? 'bg-[#0ea5e9] text-white' : 'bg-white/80 text-slate-700 hover:text-[#0ea5e9]'
                            }`}
                          >
                            <i className={`fa-heart text-xs ${isFavorite ? 'fa-solid' : 'fa-regular'}`}></i>
                          </button>
                        </div>

                        {/* 2. Middle: Details & Badges */}
                        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            {/* Rating Badge */}
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="inline-flex items-center gap-1 bg-[#0f8b4d] text-white text-[11px] font-bold px-1.5 py-0.5 rounded shadow-2xs">
                                <span>★</span>
                                <span>{rating.toFixed(1)}</span>
                              </span>
                            </div>

                            {/* Locality & Address */}
                            <p className="text-xs font-semibold text-slate-700 truncate">
                              {hotel.locality || hotel.address || `${hotel.city}, Rajasthan`}
                            </p>

                            {/* Hotel Title */}
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#0ea5e9] transition-colors mt-1 line-clamp-1 leading-snug">
                              {hotel.name}
                            </h3>

                            {/* Distance Indicator */}
                            <p className="text-[11px] font-semibold text-slate-600 mt-1 flex items-center gap-1">
                              <i className="fa-solid fa-location-dot text-[10px] text-slate-300" />
                              <span>410 m from city center</span>
                            </p>
                          </div>

                          {/* Tag Pills: Early check-in, Breakfast Available, Couple Friendly */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-semibold px-2 py-0.5 rounded">
                              <i className="fa-regular fa-clock text-[9px]"></i>
                              <span>Early check-in</span>
                            </span>
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded">
                              Breakfast Available
                            </span>
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded">
                              Couple Friendly
                            </span>
                            {hotel.amenities && hotel.amenities.slice(0, 1).map((am, idx) => (
                              <span key={idx} className="hidden md:inline-block bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded truncate max-w-[110px]">
                                {am}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* 3. Right: Pricing & CTA */}
                        <div className="p-4 sm:p-5 sm:border-l border-slate-100 flex flex-col justify-between items-start sm:items-end w-full sm:w-48 md:w-56 shrink-0 bg-slate-50/50">
                          {/* Desktop Wishlist Button */}
                          <div className="hidden sm:flex justify-end w-full">
                            <button
                              type="button"
                              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(hotelId);
                              }}
                              className={`w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center transition-all cursor-pointer ${
                                isFavorite ? 'bg-[#0ea5e9] text-white border-[#0ea5e9]' : 'bg-white text-slate-400 hover:text-[#0ea5e9] hover:border-[#0ea5e9] shadow-2xs'
                              }`}
                            >
                              <i className={`fa-heart text-xs ${isFavorite ? 'fa-solid' : 'fa-regular'}`}></i>
                            </button>
                          </div>

                          {/* Price Details Block */}
                          <div className="w-full sm:text-right mt-1 sm:mt-0">
                            <div className="flex items-center sm:justify-end gap-1.5 text-xs font-bold text-[#0ea5e9]">
                              <span>{discountPercent}% off</span>
                              <span className="text-slate-500 font-semibold line-through decoration-rose-500/70 text-[11px]">
                                ₹{originalPrice.toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight my-0.5">
                              ₹{price.toLocaleString('en-IN')}
                            </div>
                            <div className="text-[11px] font-semibold text-slate-600">
                              +₹{taxAmount} tax &amp; fees
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Per night
                            </div>
                          </div>

                          {/* Select Room Action CTA */}
                          <div className="w-full mt-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHotelClick(hotelId, hotel);
                              }}
                              className="w-full py-2.5 px-3 rounded-xl bg-[#0ea5e9] hover:bg-[#0284c7] active:scale-[0.98] text-white font-bold text-xs uppercase tracking-wider shadow-xs hover:shadow-md transition-all cursor-pointer text-center"
                            >
                              Select room
                            </button>
                          </div>
                        </div>

                      </div>

                      {/* 4. Bottom Flash Deal Strip (Clean Luxury Theme matching Card) */}
                      {isFlashEligible && (
                        <div className="w-full bg-amber-50/70 border-t border-amber-100/90 px-4 py-2 flex items-center justify-between text-xs shrink-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-900 font-extrabold text-[10px] uppercase tracking-wider">
                              <i className="fa-solid fa-bolt text-amber-600 text-[9px]" />
                              <span>Flash Deal</span>
                            </span>
                            <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                              <i className="fa-regular fa-clock text-[11px] text-amber-700/70" />
                              <span>Ends in <strong className="font-mono text-slate-800 font-bold">{timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s</strong></span>
                            </span>
                          </div>
                          <span className="text-[11px] font-extrabold text-emerald-700 bg-white border border-emerald-200/90 px-2.5 py-0.5 rounded-md shadow-2xs">
                            Save ₹{savingsAmount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>

          </main>

        </div>
      </div>

      {/* Floating Wishlist Action Button on Bottom Right - Brand Coral Red */}
      <button
        type="button"
        aria-label="View saved hotels"
        onClick={() => switchNav('saved')}
        className="fixed bottom-20 md:bottom-8 right-6 z-40 w-12 h-12 rounded-full bg-teal-500 hover:bg-teal-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
      >
        <i className="fa-solid fa-heart text-base"></i>
        {favorites.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-white text-[#0ea5e9] font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0ea5e9]">
            {favorites.length}
          </span>
        )}
      </button>

    </div>
  );
}
