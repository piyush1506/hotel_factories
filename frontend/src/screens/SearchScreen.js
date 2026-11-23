'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import CustomDatePicker from '../components/CustomDatePicker';
import HotelCardImageCarousel from '../components/common/HotelCardImageCarousel';
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
  const [adultsMale, setAdultsMale] = useState(() => searchParams?.adultsMale !== undefined ? Number(searchParams.adultsMale) : 1);
  const [adultsFemale, setAdultsFemale] = useState(() => searchParams?.adultsFemale !== undefined ? Number(searchParams.adultsFemale) : 1);
  const [childrenCount, setChildrenCount] = useState(() => searchParams?.childrenCount || 0);
  const [activePopover, setActivePopover] = useState(null); // 'dest' | 'checkin' | 'checkout' | 'guests'
  const topBarRef = useRef(null);

  // Sync internal state when searchParams changes from outside
  useEffect(() => {
    if (searchParams?.adultsMale !== undefined) setAdultsMale(Number(searchParams.adultsMale));
    if (searchParams?.adultsFemale !== undefined) setAdultsFemale(Number(searchParams.adultsFemale));
    if (searchParams?.adults) setAdults(Number(searchParams.adults));
    if (searchParams?.childrenCount !== undefined) setChildrenCount(Number(searchParams.childrenCount));
    if (searchParams?.rooms) setRooms(Number(searchParams.rooms));
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
  const [showDealCards, setShowDealCards] = useState(true);
  const [activeQuickChip, setActiveQuickChip] = useState(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const localityOptions = useMemo(() => {
    const set = new Set(['Bhilwara', 'Jaipur', 'Udaipur', 'Goa', 'Manali']);
    if (Array.isArray(hotels)) {
      hotels.forEach(h => {
        if (h.city) set.add(h.city);
      });
    }
    return Array.from(set);
  }, [hotels]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedPriceTier !== 'all') count++;
    if (minRating > 0) count++;
    count += selectedLocalities.length;
    count += selectedAmenities.length;
    if (selectedCategory !== 'All') count++;
    if (activeDealFilter !== 'all') count++;
    if (aiFilterQuery && aiFilterQuery.trim()) count++;
    return count;
  }, [selectedPriceTier, minRating, selectedLocalities, selectedAmenities, selectedCategory, activeDealFilter, aiFilterQuery]);

  const dynamicFilterAmenities = useMemo(() => {
    const counts = {};
    if (Array.isArray(hotels)) {
      hotels.forEach(h => {
        if (Array.isArray(h.amenities)) {
          h.amenities.forEach(a => {
            const trimmed = a.trim();
            if (trimmed) {
              counts[trimmed] = (counts[trimmed] || 0) + 1;
            }
          });
        }
      });
    }
    const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return sorted.length > 0 ? sorted.slice(0, 10) : [];
  }, [hotels]);

  // Stable clean categories matching the platform theme
  const availableCategories = useMemo(() => {
    return ['All', 'Hotels', 'Resorts', 'Dorms & Combos'];
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
      adults: adultsMale + adultsFemale,
      adultsMale,
      adultsFemale,
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
        adults: adultsMale + adultsFemale,
        adultsMale,
        adultsFemale,
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
        const isComboMatch = sel.includes('combo') || sel.includes('dorm');
        const matches =
          (isComboMatch && (hCat.includes('combo') || hCat.includes('dorm') || (Array.isArray(h.rooms) && h.rooms.some(r => r.isCombo || (r.type && r.type.toLowerCase().includes('dorm')))))) ||
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
                  {rooms} Room · {adultsMale + adultsFemale} Adults ({adultsMale}M, {adultsFemale}F)
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

                    {/* Adults (Male) Stepper */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <i className="fa-solid fa-person text-sky-600 text-xs" />
                          <span>Adult (Male)</span>
                        </span>
                        <span className="block text-[10px] text-slate-400">12+ Years</span>
                      </div>
                      <div className="border border-slate-300 rounded-lg flex items-center justify-between w-24 h-9 px-2.5 bg-white">
                        <button
                          type="button"
                          disabled={adultsMale <= 0 || (adultsMale === 1 && adultsFemale === 0)}
                          onClick={() => {
                            const nextM = Math.max(0, adultsMale - 1);
                            if (nextM + adultsFemale >= 1) {
                              setAdultsMale(nextM);
                              setAdults(nextM + adultsFemale);
                            }
                          }}
                          className="text-slate-400 hover:text-slate-800 disabled:opacity-30 text-lg leading-none cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-bold text-slate-900 text-sm">{adultsMale}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const nextM = adultsMale + 1;
                            setAdultsMale(nextM);
                            setAdults(nextM + adultsFemale);
                          }}
                          className="text-slate-500 hover:text-slate-900 text-lg leading-none cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Adults (Female) Stepper */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <i className="fa-solid fa-person-dress text-pink-600 text-xs" />
                          <span>Adult (Female)</span>
                        </span>
                        <span className="block text-[10px] text-slate-400">12+ Years</span>
                      </div>
                      <div className="border border-slate-300 rounded-lg flex items-center justify-between w-24 h-9 px-2.5 bg-white">
                        <button
                          type="button"
                          disabled={adultsFemale <= 0 || (adultsFemale === 1 && adultsMale === 0)}
                          onClick={() => {
                            const nextF = Math.max(0, adultsFemale - 1);
                            if (adultsMale + nextF >= 1) {
                              setAdultsFemale(nextF);
                              setAdults(adultsMale + nextF);
                            }
                          }}
                          className="text-slate-400 hover:text-slate-800 disabled:opacity-30 text-lg leading-none cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-bold text-slate-900 text-sm">{adultsFemale}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const nextF = adultsFemale + 1;
                            setAdultsFemale(nextF);
                            setAdults(adultsMale + nextF);
                          }}
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

            {/* Segment 5: Search Button - Enhanced Professional Center CTA */}
            <div className="p-3 lg:p-2.5 flex items-center justify-center shrink-0 w-full lg:w-auto">
              <button
                type="button"
                onClick={handleApplySearch}
                aria-label="Search properties"
                className="w-full lg:w-auto px-8 lg:px-6 py-3 lg:py-2.5 rounded-xl lg:rounded-full bg-black hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <i className="fa-solid fa-magnifying-glass text-xs"></i>
                <span>Search</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          MAIN FULL-WIDTH RESULTS AREA
          ========================================================================= */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5">
        <main className="w-full space-y-4">
          
          {/* Header Bar: Result Count, Sort By & Dedicated Filter Icon Trigger */}
          <div className="bg-white rounded-md border border-slate-200/90 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-extrabold text-slate-900">
                {sortedHotels.length} {sortedHotels.length === 1 ? 'property' : 'properties'} found
              </span>
              {destinationInput && (
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  in <strong className="text-slate-800">{destinationInput}</strong>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* View Toggle (Grid / List) */}
              <div className="hidden sm:flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-md border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'grid'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Grid view"
                >
                  <i className="fa-solid fa-table-cells-large text-[11px]" />
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'list'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="List view"
                >
                  <i className="fa-solid fa-list-ul text-[11px]" />
                  <span>List</span>
                </button>
              </div>

              {/* Sort By Pills */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-semibold hidden sm:inline">Sort:</span>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md">
                  {[
                    { id: 'featured', label: 'Popular' },
                    { id: 'rating', label: 'Rating' },
                    { id: 'price_low', label: 'Price ↑' },
                    { id: 'price_high', label: 'Price ↓' }
                  ].map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setFilterSort(s.id)}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                        filterSort === s.id
                          ? 'bg-white text-slate-950 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter Trigger Button with Icon (Core User Request) */}
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(true)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md border text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                  activeFilterCount > 0
                    ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                    : 'bg-white text-slate-800 border-slate-300 hover:border-slate-800 hover:bg-slate-50'
                }`}
              >
                <i className={`fa-solid fa-sliders text-xs ${activeFilterCount > 0 ? 'text-sky-400' : 'text-slate-700'}`} />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-sky-500 text-white text-[10px] font-black flex items-center justify-center leading-none">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Active Filters Summary Strip (Compact, shown only when any filter is active) */}
          {activeFilterCount > 0 && (
            <div className="bg-slate-50 border border-slate-200/90 rounded-md p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mr-1">
                  <i className="fa-solid fa-sliders text-sky-600 text-xs" />
                  <span>Applied:</span>
                </span>

                {/* Deal filter chip */}
                {activeDealFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 bg-black text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-2xs">
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
                  <span className="inline-flex items-center gap-1.5 bg-white text-slate-800 border border-slate-200 text-[11px] font-bold px-2 py-0.5 rounded shadow-2xs">
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
                {aiFilterQuery && aiFilterQuery.trim() && (
                  <span className="inline-flex items-center gap-1.5 bg-white text-slate-800 border border-slate-200 text-[11px] font-bold px-2 py-0.5 rounded shadow-2xs">
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
                  <span className="inline-flex items-center gap-1.5 bg-white text-slate-800 border border-slate-200 text-[11px] font-bold px-2 py-0.5 rounded shadow-2xs">
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
                  <span className="inline-flex items-center gap-1.5 bg-white text-slate-800 border border-slate-200 text-[11px] font-bold px-2 py-0.5 rounded shadow-2xs">
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
                  <span key={loc} className="inline-flex items-center gap-1.5 bg-white text-slate-800 border border-slate-200 text-[11px] font-bold px-2 py-0.5 rounded shadow-2xs">
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
                  <span key={am} className="inline-flex items-center gap-1.5 bg-white text-slate-800 border border-slate-200 text-[11px] font-bold px-2 py-0.5 rounded shadow-2xs">
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

              {/* Clear all button */}
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1"
              >
                <i className="fa-solid fa-rotate-left text-[10px]" />
                <span>Clear all</span>
              </button>
            </div>
          )}

            {/* Hotel Cards Display: Responsive Grid (Big Hotel Brand Style) or Compact List */}
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
              <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6" : "max-w-4xl mx-auto space-y-4"}>
                {sortedHotels.map(hotel => {
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

                  if (viewMode === 'grid') {
                    return (
                      <article
                        key={hotelId}
                        onClick={() => handleHotelClick(hotelId, hotel)}
                        className="bg-white rounded-md border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col group cursor-pointer h-full hover:border-slate-300"
                      >
                        {/* 1. Carousel Header */}
                        <div className="w-full h-52 sm:h-56 relative overflow-hidden bg-slate-100 shrink-0">
                          <HotelCardImageCarousel
                            hotel={hotel}
                            hotelName={hotel.name}
                            aspectRatio="h-52 sm:h-56"
                            overlayTopLeft={isFlashEligible ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-xs text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs border border-white/10">
                                <i className="fa-solid fa-bolt text-amber-400 text-[9px]" />
                                <span>Flash Deal</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/95 backdrop-blur-xs text-slate-900 text-[10px] font-black shadow-xs border border-slate-200/80">
                                <span className="text-amber-500 text-[10px]">★</span>
                                <span>{rating.toFixed(1)}</span>
                                <span className="text-slate-400 font-normal">({reviewsCount})</span>
                              </div>
                            )}
                            overlayTopRight={(
                              <button
                                type="button"
                                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(hotelId);
                                }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center shadow-xs backdrop-blur-xs cursor-pointer transition-all ${
                                  isFavorite ? 'bg-black text-white' : 'bg-white/85 text-slate-700 hover:text-black hover:bg-white'
                                }`}
                              >
                                <i className={`fa-heart text-xs ${isFavorite ? 'fa-solid text-rose-500' : 'fa-regular'}`} />
                              </button>
                            )}
                          />
                        </div>

                        {/* 2. Hotel Details */}
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            {/* City / Locality & Rating */}
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate flex items-center gap-1">
                                <i className="fa-solid fa-location-dot text-[10px] text-slate-400" />
                                <span>{hotel.city || 'Rajasthan'}</span>
                              </span>
                              {isFlashEligible && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-black text-slate-900">
                                  <span className="text-amber-500 text-[10px]">★</span>
                                  <span>{rating.toFixed(1)}</span>
                                </span>
                              )}
                            </div>

                            {/* Hotel Title */}
                            <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1 leading-snug">
                              {hotel.name}
                            </h3>

                            {/* Distance & Locality */}
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {hotel.locality || hotel.address || `${hotel.city}, Rajasthan`} • 400m to center
                            </p>

                            {/* 5+ Adults Capacity Pill & Smart Combo Notification */}
                            {Number(adults) >= 4 && (
                              <div className="mt-2">
                                {Array.isArray(hotel.rooms) && hotel.rooms.some(r => r.isCombo || (r.capacityAdults && r.capacityAdults >= Number(adults))) ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                                    <i className="fa-solid fa-people-group text-[9px]" />
                                    <span>Fits {adults} Adults in 1 Booking</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                    <i className="fa-solid fa-door-open text-[9px] text-amber-600" />
                                    <span>{Math.ceil(Number(adults) / 2)} rooms needed</span>
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Dynamic Verified Amenity & Policy Tags */}
                            <div className="flex flex-wrap items-center gap-1 mt-2.5 pt-2 border-t border-slate-100">
                              {hotel.cancellationPolicy?.badgeText && (
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                  hotel.cancellationPolicy?.refundable !== false
                                    ? 'bg-sky-50 text-sky-800 border border-sky-200/60'
                                    : 'bg-zinc-100 text-zinc-700'
                                }`}>
                                  {hotel.cancellationPolicy.badgeText}
                                </span>
                              )}
                              {Array.isArray(hotel.amenities) && hotel.amenities.slice(0, 3).map((am, idx) => (
                                <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded truncate max-w-[120px]">
                                  {am}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Pricing and Action Footer */}
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1 text-[11px] font-bold text-sky-600 leading-none mb-0.5">
                                <span>{discountPercent}% off</span>
                                <span className="text-slate-400 font-normal line-through text-[10px]">
                                  ₹{originalPrice.toLocaleString('en-IN')}
                                </span>
                              </div>
                              <div className="text-xl font-black text-slate-900 leading-tight">
                                ₹{price.toLocaleString('en-IN')}
                                <span className="text-[10px] font-medium text-slate-500 ml-1">/ night</span>
                              </div>
                              <div className="text-[10px] text-slate-400 leading-none">
                                +₹{taxAmount} taxes &amp; fees
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHotelClick(hotelId, hotel);
                              }}
                              className="px-3.5 py-2 rounded-md bg-slate-900 hover:bg-black active:scale-95 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-all cursor-pointer whitespace-nowrap"
                            >
                              Select Room
                            </button>
                          </div>
                        </div>

                        {/* Flash Deal Bottom Bar */}
                        {isFlashEligible && (
                          <div className="w-full bg-amber-50/80 border-t border-amber-100 px-3 py-1.5 flex items-center justify-between text-[11px] shrink-0">
                            <span className="inline-flex items-center gap-1 font-bold text-amber-900 text-[10px] uppercase tracking-wider">
                              <i className="fa-solid fa-bolt text-amber-500 text-[9px]" /> Flash Deal
                            </span>
                            <span className="text-[10px] font-extrabold text-emerald-700">
                              Save ₹{savingsAmount.toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}
                      </article>
                    );
                  }

                  /* List View: Horizontal layout constrained to max-w-4xl so it is never awkwardly stretched */
                  return (
                    <article
                      key={hotelId}
                      onClick={() => handleHotelClick(hotelId, hotel)}
                      className="w-full bg-white rounded-md border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group cursor-pointer hover:border-slate-300"
                    >
                      <div className="flex flex-col sm:flex-row items-stretch sm:h-[220px]">
                        {/* 1. Left: Image Carousel */}
                        <div className="w-full sm:w-64 md:w-72 h-52 sm:h-full relative overflow-hidden bg-slate-100 shrink-0">
                          <HotelCardImageCarousel
                            hotel={hotel}
                            hotelName={hotel.name}
                            aspectRatio="h-52 sm:h-full"
                            overlayTopLeft={isFlashEligible ? (
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs border border-white/10">
                                <i className="fa-solid fa-bolt text-amber-400 text-[9px]" />
                                <span>Flash Deal</span>
                              </div>
                            ) : null}
                            overlayTopRight={(
                              <button
                                type="button"
                                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(hotelId);
                                }}
                                className={`sm:hidden w-7 h-7 rounded-full flex items-center justify-center shadow-xs backdrop-blur-xs cursor-pointer transition-all ${
                                  isFavorite ? 'bg-black text-white' : 'bg-white/80 text-slate-700 hover:text-black'
                                }`}
                              >
                                <i className={`fa-heart text-xs ${isFavorite ? 'fa-solid text-rose-500' : 'fa-regular'}`} />
                              </button>
                            )}
                          />
                        </div>

                        {/* 2. Middle: Details & Badges */}
                        <div className="p-4 sm:p-4.5 flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="inline-flex items-center gap-1 text-slate-900 text-xs font-black">
                                <span className="text-amber-500 text-[11px]">★</span>
                                <span>{rating.toFixed(1)}</span>
                                <span className="text-slate-400 font-normal text-[11px]">({reviewsCount})</span>
                              </span>
                            </div>

                            <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1 leading-snug">
                              {hotel.name}
                            </h3>

                            <p className="text-xs font-semibold text-slate-600 truncate mt-0.5">
                              {hotel.locality || hotel.address || `${hotel.city}, Rajasthan`}
                            </p>

                            <p className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1">
                              <i className="fa-solid fa-location-dot text-[10px] text-slate-400" />
                              <span>410 m from city center</span>
                            </p>
                          </div>

                          {Number(adults) >= 4 && (
                            <div className="my-1.5">
                              {Array.isArray(hotel.rooms) && hotel.rooms.some(r => r.isCombo || (r.capacityAdults && r.capacityAdults >= Number(adults))) ? (
                                <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded">
                                  <i className="fa-solid fa-people-group text-[9px]" />
                                  <span>Fits {adults} Adults in 1 Booking</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded">
                                  <i className="fa-solid fa-door-open text-[9px] text-amber-600" />
                                  <span>{Math.ceil(Number(adults) / 2)} standard rooms needed</span>
                                </span>
                              )}
                            </div>
                          )}

                          {/* Dynamic Verified Amenity & Policy Tags */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                            {hotel.cancellationPolicy?.badgeText && (
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                hotel.cancellationPolicy?.refundable !== false
                                  ? 'bg-sky-50 text-sky-800 border border-sky-200/60'
                                  : 'bg-zinc-100 text-zinc-700'
                              }`}>
                                {hotel.cancellationPolicy.badgeText}
                              </span>
                            )}
                            {Array.isArray(hotel.amenities) && hotel.amenities.slice(0, 3).map((am, idx) => (
                              <span key={idx} className="hidden md:inline-block bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded truncate max-w-[120px]">
                                {am}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* 3. Right: Pricing & CTA */}
                        <div className="p-4 sm:border-l border-slate-100 flex flex-row sm:flex-col justify-between items-center sm:items-end w-full sm:w-48 md:w-52 shrink-0 bg-slate-50/50 border-t sm:border-t-0 gap-3">
                          <div className="hidden sm:flex justify-end w-full">
                            <button
                              type="button"
                              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(hotelId);
                              }}
                              className={`w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center transition-all cursor-pointer ${
                                isFavorite ? 'bg-black text-white border-black' : 'bg-white text-slate-400 hover:text-black hover:border-slate-400 shadow-2xs'
                              }`}
                            >
                              <i className={`fa-heart text-xs ${isFavorite ? 'fa-solid' : 'fa-regular'}`}></i>
                            </button>
                          </div>

                          <div className="sm:w-full sm:text-right">
                            <div className="flex items-center sm:justify-end gap-1.5 text-xs font-bold text-sky-600">
                              <span>{discountPercent}% off</span>
                              <span className="text-slate-400 font-normal line-through text-[11px]">
                                ₹{originalPrice.toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="text-2xl font-black text-slate-900 tracking-tight leading-tight my-0.5">
                              ₹{price.toLocaleString('en-IN')}
                            </div>
                            <div className="text-[11px] font-medium text-slate-500">
                              +₹{taxAmount} tax &amp; fees
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Per night
                            </div>
                          </div>

                          <div className="shrink-0 sm:w-full sm:mt-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHotelClick(hotelId, hotel);
                              }}
                              className="px-4 py-2 sm:w-full rounded-md bg-slate-900 hover:bg-black active:scale-95 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-all cursor-pointer text-center whitespace-nowrap"
                            >
                              Select Room
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Flash Deal Strip */}
                      {isFlashEligible && (
                        <div className="w-full bg-amber-50/80 border-t border-amber-100/90 px-4 py-2 flex items-center justify-between text-xs shrink-0">
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
                })}
              </div>
            )}

          </main>
        </div>

      {/* =========================================================================
          UNIVERSAL FILTERS DRAWER / MODAL (Mobile Bottom Sheet + Desktop Slide-Over)
          ========================================================================= */}
      {isMobileFiltersOpen && (
        <div 
          className="fixed inset-0 z-[1100] flex flex-col justify-end sm:justify-center sm:items-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsMobileFiltersOpen(false)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-t-none sm:rounded-l-2xl max-h-[90vh] sm:max-h-full h-auto sm:h-full flex flex-col w-full sm:w-[500px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center">
                  <i className="fa-solid fa-sliders text-sm" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">Filters &amp; Preferences</h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {activeFilterCount > 0 ? `${activeFilterCount} active filters applied` : 'Customize your hotel search'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllFilters}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                  >
                    Reset all
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer text-sm font-bold"
                  aria-label="Close filters"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Scrollable Filter Options */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs divide-y divide-slate-100">
              {/* 1. Keyword / Property Search */}
              <div className="space-y-2">
                <label className="font-extrabold text-slate-800 uppercase tracking-wider block text-[11px]">
                  Property Name or Keyword
                </label>
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                  <input
                    type="text"
                    value={aiFilterQuery}
                    onChange={(e) => setAiFilterQuery(e.target.value)}
                    placeholder="Search by hotel name or keyword..."
                    className="w-full pl-8 pr-8 py-2.5 rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:border-sky-500 focus:outline-none text-xs font-medium text-slate-800 transition-all"
                  />
                  {aiFilterQuery && (
                    <button
                      type="button"
                      onClick={() => setAiFilterQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Curated Deals & Offers */}
              <div className="pt-5 space-y-2.5">
                <div className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Special Offers &amp; Deals</span>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Verified</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'all', label: 'All Stays', icon: 'fa-hotel' },
                    { id: 'flash', label: 'Flash Sale (30% Off)', icon: 'fa-bolt text-amber-500' },
                    { id: 'budget', label: 'Budget Stays (< ₹3K)', icon: 'fa-tag text-emerald-500' },
                    { id: 'value', label: 'Super Value (< ₹2K)', icon: 'fa-coins text-sky-500' },
                    { id: 'luxury', label: 'HF Royal / Luxury', icon: 'fa-crown text-purple-500' }
                  ].map(deal => (
                    <button
                      key={deal.id}
                      type="button"
                      onClick={() => setActiveDealFilter(deal.id)}
                      className={`p-2.5 rounded-md border text-left font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        activeDealFilter === deal.id
                          ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-2xs'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <i className={`fa-solid ${deal.icon} text-xs shrink-0`}></i>
                      <span className="truncate">{deal.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Price Per Night */}
              <div className="pt-5 space-y-2.5">
                <div className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">Price per night</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'all', label: 'All Prices' },
                    { id: 'under2k', label: 'Under ₹2,000' },
                    { id: '2k-4k', label: '₹2,000 - ₹4,000' },
                    { id: '4k-8k', label: '₹4,000 - ₹8,000' },
                    { id: 'above8k', label: '₹8,000+' }
                  ].map(tier => (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setSelectedPriceTier(tier.id)}
                      className={`p-2.5 rounded-md border text-left font-bold transition-all cursor-pointer ${
                        selectedPriceTier === tier.id
                          ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-2xs'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Customer Rating */}
              <div className="pt-5 space-y-2.5">
                <div className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">Customer Rating</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: 0, label: 'All Ratings' },
                    { val: 4.5, label: '★ 4.5+ Exceptional' },
                    { val: 4.0, label: '★ 4.0+ Very Good' },
                    { val: 3.5, label: '★ 3.5+ Good' }
                  ].map(r => (
                    <button
                      key={r.val}
                      type="button"
                      onClick={() => setMinRating(r.val)}
                      className={`p-2.5 rounded-md border text-left font-bold transition-all cursor-pointer ${
                        minRating === r.val
                          ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-2xs'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Property Type */}
              <div className="pt-5 space-y-2.5">
                <div className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">Property Type</div>
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-2 rounded-md border font-bold transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-2xs'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Popular Localities */}
              {localityOptions.length > 0 && (
                <div className="pt-5 space-y-2.5">
                  <div className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">Popular Localities</div>
                  <div className="flex flex-wrap gap-1.5">
                    {localityOptions.map(loc => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => handleLocalityToggle(loc)}
                        className={`px-3 py-1.5 rounded-md border font-bold transition-all cursor-pointer ${
                          selectedLocalities.includes(loc)
                            ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-2xs'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. Dynamic Amenities from Real Hotel Data */}
              {dynamicFilterAmenities.length > 0 && (
                <div className="pt-5 space-y-2.5">
                  <div className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">Property Amenities</div>
                  <div className="grid grid-cols-2 gap-2">
                    {dynamicFilterAmenities.map(am => (
                      <button
                        key={am}
                        type="button"
                        onClick={() => handleAmenityToggle(am)}
                        className={`p-2.5 rounded-md border text-left font-bold transition-all cursor-pointer ${
                          selectedAmenities.includes(am)
                            ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-2xs'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {selectedAmenities.includes(am) ? '✓ ' : '+ '}{am}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Apply Action */}
            <div className="p-4 border-t border-slate-100 bg-white sticky bottom-0 z-10 flex items-center gap-3">
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="w-1/3 py-3 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all cursor-pointer text-center"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="w-2/3 py-3 rounded-md bg-slate-900 hover:bg-black text-white font-extrabold text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer text-center"
              >
                Apply &amp; Show {sortedHotels.length} {sortedHotels.length === 1 ? 'Stay' : 'Stays'}
              </button>
            </div>
          </div>
        </div>
      )}

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
