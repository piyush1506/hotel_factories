'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { reviewAPI } from '../services/api';
import { getDefaultDates } from '../utils/helpers';

export default function HotelDetailScreen() {
  const {
    activeHotelId,
    activeHotelData,
    hotels,
    favorites,
    toggleFavorite,
    openBookingSheet,
    switchNav,
    formatPrice,
    searchParams,
    showToast,
    loadHotelDetail,
    isHotelDetailLoading,
    setSelectedDestination,
    setSearchQuery,
    openHotelDetail,
  } = useApp();

  const roomsListRef = useRef(null);
  const reviewsRef = useRef(null);
  const policiesRef = useRef(null);
  const facilitiesRef = useRef(null);
  const locationRef = useRef(null);
  const similarHotelsRef = useRef(null);

  // Selected room count per room ID
  const [roomCounts, setRoomCounts] = useState({});
  const [openRoomDropdownId, setOpenRoomDropdownId] = useState(null);

  // Room slide carousel state
  const [roomSlideIndices, setRoomSlideIndices] = useState({});

  const handlePrevSlide = (roomId, totalImages, e) => {
    e.stopPropagation();
    setRoomSlideIndices((prev) => {
      const cur = prev[roomId] || 0;
      const nextIdx = (cur - 1 + totalImages) % totalImages;
      return { ...prev, [roomId]: nextIdx };
    });
  };

  const handleNextSlide = (roomId, totalImages, e) => {
    e.stopPropagation();
    setRoomSlideIndices((prev) => {
      const cur = prev[roomId] || 0;
      const nextIdx = (cur + 1) % totalImages;
      return { ...prev, [roomId]: nextIdx };
    });
  };

  const handleSelectSlide = (roomId, index, e) => {
    e.stopPropagation();
    setRoomSlideIndices((prev) => ({ ...prev, [roomId]: index }));
  };

  // Close custom room dropdown when clicking outside
  useEffect(() => {
    if (!openRoomDropdownId) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest('[data-room-dropdown]')) {
        setOpenRoomDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [openRoomDropdownId]);

  // Active sub-navigation tab
  const [activeTab, setActiveTab] = useState('Overview');

  // Lightbox modal state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showMapModal, setShowMapModal] = useState(false);
  const [hotelReviews, setHotelReviews] = useState([]);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [isLocationHovered, setIsLocationHovered] = useState(false);
  const [isLocationExpanded, setIsLocationExpanded] = useState(false);
  const [isOverviewModalOpen, setIsOverviewModalOpen] = useState(false);
  const [showRatingTooltip, setShowRatingTooltip] = useState(false);

  // Automatically load detail from backend if needed
  useEffect(() => {
    if (activeHotelId && (!activeHotelData || (activeHotelData.id !== activeHotelId && activeHotelData._id !== activeHotelId))) {
      loadHotelDetail(activeHotelId);
    }
  }, [activeHotelId, activeHotelData, loadHotelDetail]);

  // Resolve hotel data dynamically
  const hotel = useMemo(() => {
    if (activeHotelData && (activeHotelData.id === activeHotelId || activeHotelData._id === activeHotelId || !activeHotelId)) {
      return activeHotelData;
    }
    const found = hotels?.find((h) => h.id === activeHotelId || h._id === activeHotelId);
    if (found) return found;

    return activeHotelData || null;
  }, [activeHotelData, activeHotelId, hotels]);

  const hotelId = hotel?.id || hotel?._id || activeHotelId || '';
  const isFav = hotelId ? favorites?.includes(hotelId) : false;

  // Load verified reviews for this hotel dynamically from backend
  useEffect(() => {
    if (!hotelId) return;
    let cancelled = false;
    reviewAPI
      .getByHotel(hotelId)
      .then((res) => {
        if (!cancelled && res?.reviews) {
          setHotelReviews(res.reviews);
        }
      })
      .catch((err) => {
        console.warn('Could not load hotel reviews:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [hotelId]);

  // Check-in / check-out dates and length of stay
  const defaultDates = useMemo(() => getDefaultDates(), []);
  const checkInDate = searchParams?.checkInDate || defaultDates.checkIn;
  const checkOutDate = searchParams?.checkOutDate || defaultDates.checkOut;
  const adultsCount = Number(searchParams?.adults) || 2;
  const childrenCount = searchParams?.childrenCount !== undefined ? Number(searchParams.childrenCount) : 0;
  const roomsRequested = Number(searchParams?.rooms) || 1;

  const nights = useMemo(() => {
    try {
      const d1 = new Date(checkInDate + 'T00:00:00');
      const d2 = new Date(checkOutDate + 'T00:00:00');
      const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 1;
    } catch {
      return 1;
    }
  }, [checkInDate, checkOutDate]);

  const formatDisplayDate = (dStr) => {
    try {
      const d = new Date(dStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dStr;
    }
  };

  // Build Gallery images dynamically from hotel data
  const galleryImages = useMemo(() => {
    if (!hotel) return [];
    let imagesList = [];
    if (Array.isArray(hotel.images) && hotel.images.length > 0) {
      imagesList = hotel.images.filter(Boolean);
    } else if (hotel.image) {
      imagesList = [hotel.image];
    } else if (hotel.coverImage) {
      imagesList = [hotel.coverImage];
    }

    return imagesList.map((src, idx) => ({
      src,
      caption: idx === 0
        ? `${hotel.name || 'Hotel'} — Main Grounds & Architecture`
        : `${hotel.name || 'Hotel'} — Gallery Photo #${idx + 1}`,
      sub: idx === 0 ? 'FEATURED PROPERTY VIEW' : undefined,
    }));
  }, [hotel]);

  // Derived Score (0 - 10 scale)
  const rawRating = Number(hotel?.rating || 0);
  const scoreOutOf10 = rawRating > 5 ? rawRating.toFixed(1) : (rawRating * 2).toFixed(1);
  const scoreLabel = Number(scoreOutOf10) >= 9.0 ? 'Exceptional' : Number(scoreOutOf10) >= 8.0 ? 'Superb' : Number(scoreOutOf10) > 0 ? 'Very Good' : 'Verified';
  const reviewsCount = Number(hotel?.reviewsCount || 0).toLocaleString();

  // Dynamic Rooms list from backend inventory
  const rooms = useMemo(() => {
    if (!hotel) return [];
    if (Array.isArray(hotel.rooms) && hotel.rooms.length > 0) {
      return hotel.rooms;
    }
    return [];
  }, [hotel]);

  const featuredRoom = useMemo(() => {
    if (rooms && rooms.length > 0) return rooms[0];
    return null;
  }, [rooms]);

  const featuredPrice = Number(featuredRoom?.basePrice || featuredRoom?.price || hotel?.startingPrice || 1299);
  const featuredOriginalPrice = Number(featuredRoom?.originalPrice || Math.round(featuredPrice * 1.35));
  const featuredTaxes = Math.round(featuredPrice * 0.12);

  // Format room sleeps dynamically based on room capacity and user's search
  const formatRoomSleeps = (r) => {
    // If the user specified an explicit adult count in search
    if (searchParams?.adults) {
      const searchedAdults = Number(searchParams.adults);
      const searchedChildren = Number(searchParams.childrenCount || 0);
      const adultText = `${searchedAdults} ${searchedAdults === 1 ? 'Adult' : 'Adults'}`;
      const childText = searchedChildren > 0 ? ` + ${searchedChildren} ${searchedChildren === 1 ? 'Child' : 'Children'}` : '';
      return `${adultText}${childText}`;
    }

    if (r.capacityAdults) {
      const capAdults = r.capacityAdults;
      const adultText = `${capAdults} ${capAdults === 1 ? 'Adult' : 'Adults'}`;
      const childText = r.capacityChildren ? ` + ${r.capacityChildren} ${r.capacityChildren === 1 ? 'Child' : 'Children'}` : '';
      return `${adultText}${childText}`;
    }

    if (r.sleeps) return r.sleeps;
    return '';
  };

  // More hotels & rooms suggestion of the same city
  const similarHotels = useMemo(() => {
    if (!hotels || hotels.length === 0 || !hotel?.city) return [];
    const city = (hotel.city || '').trim().toLowerCase();
    const currentId = hotel.id || hotel._id || activeHotelId;
    
    // Find hotels in the same city
    return hotels.filter((h) => {
      const hId = h.id || h._id;
      if (hId === currentId) return false;
      return city && (h.city || '').trim().toLowerCase() === city;
    }).slice(0, 4);
  }, [hotels, hotel, activeHotelId]);

  // Navigation scroll handlers
  const scrollToRooms = () => {
    roomsListRef.current?.scrollIntoView({ behavior: 'smooth' });
    setActiveTab('Info & Prices');
  };

  const scrollToReviews = () => {
    reviewsRef.current?.scrollIntoView({ behavior: 'smooth' });
    setActiveTab('Guest Reviews');
  };

  const scrollToSimilarHotels = () => {
    similarHotelsRef.current?.scrollIntoView({ behavior: 'smooth' });
    setActiveTab('Similar Stays');
  };

  const scrollToPolicies = () => {
    policiesRef.current?.scrollIntoView({ behavior: 'smooth' });
    setActiveTab('House Rules & Policies');
  };

  const scrollToFacilities = () => {
    facilitiesRef.current?.scrollIntoView({ behavior: 'smooth' });
    setActiveTab('Facilities & Location');
  };

  const scrollToLocation = () => {
    locationRef.current?.scrollIntoView({ behavior: 'smooth' });
    setActiveTab('Facilities & Location');
    setIsLocationExpanded(true);
  };

  // Reserve room handler
  const handleReserveRoom = (room, customImage) => {
    const count = roomCounts[room.id] || 1;
    const roomToBook = {
      ...room,
      roomsCount: count,
      nights,
      checkInDate,
      checkOutDate,
      image: customImage || room.images?.[0] || room.image || galleryImages[0]?.src,
    };
    openBookingSheet(hotel, roomToBook);
  };

  // Amenities list
  const amenitiesList = useMemo(() => {
    if (!hotel) return [];
    if (Array.isArray(hotel.amenities) && hotel.amenities.length > 0) {
      return hotel.amenities;
    }
    return [];
  }, [hotel]);

  // Dynamic context narrative for 2nd paragraph
  const narrativeSecondParagraph = useMemo(() => {
    if (!hotel) return '';
    const cat = (hotel.category || '').toLowerCase();
    const city = hotel.city || 'India';
    if (cat.includes('palace') || cat.includes('heritage')) {
      return `Immerse yourself in authentic royal living with ornate architectural archways, private courtyards, and world-class concierge arrangements across ${city}. Every corridor echoes centuries of distinguished Indian hospitality.`;
    }
    if (cat.includes('beach') || cat.includes('coastal') || cat.includes('resort')) {
      return `Designed for tranquil rejuvenation, guests enjoy panoramic shoreline vistas, sun-drenched private decks, and artisanal coastal culinary experiences right along ${city}'s premier retreat corridors.`;
    }
    if (cat.includes('hill') || cat.includes('mountain')) {
      return `Surrounded by crisp mountain breezes and sweeping panoramic valleys, this haven offers cedar-scented tranquility, fireside dining, and curated nature exploration throughout ${city}.`;
    }
    return `Whether traveling for curated leisure or refined business, ${hotel.name} blends contemporary elegance with thoughtful personal service, spacious designer accommodations, and seamless access to the finest destinations across ${city}.`;
  }, [hotel]);

  // Dynamic Guest Experience breakdown (ratings on 10 scale)
  const guestExperienceRatings = useMemo(() => {
    if (hotelReviews && hotelReviews.length > 0) {
      const cleanSum = hotelReviews.reduce((sum, r) => sum + (Number(r.cleanlinessRating) || 5), 0);
      const servSum = hotelReviews.reduce((sum, r) => sum + (Number(r.serviceRating) || 5), 0);
      const locSum = hotelReviews.reduce((sum, r) => sum + (Number(r.locationRating) || 5), 0);
      const valSum = hotelReviews.reduce((sum, r) => sum + (Number(r.valueRating) || 4.8), 0);
      const len = hotelReviews.length;

      const toTen = (avg5) => Math.min(10, Math.max(7.0, avg5 * 2)).toFixed(1);

      const staff = toTen(servSum / len);
      const clean = toTen(cleanSum / len);
      const comfort = toTen(valSum / len);
      const loc = toTen(locSum / len);

      return [
        { label: 'Staff & Hospitality', score: staff, pct: Math.round(Number(staff) * 10) },
        { label: 'Cleanliness & Hygiene', score: clean, pct: Math.round(Number(clean) * 10) },
        { label: 'Comfort & Rooms', score: comfort, pct: Math.round(Number(comfort) * 10) },
        { label: 'Location & Surroundings', score: loc, pct: Math.round(Number(loc) * 10) },
      ];
    }

    // Derived dynamically from hotel's score
    const base = Number(scoreOutOf10) > 0 ? Number(scoreOutOf10) : 9.6;
    const staff = Math.min(10, Math.max(8.0, base >= 9.8 ? 9.9 : base * 1.01)).toFixed(1);
    const clean = Math.min(10, Math.max(8.0, base >= 9.8 ? 9.8 : base * 1.0)).toFixed(1);
    const comfort = Math.min(10, Math.max(8.0, base >= 9.8 ? 9.7 : base * 0.99)).toFixed(1);
    const loc = Math.min(10, Math.max(8.0, base >= 9.8 ? 9.8 : base * 1.0)).toFixed(1);

    return [
      { label: 'Staff & Hospitality', score: staff, pct: Math.round(Number(staff) * 10) },
      { label: 'Cleanliness & Hygiene', score: clean, pct: Math.round(Number(clean) * 10) },
      { label: 'Comfort & Rooms', score: comfort, pct: Math.round(Number(comfort) * 10) },
      { label: 'Location & Surroundings', score: loc, pct: Math.round(Number(loc) * 10) },
    ];
  }, [hotelReviews, scoreOutOf10]);

  // Dynamic Guest Quote Snippet
  const latestGuestReview = useMemo(() => {
    if (hotelReviews && hotelReviews.length > 0) {
      const top = hotelReviews[0];
      return {
        quote: top.comment || top.title,
        author: top.userName || 'Verified Guest',
        tag: top.stayDate ? `Stayed ${formatDisplayDate(top.stayDate)}` : 'Checked-out recent stay',
      };
    }
    const cat = (hotel?.category || '').toLowerCase();
    const city = hotel?.city || 'India';
    let quote = `Spotless accommodations, courteous staff, and breathtaking views at ${hotel?.name || 'this property'}. Truly an exceptional stay in ${city}.`;
    if (cat.includes('palace') || cat.includes('heritage')) {
      quote = `A royal experience with regal courtyards, exquisite dining, and attentive butler service in ${city}. Unforgettable memories.`;
    } else if (cat.includes('beach') || cat.includes('resort')) {
      quote = `Pristine coastal views, relaxing poolside cabanas, and delicious gourmet breakfast. Perfect holiday in ${city}.`;
    } else if (cat.includes('hill') || cat.includes('mountain')) {
      quote = `Crisp mountain air, spotless rooms, and spectacular morning panoramas. The staff hospitality made our trip truly special.`;
    }
    return {
      quote,
      author: 'Verified Guest',
      tag: 'Checked-out recent stay',
    };
  }, [hotelReviews, hotel]);

  if (!hotel) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-slate-50">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center text-2xl mb-4">
          <i className="fa-solid fa-hotel animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          {isHotelDetailLoading ? 'Loading Hotel Details...' : 'No Hotel Selected'}
        </h2>
        <p className="text-sm text-slate-500 mb-6 max-w-md">
          {isHotelDetailLoading
            ? 'Fetching verified room rates and amenities.'
            : 'Please choose a hotel from the explore or search page to view details.'}
        </p>
        <button
          onClick={() => switchNav('home')}
          className="px-6 py-2.5 rounded-xl bg-black hover:bg-zinc-800 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer"
        >
          Explore Hotels
        </button>
      </div>
    );
  }

  // Helper icon for amenities
  const getAmenityIcon = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('pool') || n.includes('swim')) return 'fa-solid fa-water-ladder';
    if (n.includes('wifi') || n.includes('internet')) return 'fa-solid fa-wifi';
    if (n.includes('spa') || n.includes('wellness') || n.includes('massage')) return 'fa-solid fa-spa';
    if (n.includes('dining') || n.includes('food') || n.includes('restaurant') || n.includes('breakfast')) return 'fa-solid fa-utensils';
    if (n.includes('beach') || n.includes('sea') || n.includes('ocean')) return 'fa-solid fa-umbrella-beach';
    if (n.includes('air') || n.includes('ac')) return 'fa-solid fa-snowflake';
    if (n.includes('parking') || n.includes('valet')) return 'fa-solid fa-square-parking';
    if (n.includes('bar') || n.includes('lounge')) return 'fa-solid fa-martini-glass';
    if (n.includes('gym') || n.includes('fitness')) return 'fa-solid fa-dumbbell';
    return 'fa-solid fa-circle-check';
  };

  const fullAddress = hotel.address || `${hotel.locality || ''}${hotel.locality ? ', ' : ''}${hotel.city || ''}${hotel.state ? `, ${hotel.state}` : ''}, ${hotel.country || 'India'}`;

  // Cheapest room price
  const lowestRoomPrice = Number(rooms[0]?.basePrice || rooms[0]?.price || hotel?.startingPrice || 0);

  return (
    <div className="w-full bg-[#f8fafc] text-slate-900 pb-12">
      
      {/* 1. Breadcrumbs Strip */}
      <div className="border-b border-slate-200/80 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-2.5 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={() => switchNav('home')} className="hover:text-slate-900 cursor-pointer">Home</button>
            <span>/</span>
            <button
              onClick={() => {
                setSelectedDestination(hotel.country || 'India');
                setSearchQuery(hotel.country || 'India');
                switchNav('search');
              }}
              className="hover:text-black cursor-pointer"
            >
              {hotel.country || 'India'} Hotels
            </button>
            <span>/</span>
            <button
              onClick={() => {
                setSelectedDestination(hotel.city || 'Regional');
                setSearchQuery(hotel.city || 'Regional');
                switchNav('search');
              }}
              className="hover:text-black cursor-pointer"
            >
              {hotel.city || 'Regional'} Stays
            </button>
            {hotel.locality && (
              <>
                <span>/</span>
                <span className="text-slate-600">{hotel.locality}</span>
              </>
            )}
            <span>/</span>
            <span className="font-bold text-slate-800 truncate max-w-[240px] sm:max-w-none">{hotel.name}</span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400">
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <i className="fa-solid fa-circle-check text-[10px]" /> Verified Property Partner
            </span>
            <span>·</span>
            <span className="uppercase">ID: {hotelId.slice(0, 12)}</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 pt-5">
        
        {/* 2. Top Header Bar (MakeMyTrip Style) */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px] tracking-wider uppercase">
                {hotel.featured ? 'GENIUS VIP PARTNER' : 'VERIFIED 3-STAR STAY'}
              </span>
              <div className="flex items-center text-amber-400 text-xs">
                {Array.from({ length: hotel.starRating || 3 }).map((_, i) => (
                  <i key={i} className="fa-solid fa-star" />
                ))}
              </div>
              <span className="text-xs font-semibold text-slate-600">
                {hotel.starRating || 3}-Star {hotel.category || 'Hotel'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {hotel.name}
            </h1>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 mt-1 flex-wrap">
              <i className="fa-solid fa-location-dot text-sky-500" />
              <span>{fullAddress}</span>
              <span>—</span>
              <button
                onClick={scrollToLocation}
                className="text-slate-900 font-bold underline hover:text-black cursor-pointer"
              >
                Show on map
              </button>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => toggleFavorite(hotelId)}
              className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                isFav
                  ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <i className={`${isFav ? 'fa-solid text-rose-500' : 'fa-regular'} fa-heart text-sm`} />
              <span>{isFav ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                }
                showToast('Link copied to clipboard!');
              }}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center transition-all cursor-pointer"
              title="Share property link"
            >
              <i className="fa-solid fa-share-nodes text-xs" />
            </button>
          </div>
        </div>

        {/* 3. Hero Two-Column Split: Gallery & Overview on Left, Featured Room & Rating on Right */}
        <section className="mb-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column (8 cols): Photo Gallery + 1-2 line About Property */}
          <div className="lg:col-span-8 flex flex-col">
            {/* Gallery Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 h-[300px] sm:h-[350px] rounded-2xl overflow-hidden bg-slate-900">
              {/* Main Photo (8 cols) */}
              <div
                className="sm:col-span-8 relative group cursor-pointer overflow-hidden h-full"
                onClick={() => { setSelectedImageIndex(0); setIsLightboxOpen(true); }}
              >
                <img
                  src={galleryImages[0]?.src || hotel.images?.[0] || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80'}
                  alt={galleryImages[0]?.caption || hotel.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(true); }}
                  className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-black/80 hover:bg-black text-white text-xs font-bold backdrop-blur-md border border-white/20 shadow-md inline-flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <i className="fa-solid fa-camera text-[11px]" />
                  <span>{galleryImages.length} Property &amp; Guest Photos →</span>
                </button>
              </div>

              {/* 2 Stacked Side Photos (4 cols) */}
              <div className="hidden sm:grid sm:col-span-4 grid-rows-2 gap-2.5 h-full">
                {(galleryImages.slice(1, 3).length > 0 ? galleryImages.slice(1, 3) : [galleryImages[0], galleryImages[0]]).map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group cursor-pointer overflow-hidden rounded-xl bg-slate-800 h-full"
                    onClick={() => { setSelectedImageIndex(idx + 1); setIsLightboxOpen(true); }}
                  >
                    <img
                      src={img?.src || galleryImages[0]?.src}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                  </div>
                ))}
              </div>
            </div>

            {/* About Property (1-2 lines with "More..." sub-screen trigger) */}
            <div className="mt-3.5 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <i className="fa-solid fa-circle-info text-[#006ce4] text-xs" />
                  <span>About Property</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsOverviewModalOpen(true)}
                  className="text-xs font-bold text-[#006ce4] hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <span>View All Details</span>
                  <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" />
                </button>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
                {hotel.description || `Welcome to ${hotel.name}, situated in the heart of ${hotel.city || 'India'}. Offering clean and comfortable rooms with air conditioning, television, attached bathroom, and 24/7 hospitality.`}
                {' '}
                <button
                  type="button"
                  onClick={() => setIsOverviewModalOpen(true)}
                  className="font-bold text-[#006ce4] hover:underline cursor-pointer"
                >
                  More...
                </button>
              </p>
            </div>
          </div>

          {/* Right Column (4 cols): Featured Room Card + Rating Box */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            {/* Primary / Featured Room Booking Card */}
            <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-snug">
                      {featuredRoom?.name || 'Deluxe AC Room'}
                    </h3>
                    <span className="text-xs text-slate-500 font-semibold block mt-0.5">
                      Fits {featuredRoom?.capacityAdults || 2} Adults{featuredRoom?.capacityChildren ? `, ${featuredRoom.capacityChildren} Child` : ''}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-100 shrink-0">
                    RECOMMENDED
                  </span>
                </div>

                {/* Policies & Perks */}
                <div className="mt-3.5 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <i className="fa-regular fa-clock text-slate-400 text-xs shrink-0" />
                    <span>Check-in: 12:00 PM • 24/7 Front Desk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className={`${hotel?.cancellationPolicy?.refundable ? 'fa-solid fa-circle-check text-emerald-600' : 'fa-solid fa-ban text-amber-600'} text-xs shrink-0`} />
                    <span className={hotel?.cancellationPolicy?.refundable ? 'text-emerald-700 font-semibold' : 'text-amber-800 font-semibold'}>
                      {hotel?.cancellationPolicy?.badgeText || (hotel?.cancellationPolicy?.refundable ? 'Refundable terms apply' : 'Non-Refundable')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price & Primary Booking Button */}
              <div className="mt-4 pt-3.5 border-t border-slate-100">
                <div className="flex items-baseline gap-2">
                  {featuredOriginalPrice > featuredPrice && (
                    <del className="text-xs text-slate-400 font-semibold">
                      {formatPrice(featuredOriginalPrice)}
                    </del>
                  )}
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Per Night:</span>
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {formatPrice(featuredPrice)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    + {formatPrice(featuredTaxes)} taxes &amp; fees
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleReserveRoom(featuredRoom || { id: 'default', name: 'Deluxe AC Room', basePrice: featuredPrice }, featuredRoom?.image || galleryImages[0]?.src)}
                  className="w-full mt-3.5 py-3 px-4 rounded-xl bg-[#006ce4] hover:bg-[#0057b8] active:scale-[0.98] text-white font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                >
                  <span>BOOK THIS NOW</span>
                  <i className="fa-solid fa-arrow-right text-xs" />
                </button>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    More options available with meals
                  </span>
                  <button
                    type="button"
                    onClick={scrollToRooms}
                    className="px-2.5 py-1 rounded-lg border border-blue-600 text-blue-700 font-bold text-xs hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    VIEW ALL ({rooms.length || 3})
                  </button>
                </div>
              </div>
            </div>

            {/* Compact Rating Box with Interactive Hover / Click Popover */}
            <div
              className="relative p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs group cursor-pointer"
              onMouseEnter={() => setShowRatingTooltip(true)}
              onMouseLeave={() => setShowRatingTooltip(false)}
              onClick={() => setShowRatingTooltip((prev) => !prev)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#003b95] text-white font-black text-base flex items-center justify-center shadow-xs shrink-0">
                    {scoreOutOf10}
                  </div>
                  <div>
                    <strong className="block text-sm font-black text-slate-900 leading-tight">
                      {scoreLabel}
                    </strong>
                    <span className="text-xs text-slate-500">
                      ({reviewsCount} verified ratings)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); scrollToReviews(); }}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  All Reviews →
                </button>
              </div>

              {/* Hover / Click Rating Popover */}
              {showRatingTooltip && (
                <div className="absolute bottom-full left-0 right-0 mb-2 p-4 rounded-2xl bg-slate-900 text-white shadow-2xl z-40 space-y-2.5 animate-fadeIn border border-slate-700">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-300 pb-1.5 border-b border-slate-800 flex justify-between items-center">
                    <span>Verified Guest Experience</span>
                    <span className="text-amber-400 font-black">★ {scoreOutOf10}/10</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Cleanliness &amp; Hygiene</span>
                      <span className="font-bold text-emerald-400">4.8 / 5</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '96%' }} />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Staff &amp; Hospitality</span>
                      <span className="font-bold text-emerald-400">4.6 / 5</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '92%' }} />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Location Convenience</span>
                      <span className="font-bold text-emerald-400">4.7 / 5</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '94%' }} />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Value for Money</span>
                      <span className="font-bold text-emerald-400">4.9 / 5</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '98%' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 4. Sub-Navigation Tabs */}
        <div className="border-b border-slate-200 mb-6 sticky top-0 z-30 bg-[#f8fafc]/95 backdrop-blur-sm pt-2">
          <div className="flex items-center gap-1 sm:gap-6 overflow-x-auto text-xs sm:text-sm font-bold text-slate-600">
            {[
              { id: 'Overview', label: 'Overview', action: () => window.scrollTo({ top: 320, behavior: 'smooth' }) },
              { id: 'Info & Prices', label: 'Info & Prices', action: scrollToRooms },
              { id: 'Facilities & Location', label: 'Facilities & Location', action: scrollToFacilities },
              { id: 'House Rules & Policies', label: 'House Rules & Policies', action: scrollToPolicies },
              { id: 'Similar Stays', label: 'Similar Stays', action: scrollToSimilarHotels },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); tab.action(); }}
                className={`pb-3 border-b-2 whitespace-nowrap px-2 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-[#0ea5e9] text-[#0ea5e9] font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Property Highlights Strip */}
        <section className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div
            onClick={() => showToast(`${hotel?.name || 'Hotel'} is an officially verified partner with inspected hygiene & safety standards.`)}
            className="flex items-center gap-3 p-2 -m-2 rounded-xl hover:bg-slate-50 transition cursor-pointer group"
            title="Click to learn about partner verification"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-sm shrink-0 group-hover:scale-105 transition-transform">
              <i className="fa-solid fa-shield-halved" />
            </div>
            <div className="min-w-0">
              <strong className="block text-slate-900 font-bold truncate">
                {hotel?.isVerified ? 'Verified Partner' : 'Official Stay'}
              </strong>
              <span className="text-slate-500 text-[11px] block truncate">
                {hotel?.verificationStatus === 'APPROVED' ? 'Inspected hygiene & safety' : 'Hotel Factories certified'}
              </span>
            </div>
          </div>

          <div
            onClick={scrollToPolicies}
            className="flex items-center gap-3 p-2 -m-2 rounded-xl hover:bg-slate-50 transition cursor-pointer group"
            title={hotel?.cancellationPolicy?.summary || hotel?.policies?.cancellation || 'Hotel cancellation policy'}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 group-hover:scale-105 transition-transform ${
              hotel?.cancellationPolicy?.refundable
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              <i className={hotel?.cancellationPolicy?.refundable ? 'fa-solid fa-clock-rotate-left' : 'fa-solid fa-ban'} />
            </div>
            <div className="min-w-0">
              <strong className="block text-slate-900 font-bold truncate">
                {hotel?.cancellationPolicy?.refundable
                  ? (hotel?.cancellationPolicy?.badgeText || 'Cancellation Available')
                  : 'Non-refundable'}
              </strong>
              <span className="text-slate-500 text-[11px] block truncate">
                {hotel?.cancellationPolicy?.summary || hotel?.policies?.cancellation || 'Hotel specific policy applies'}
              </span>
            </div>
          </div>

          <div
            onClick={() => setShowReviewsModal(true)}
            className="flex items-center gap-3 p-2 -m-2 rounded-xl hover:bg-slate-50 transition cursor-pointer group"
            title="Click to view verified guest reviews & experience ratings"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center text-sm shrink-0 group-hover:scale-105 transition-transform">
              <i className="fa-solid fa-star" />
            </div>
            <div className="min-w-0">
              <strong className="block text-slate-900 font-bold truncate">
                {scoreOutOf10}/10 Rating
              </strong>
              <span className="text-slate-500 text-[11px] block truncate group-hover:text-amber-700 transition-colors">
                {reviewsCount} verified reviews
              </span>
            </div>
          </div>

          <div
            onClick={scrollToRooms}
            className="flex items-center gap-3 p-2 -m-2 rounded-xl hover:bg-slate-50 transition cursor-pointer group"
            title="Click to jump to room booking"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center text-sm shrink-0 group-hover:scale-105 transition-transform">
              <i className="fa-solid fa-bolt" />
            </div>
            <div className="min-w-0">
              <strong className="block text-slate-900 font-bold truncate">Instant Confirmation</strong>
              <span className="text-slate-500 text-[11px] block truncate">
                {hotel?.rooms?.length ? `${hotel.rooms.length} room types available` : 'Direct hotel vouchers'}
              </span>
            </div>
          </div>
        </section>

        {/* Direct Partner Guarantee Banner */}
        <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center text-sm shrink-0">
              <i className="fa-solid fa-shield-check text-base" />
            </div>
            <div>
              <strong className="block text-xs sm:text-sm font-bold text-zinc-900 leading-tight">
                Direct Partner Guarantee · Best Rate Guaranteed
              </strong>
              <span className="block text-[11px] text-zinc-500 mt-0.5">
                Official verified inventory directly with {hotel.name}. Instant voucher confirmation.
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-white border border-zinc-200 text-zinc-800 font-bold text-[10px] tracking-wider uppercase shrink-0 shadow-2xs">
            Official Partner
          </span>
        </div>

        {/* 7. Dates & Search Modification Strip */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3 mb-6 text-xs">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <i className="fa-regular fa-calendar-days text-slate-500 text-sm" />
              <span className="font-bold text-slate-800">
                {formatDisplayDate(checkInDate)} — {formatDisplayDate(checkOutDate)} ({nights} {nights === 1 ? 'Night' : 'Nights'})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-user-group text-slate-500 text-sm" />
              <span className="font-bold text-slate-800">
                {adultsCount} {adultsCount === 1 ? 'Adult' : 'Adults'}{childrenCount > 0 ? ` · ${childrenCount} ${childrenCount === 1 ? 'Child' : 'Children'}` : ''} · {roomsRequested} {roomsRequested === 1 ? 'Room' : 'Rooms'}
              </span>
            </div>
          </div>
          <button
            onClick={() => switchNav('search')}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Modify Search
          </button>
        </div>

        {/* 8. Available Accommodation Options Table */}
        <section className="mb-10" ref={roomsListRef} id="roomsListSection">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Available Accommodation Options
              </h2>
              <p className="text-xs text-slate-500">
                All room choices include complimentary high-speed WiFi &amp; direct property voucher confirmation.
              </p>
            </div>
            <span className="text-xs font-bold text-sky-600 flex items-center gap-1">
              <i className="fa-solid fa-fire text-xs" /> Instant online confirmation
            </span>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            {/* Table Header Row - Clean Slate / Coral Theme */}
            <div className="hidden lg:grid grid-cols-12 bg-slate-50/90 border-b border-slate-200/90 text-slate-600 text-[11px] font-extrabold uppercase tracking-wider py-3.5 px-6 gap-4">
              <div className="col-span-3">Room Photos</div>
              <div className="col-span-1 text-center">Sleeps</div>
              <div className="col-span-4">Room Type &amp; Details</div>
              <div className="col-span-2 text-right">Price ({nights} {nights === 1 ? 'Night' : 'Nights'})</div>
              <div className="col-span-2 text-center">Select Room</div>
            </div>

            {/* Dynamic Rooms Rows */}
            {rooms.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <i className="fa-solid fa-bed text-3xl text-slate-300 mb-3" />
                <h3 className="font-bold text-base text-slate-800">No rooms listed for this property yet</h3>
                <p className="text-xs text-slate-400 mt-1">Please explore other verified stays or check back soon.</p>
              </div>
            ) : (
              rooms.map((room, idx) => {
                const basePrice = Number(room.basePrice || room.price || hotel.startingPrice || 0);
                const originalPrice = Number(room.originalPrice || Math.round(basePrice * 1.25));
                const multiNightPrice = basePrice * nights;
                const multiNightOriginal = originalPrice * nights;
                const currentRoomCount = roomCounts[room.id] || 1;
                const totalPriceForRoom = multiNightPrice * currentRoomCount;

                // Build full array of room images with fallback to hotel gallery
                const rId = room.id || `room-${idx}`;
                let roomImages = [];
                if (Array.isArray(room.images) && room.images.length > 0) {
                  roomImages = [...room.images];
                } else if (room.image) {
                  roomImages = [room.image];
                }
                if (galleryImages && galleryImages.length > 0) {
                  galleryImages.forEach((g) => {
                    if (g.src && !roomImages.includes(g.src) && roomImages.length < 5) {
                      roomImages.push(g.src);
                    }
                  });
                }
                if (roomImages.length === 0) {
                  roomImages = ['https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80'];
                }
                const activeSlide = (roomSlideIndices[rId] || 0) % roomImages.length;
                const currentImage = roomImages[activeSlide];

              return (
                <div
                  key={room.id || idx}
                  className={`grid grid-cols-1 lg:grid-cols-12 gap-4 p-5 lg:p-6 items-start ${
                    idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                  } border-b border-slate-200 last:border-b-0 last:rounded-b-2xl`}
                >
                  {/* Col 1: Room Photo Carousel (3 cols) */}
                  <div className="lg:col-span-3">
                    {/* Room Image Carousel with Change Slide Buttons */}
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-100 shadow-2xs group/img select-none">
                      <img
                        src={currentImage}
                        alt={`${room.name} - Photo ${activeSlide + 1}`}
                        className="w-full h-full object-cover transition-all duration-300 group-hover/img:scale-105"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/85 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs shadow-xs z-10">
                        {room.badge || (idx === 0 ? 'Best Seller' : 'Spacious Suite')}
                      </span>

                      {/* Image Count Pill Badge */}
                      {roomImages.length > 1 && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold tracking-wider z-10 inline-flex items-center gap-1 shadow-xs">
                          <i className="fa-regular fa-image text-[9px]" />
                          <span>{activeSlide + 1}/{roomImages.length}</span>
                        </span>
                      )}

                      {/* Change Slide Controls */}
                      {roomImages.length > 1 && (
                        <>
                          {/* Previous Slide Button */}
                          <button
                            type="button"
                            onClick={(e) => handlePrevSlide(rId, roomImages.length, e)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-900 hover:text-black flex items-center justify-center text-xs shadow-md backdrop-blur-xs transition-all duration-200 z-10 cursor-pointer active:scale-95 opacity-90 sm:opacity-0 sm:group-hover/img:opacity-100 hover:scale-110"
                            aria-label="Previous room photo"
                            title="Previous photo"
                          >
                            <i className="fa-solid fa-chevron-left text-[11px]" />
                          </button>

                          {/* Next Slide Button */}
                          <button
                            type="button"
                            onClick={(e) => handleNextSlide(rId, roomImages.length, e)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-900 hover:text-black flex items-center justify-center text-xs shadow-md backdrop-blur-xs transition-all duration-200 z-10 cursor-pointer active:scale-95 opacity-90 sm:opacity-0 sm:group-hover/img:opacity-100 hover:scale-110"
                            aria-label="Next room photo"
                            title="Next photo"
                          >
                            <i className="fa-solid fa-chevron-right text-[11px]" />
                          </button>

                          {/* Dot Navigation Indicators */}
                          <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1.5 z-10 pointer-events-auto">
                            {roomImages.map((_, dotIdx) => (
                              <button
                                key={dotIdx}
                                type="button"
                                onClick={(e) => handleSelectSlide(rId, dotIdx, e)}
                                className={`transition-all duration-300 rounded-full cursor-pointer ${
                                  dotIdx === activeSlide
                                    ? 'w-4 h-1.5 bg-white shadow-xs'
                                    : 'w-1.5 h-1.5 bg-white/60 hover:bg-white/90'
                                }`}
                                aria-label={`Jump to photo ${dotIdx + 1}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Col 2: Sleeps (1 col) */}
                  <div className="lg:col-span-1 text-left lg:text-center pt-1 sm:pt-2">
                    <span className="lg:hidden text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      SLEEPS
                    </span>
                    <div className="inline-flex items-center gap-1.5 text-zinc-800 text-xs font-semibold">
                      <i className="fa-solid fa-user-group text-xs text-zinc-400" />
                      <span>{formatRoomSleeps(room)}</span>
                    </div>
                  </div>

                  {/* Col 3: Room Type, Details & Benefits (4 cols) */}
                  <div className="lg:col-span-4 space-y-3 pt-0 sm:pt-1 text-xs">
                    {/* Room Name, Size & Bed Details */}
                    <div>
                      <h3 className="font-bold text-base text-slate-900 leading-snug">
                        {room.name}
                      </h3>
                      <div className="flex items-center gap-2.5 text-xs text-slate-500 mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <i className="fa-solid fa-ruler-combined text-[11px] text-slate-400" />
                          {room.size || '52 m² / 560 sq ft'}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="inline-flex items-center gap-1">
                          <i className="fa-solid fa-bed text-[11px] text-slate-400" />
                          {room.bedType || '1 King Bed'}
                        </span>
                      </div>
                    </div>

                    {/* Included Benefits & Policies List */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-start gap-2">
                        <i className="fa-solid fa-check text-[11px] text-zinc-900 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-semibold text-zinc-900 block leading-tight">
                            {room.freeBreakfast ? 'Breakfast included' : 'Breakfast available at property'}
                          </span>
                          <span className="text-[11px] text-zinc-500 block mt-0.5">Buffet &amp; continental options</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <i className={`text-[11px] mt-0.5 shrink-0 ${
                          hotel?.cancellationPolicy?.refundable ? 'fa-solid fa-clock-rotate-left text-emerald-600' : 'fa-solid fa-ban text-amber-600'
                        }`} />
                        <div>
                          <span className="font-semibold text-zinc-900 block leading-tight">
                            {hotel?.cancellationPolicy?.refundable
                              ? (hotel?.cancellationPolicy?.badgeText || 'Cancellation available')
                              : 'Non-refundable booking'}
                          </span>
                          <span className="text-[11px] text-zinc-500 block mt-0.5">
                            {hotel?.cancellationPolicy?.summary || hotel?.policies?.cancellation || 'Policy determined by hotel'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <i className="fa-solid fa-check text-[11px] text-zinc-900 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-semibold text-zinc-900 block leading-tight">No prepayment needed</span>
                          <span className="text-[11px] text-zinc-500 block mt-0.5">Pay at property during check-in</span>
                        </div>
                      </div>

                      <div className="pt-0.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 text-[10px] font-semibold tracking-tight">
                          <i className="fa-solid fa-tag text-[9px] text-zinc-400" />
                          <span>Direct booking rate</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Col 4: Price (2 cols) */}
                  <div className="lg:col-span-2 text-left lg:text-right pt-2">
                    {multiNightOriginal > multiNightPrice && (
                      <del className="text-xs text-zinc-400 font-medium block">
                        {formatPrice(multiNightOriginal * currentRoomCount)}
                      </del>
                    )}
                    <div className="text-2xl font-black text-zinc-900 leading-tight tracking-tight whitespace-nowrap">
                      {formatPrice(totalPriceForRoom)}
                    </div>
                    <span className="text-[11px] text-zinc-500 block mt-0.5">
                      for {nights} {nights === 1 ? 'night' : 'nights'}
                      {currentRoomCount > 1 ? ` · ${currentRoomCount} rooms` : ''}
                    </span>
                    <span className="text-[10px] text-zinc-400 block mt-0.5">+ Taxes &amp; charges</span>
                    <span className="text-[11px] font-semibold text-zinc-700 block mt-1">
                      {formatPrice(basePrice)} / night
                    </span>
                  </div>

                  {/* Col 5: Select & Reserve (2 cols) */}
                  <div className="lg:col-span-2 pt-2 flex flex-col gap-2.5">
                    <div className="w-full relative" data-room-dropdown="true">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          ROOMS COUNT:
                        </label>
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                          {currentRoomCount} {currentRoomCount === 1 ? 'room' : 'rooms'}
                        </span>
                      </div>

                      {/* Custom Minimalist Trigger Button */}
                      <button
                        type="button"
                        onClick={() => setOpenRoomDropdownId(openRoomDropdownId === room.id ? null : room.id)}
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                          openRoomDropdownId === room.id
                            ? 'border-black ring-2 ring-black/10 bg-zinc-50 text-black shadow-xs'
                            : 'border-zinc-300 hover:border-black bg-white text-slate-800 shadow-2xs'
                        }`}
                        aria-expanded={openRoomDropdownId === room.id}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <i className="fa-solid fa-door-open text-[11px] text-zinc-400" />
                          <span>{currentRoomCount} {currentRoomCount === 1 ? 'Room' : 'Rooms'}</span>
                          <span className="text-[11px] font-medium text-zinc-400">({formatPrice(totalPriceForRoom)})</span>
                        </span>
                        <i
                          className={`fa-solid fa-chevron-down text-[10px] text-zinc-400 transition-transform duration-200 ${
                            openRoomDropdownId === room.id ? 'rotate-180 text-black' : ''
                          }`}
                        />
                      </button>

                      {/* Custom Luxury Dropdown Popover */}
                      {openRoomDropdownId === room.id && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-zinc-200/90 rounded-2xl shadow-xl shadow-black/10 p-1.5 space-y-1 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
                          <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 mb-1 flex items-center justify-between">
                            <span>Quantity</span>
                            <span>Total Stay</span>
                          </div>
                          {[1, 2, 3, 4, 5].map((count) => {
                            const isSelected = currentRoomCount === count;
                            const total = multiNightPrice * count;
                            return (
                              <button
                                key={count}
                                type="button"
                                onClick={() => {
                                  setRoomCounts((prev) => ({ ...prev, [room.id]: count }));
                                  setOpenRoomDropdownId(null);
                                }}
                                className={`w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#0ea5e9] text-white font-bold shadow-xs'
                                    : 'text-zinc-800 hover:bg-zinc-100 font-semibold'
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  {isSelected ? (
                                    <i className="fa-solid fa-check text-[10px] text-white" />
                                  ) : (
                                    <span className="w-2 h-2 rounded-full border border-zinc-300 inline-block" />
                                  )}
                                  <span>{count} {count === 1 ? 'Room' : 'Rooms'}</span>
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    isSelected ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-600'
                                  }`}
                                >
                                  {formatPrice(total)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleReserveRoom(room, currentImage)}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#0ea5e9] hover:bg-[#0284c7] active:scale-[0.98] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>I&#39;ll Reserve</span>
                      <i className="fa-solid fa-chevron-right text-[10px]" />
                    </button>
                    <span className="text-[10px] text-slate-400 text-center block">Instant confirmation in 2 mins</span>
                  </div>

                </div>
              );
            })
          )}

          </div>
        </section>

        {/* 9. Facilities, Amenities & Integrated Location Section */}
        <section
          className="mb-10 bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs"
          ref={facilitiesRef}
          id="facilitiesSection"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                COMFORT &amp; LOCATION INTELLIGENCE
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                Property Facilities &amp; Location
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Everything you need for an exceptional stay at {hotel.name}, with immediate proximity to {hotel.locality || hotel.city || 'key sights'}.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 shadow-2xs">
                {amenitiesList.length}+ Amenities
              </span>
              <span className="px-3 py-1 rounded-full bg-black text-white text-xs font-bold shadow-2xs">
                ★ 9.8 Location
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (8 cols): Property Facilities & Amenities Grid */}
            <div className="lg:col-span-8 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
                {amenitiesList.map((amenity, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-300 hover:bg-white hover:shadow-2xs transition-all group"
                  >
                    <span className="w-7 h-7 rounded-lg bg-white border border-slate-200/70 flex items-center justify-center text-slate-700 group-hover:scale-105 group-hover:text-black transition-transform shrink-0">
                      <i className={`${getAmenityIcon(amenity)} text-xs`} />
                    </span>
                    <span className="font-semibold text-slate-800 truncate">{amenity}</span>
                  </div>
                ))}
              </div>

              {/* Verified Comfort & Connectivity Banner */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-700">
                <span className="flex items-center gap-2 font-semibold">
                  <i className="fa-solid fa-sparkles text-amber-500" />
                  <span>Complimentary fiber WiFi, 24/7 power backup &amp; daily housekeeping</span>
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 hidden sm:inline">
                  Verified Stay
                </span>
              </div>
            </div>

            {/* Right Column (4 cols): Compact Integrated Location & Map Card */}
            <div
              className="lg:col-span-4 rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all group relative"
              ref={locationRef}
              id="locationSection"
              onMouseEnter={() => setIsLocationHovered(true)}
              onMouseLeave={() => setIsLocationHovered(false)}
            >
              {/* Compact Map Satellite Image Header Preview */}
              <div
                className="relative h-28 sm:h-32 bg-slate-900 cursor-pointer overflow-hidden"
                onClick={() => setShowMapModal(true)}
                title="Click to open interactive map"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80')`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/45" />

                {/* Top Locality Badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-slate-900 text-[10px] font-bold shadow-xs">
                  <i className="fa-solid fa-location-dot text-sky-500 text-[9px]" />
                  <span className="truncate max-w-[130px]">{hotel.locality || hotel.city || 'Prime Location'}</span>
                </div>

                {/* Top Location Score Pill */}
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-white text-[9px] font-extrabold border border-white/20">
                  ★ 9.8 Score
                </div>

                {/* Pulsing Hotel Pin */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <span className="relative flex h-7 w-7 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-7 w-7 bg-sky-600 text-white items-center justify-center shadow-md border-2 border-white text-[10px] font-bold">
                      <i className="fa-solid fa-hotel text-[9px]" />
                    </span>
                  </span>
                </div>

                {/* Bottom Overlay Prompt */}
                <div className="absolute bottom-1.5 inset-x-2 flex items-center justify-between text-white text-[10px]">
                  <span className="flex items-center gap-1 font-medium drop-shadow-sm truncate">
                    <i className="fa-solid fa-street-view text-amber-300 text-[10px]" />
                    <span className="truncate">Click to expand map</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-white/90 text-slate-900 font-bold text-[9px] shadow-xs flex items-center gap-1 shrink-0">
                    <i className="fa-solid fa-expand text-[8px]" />
                    <span>Map</span>
                  </span>
                </div>
              </div>

              {/* Location Details Container (Toggled via Hover or Click) */}
              <div className="p-3 bg-slate-50/70 border-t border-slate-100">
                {/* Expand / Collapse Control Header */}
                <button
                  type="button"
                  onClick={() => setIsLocationExpanded((prev) => !prev)}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-800 hover:text-black transition-colors cursor-pointer pb-1.5"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <i className="fa-solid fa-location-crosshairs text-sky-600 text-[11px]" />
                    <span className="truncate">Nearby Landmarks</span>
                  </span>
                  <span className="text-[10px] text-sky-600 font-bold flex items-center gap-1 shrink-0">
                    <span>{isLocationExpanded || isLocationHovered ? 'Hide' : 'Details'}</span>
                    <i
                      className={`fa-solid fa-chevron-down text-[9px] transition-transform duration-200 ${
                        isLocationExpanded || isLocationHovered ? 'rotate-180 text-sky-700' : ''
                      }`}
                    />
                  </span>
                </button>

                {/* Details Body: Shows when hovered OR clicked/expanded */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isLocationExpanded || isLocationHovered
                      ? 'max-h-[350px] opacity-100 pt-0.5'
                      : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="divide-y divide-slate-200/70 text-xs">
                    <div className="flex items-center justify-between py-1.5 text-slate-700">
                      <span className="flex items-center gap-1.5 truncate">
                        <span className="w-5 h-5 rounded bg-white border border-slate-200/80 text-sky-600 flex items-center justify-center text-[9px] shrink-0">
                          <i className="fa-solid fa-water" />
                        </span>
                        <span className="font-semibold text-slate-900 truncate max-w-[130px]">Waterfront Promenade</span>
                      </span>
                      <span className="text-[9px] font-bold text-slate-800 bg-white border border-slate-200 px-1.5 py-0.5 rounded-full shrink-0">
                        200 m (3 min)
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 text-slate-700">
                      <span className="flex items-center gap-1.5 truncate">
                        <span className="w-5 h-5 rounded bg-white border border-slate-200/80 text-amber-600 flex items-center justify-center text-[9px] shrink-0">
                          <i className="fa-solid fa-landmark" />
                        </span>
                        <span className="font-semibold text-slate-900 truncate max-w-[130px]">City Palace Museum</span>
                      </span>
                      <span className="text-[9px] font-semibold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded-full shrink-0">
                        1.2 km (6 min)
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 text-slate-700">
                      <span className="flex items-center gap-1.5 truncate">
                        <span className="w-5 h-5 rounded bg-white border border-slate-200/80 text-purple-600 flex items-center justify-center text-[9px] shrink-0">
                          <i className="fa-solid fa-train" />
                        </span>
                        <span className="font-semibold text-slate-900 truncate max-w-[130px]">Railway Junction</span>
                      </span>
                      <span className="text-[9px] font-semibold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded-full shrink-0">
                        4.2 km (12 min)
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 text-slate-700">
                      <span className="flex items-center gap-1.5 truncate">
                        <span className="w-5 h-5 rounded bg-white border border-slate-200/80 text-sky-600 flex items-center justify-center text-[9px] shrink-0">
                          <i className="fa-solid fa-plane-departure" />
                        </span>
                        <span className="font-semibold text-slate-900 truncate max-w-[130px]">Airport Transit</span>
                      </span>
                      <span className="text-[9px] font-semibold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded-full shrink-0">
                        24 km (35 min)
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 mt-1.5 border-t border-slate-200 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMapModal(true);
                      }}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-black hover:bg-zinc-800 text-white text-[10px] font-bold transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <i className="fa-solid fa-map-location-dot text-[9px] text-sky-400" />
                      <span>Open Map</span>
                    </button>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hotel.name}, ${hotel.city || 'India'}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="py-1.5 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
                    >
                      <i className="fa-solid fa-diamond-turn-right text-[9px] text-slate-500" />
                      <span>Directions</span>
                    </a>
                  </div>
                </div>

                {/* Compact Teaser (shown when collapsed) */}
                {!isLocationExpanded && !isLocationHovered && (
                  <div className="text-[10px] text-slate-500 pt-0.5 flex items-center justify-between">
                    <span className="truncate">200m to Waterfront • 1.2km to Palace</span>
                    <span className="text-sky-600 font-semibold shrink-0 ml-1">Hover/Click →</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 10. House Rules & Essential Policies */}
        <section className="mb-10 bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs" ref={policiesRef} id="policiesSection">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                PROPERTY GUIDELINES
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                House Rules &amp; Essential Policies
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Standard property guidelines and check-in requirements for a smooth stay at {hotel.name || 'this property'}.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/70 shadow-2xs">
              <i className="fa-solid fa-shield-check text-xs text-emerald-600" />
              <span>Verified Hotel Policies</span>
            </div>
          </div>

          <div className="space-y-4 text-xs divide-y divide-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 pt-2">
              <div className="sm:w-48 font-bold text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-arrow-right-to-bracket text-slate-700" />
                <span>Check-in</span>
              </div>
              <div className="flex-1 text-slate-600">
                <strong className="text-slate-900 font-bold block mb-0.5">
                  From {hotel.policies?.checkIn || '2:00 PM (14:00)'}
                </strong>
                <span>Early check-in subject to availability upon request. Valid Government photo ID mandatory at arrival.</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start gap-4 pt-3">
              <div className="sm:w-48 font-bold text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-arrow-right-from-bracket text-slate-700" />
                <span>Check-out</span>
              </div>
              <div className="flex-1 text-slate-600">
                <strong className="text-slate-900 font-bold block mb-0.5">
                  Until {hotel.policies?.checkOut || '11:00 AM (11:00)'}
                </strong>
                <span>Express check-out service available via reception desk.</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start gap-4 pt-3">
              <div className="sm:w-48 font-bold text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-children text-slate-700" />
                <span>Children &amp; Extra Beds</span>
              </div>
              <div className="flex-1 text-slate-600">
                <span>Children of all ages are welcome. Complimentary stay for young children using existing bedding. Extra rollaway beds available on request.</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start gap-4 pt-3">
              <div className="sm:w-48 font-bold text-slate-800 flex items-center gap-2">
                <i className="fa-regular fa-credit-card text-slate-700" />
                <span>Accepted Payments</span>
              </div>
              <div className="flex-1 flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-slate-700 border border-slate-200/70">UPI / QR</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-slate-700 border border-slate-200/70">Visa / Mastercard</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-slate-700 border border-slate-200/70">NetBanking</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-slate-700 border border-slate-200/70">Razorpay Secured</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-slate-700 border border-slate-200/70">Pay at Hotel</span>
              </div>
            </div>
          </div>
        </section>

        {/* 11. More Hotels & Stays in the Same City */}
        {similarHotels.length > 0 && (
          <section className="mb-10" ref={similarHotelsRef} id="similarHotelsSection">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-black flex items-center gap-1.5">
                  ✦ SIMILAR PROPERTIES IN {hotel.city?.toUpperCase() || 'THIS AREA'}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                  More Hotels &amp; Stays in {hotel.city || 'the Area'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Explore other highly rated luxury stays and suites nearby
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (hotel.city) {
                    setSelectedDestination(hotel.city);
                    setSearchQuery(hotel.city);
                  }
                  switchNav('search');
                }}
                className="text-xs sm:text-sm font-bold text-slate-900 hover:text-black hover:underline inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>View all in {hotel.city || 'destination'}</span>
                <i className="fa-solid fa-arrow-right text-[11px]" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {similarHotels.map((h) => {
                const hId = h.id || h._id;
                const isItemFav = favorites?.includes(hId);
                const hRating = Number(h.rating || 4.8);
                const hPrice = Number(h.startingPrice || h.price || 4500);
                const hOriginalPrice = Number(h.originalPrice || Math.round(hPrice * 1.25));

                return (
                  <div
                    key={hId}
                    onClick={() => {
                      if (openHotelDetail) {
                        openHotelDetail(hId, h);
                      }
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                        <img
                          src={h.image || h.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
                          alt={h.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {h.badge && (
                          <div className="absolute top-3 left-3">
                            <span className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-slate-900 font-bold text-[11px] border border-slate-200/90 shadow-xs inline-flex items-center gap-1.5">
                              <i className="fa-solid fa-bolt text-amber-500 text-[10px]" />
                              <span>{h.badge}</span>
                            </span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(hId);
                          }}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 backdrop-blur-md shadow-xs flex items-center justify-center text-slate-600 hover:text-rose-500 hover:bg-white transition-all cursor-pointer"
                          aria-label="Save to wishlist"
                        >
                          <i className={`${isItemFav ? 'fa-solid text-rose-500' : 'fa-regular'} fa-heart text-xs`} />
                        </button>
                      </div>

                      <div className="p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-[15px] sm:text-base text-slate-900 leading-snug line-clamp-2 group-hover:text-black transition-colors">
                            {h.name}
                          </h3>
                          <div className="shrink-0 px-2 py-0.5 rounded-full bg-slate-100 text-slate-900 text-xs font-bold inline-flex items-center gap-1 border border-slate-200/90 shadow-2xs">
                            <span className="text-[10px] text-amber-500">★</span>
                            <span>{hRating.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 truncate">
                          <i className="fa-solid fa-location-dot text-slate-400 text-xs shrink-0" />
                          <span className="truncate">{h.locality || h.city || 'India'}</span>
                        </div>

                        <div className="mt-3.5 space-y-1.5 text-xs text-slate-600">
                          <div className="flex items-center gap-2">
                            <i className="fa-solid fa-snowflake text-cyan-600 text-xs shrink-0" />
                            <span className="text-slate-700 font-medium truncate">
                              {(h.amenities && h.amenities[0]) || 'Air Conditioning'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <i className="fa-solid fa-wifi text-sky-600 text-xs shrink-0" />
                            <span className="text-slate-700 font-medium truncate">
                              {(h.amenities && (h.amenities[1] || h.amenities[2])) || 'Free High-Speed WiFi'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 pt-0">
                      <div className="pt-3 border-t border-slate-100">
                        {hOriginalPrice > hPrice && (
                          <del className="text-xs text-slate-400 block font-medium">
                            {formatPrice ? formatPrice(hOriginalPrice) : `₹${hOriginalPrice}`}
                          </del>
                        )}
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                            {formatPrice ? formatPrice(hPrice) : `₹${hPrice}`}
                          </span>
                          <span className="text-xs text-slate-500 font-normal">/ night</span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          + taxes and charges
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (openHotelDetail) {
                            openHotelDetail(hId, h);
                          }
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="mt-4 w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#0f172a] hover:bg-black active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>View Room</span>
                        <i className="fa-solid fa-arrow-right text-xs" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </div>



      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 sm:p-6"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="flex items-center justify-between text-white text-xs font-bold">
            <span>{hotel.name} — Photo Gallery</span>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white cursor-pointer"
            >
              ✕ Close
            </button>
          </div>

          <div
            className="flex-1 flex items-center justify-center p-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))}
              className="absolute left-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center text-lg cursor-pointer"
            >
              ‹
            </button>
            <img
              src={galleryImages[selectedImageIndex].src}
              alt={galleryImages[selectedImageIndex].caption}
              className="max-h-[75vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
            />
            <button
              onClick={() => setSelectedImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0))}
              className="absolute right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center text-lg cursor-pointer"
            >
              ›
            </button>
          </div>

          <div className="text-center text-white text-xs text-slate-300">
            {galleryImages[selectedImageIndex].caption} ({selectedImageIndex + 1} / {galleryImages.length})
          </div>
        </div>
      )}

      {/* Interactive Map Modal */}
      {showMapModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          onClick={() => setShowMapModal(false)}
        >
          <div
            className="w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center text-sm shrink-0">
                  <i className="fa-solid fa-map-location-dot" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 leading-tight">
                    {hotel.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <i className="fa-solid fa-location-dot text-sky-500 text-[11px]" />
                    <span>{hotel.address || `${hotel.locality || ''}, ${hotel.city || 'India'}`}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hotel.name}, ${hotel.city || 'India'}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-400 text-slate-700 text-xs font-semibold hover:bg-white transition-colors"
                >
                  <i className="fa-solid fa-diamond-turn-right text-slate-700 text-xs" />
                  <span>Open in Google Maps</span>
                </a>
                <button
                  type="button"
                  onClick={() => setShowMapModal(false)}
                  className="w-9 h-9 rounded-xl hover:bg-slate-200/70 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer text-sm font-bold"
                  aria-label="Close map"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body: Embed Map + Side Info */}
            <div className="flex-1 min-h-[380px] sm:min-h-[460px] grid grid-cols-1 lg:grid-cols-12 relative bg-slate-100">
              {/* Live Interactive Map Iframe */}
              <div className="lg:col-span-8 h-full min-h-[320px] relative">
                <iframe
                  title={`Map location of ${hotel.name}`}
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: '360px' }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(`${hotel.name}, ${hotel.locality || ''}, ${hotel.city || 'India'}`)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                />
              </div>

              {/* Side Area Details */}
              <div className="lg:col-span-4 p-5 bg-white border-t lg:border-t-0 lg:border-l border-slate-100 flex flex-col justify-between space-y-4 overflow-y-auto">
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      LOCATION RATING
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-lg bg-black text-white font-black text-sm">
                        9.8
                      </span>
                      <div>
                        <strong className="block text-slate-900 font-bold">Excellent Location</strong>
                        <span className="text-[11px] text-slate-500">Top rated by 98% of recent guests</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      KEY DISTANCES
                    </span>
                    <div className="space-y-1.5 text-slate-600">
                      <div className="flex items-center justify-between">
                        <span>Lakeside Waterfront</span>
                        <strong className="text-slate-900">200 m (3 min walk)</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>City Palace &amp; Museum</span>
                        <strong className="text-slate-900">1.2 km (6 min drive)</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Central Railway Station</span>
                        <strong className="text-slate-900">4.2 km (12 min drive)</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Regional Airport (UDR)</span>
                        <strong className="text-slate-900">24 km (35 min drive)</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      VERIFIED PROPERTY ADDRESS
                    </span>
                    <p className="text-slate-700 leading-relaxed text-[11px]">
                      {hotel.address || `${hotel.locality || 'Waterfront'}, ${hotel.city || 'Udaipur'}, Rajasthan, India`}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${hotel.name}, ${hotel.city || 'India'}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    <i className="fa-solid fa-diamond-turn-right text-sky-400" />
                    <span>Get Turn-by-Turn Navigation</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verified Guest Reviews Modal */}
      {showReviewsModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          onClick={() => setShowReviewsModal(false)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh] text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center text-sm shrink-0">
                  <i className="fa-solid fa-star text-amber-400" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 leading-tight">
                    Verified Guest Reviews
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 truncate max-w-sm sm:max-w-md">
                    {hotel.name} · {hotel.city || 'India'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowReviewsModal(false)}
                className="w-9 h-9 rounded-xl hover:bg-slate-200/80 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer text-sm font-bold"
                aria-label="Close reviews"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
              {/* Overall Ratings Summary Header */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-black text-white flex flex-col items-center justify-center shadow-xs shrink-0">
                    <span className="text-xl font-black leading-none">{scoreOutOf10}</span>
                    <span className="text-[9px] font-bold opacity-80 uppercase mt-0.5">/ 10</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-base font-black text-slate-900">{scoreLabel}</strong>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        100% Verified
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      Aggregated from {reviewsCount} completed guest check-outs
                    </span>
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full inline-block">
                    ★ #1 Recommended in {hotel.city || 'Region'}
                  </span>
                </div>
              </div>

              {/* Sub-Ratings Progress Bars Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl border border-slate-100">
                {guestExperienceRatings.map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-semibold">{item.label}</span>
                      <span className="font-black text-slate-900">{item.score} / 10</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-900 rounded-full" style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Individual Guest Reviews Feed */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Recent Verified Feedback
                </h4>

                {hotelReviews && hotelReviews.length > 0 ? (
                  hotelReviews.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-2xl border border-slate-100 bg-white shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                            {(rev.userName || 'G')[0]}
                          </div>
                          <div>
                            <strong className="text-xs font-bold text-slate-900 block leading-tight">{rev.userName || 'Verified Guest'}</strong>
                            <span className="text-[10px] text-slate-400">
                              {rev.stayDate ? `Stayed ${formatDisplayDate(rev.stayDate)}` : 'Verified Stay'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200/80 text-[11px] font-bold">
                          <span>★</span>
                          <span>{rev.rating || 5}.0</span>
                        </div>
                      </div>
                      {rev.title && <h5 className="text-xs font-bold text-slate-900">{rev.title}</h5>}
                      <p className="text-xs text-slate-700 leading-relaxed italic">
                        &quot;{rev.comment}&quot;
                      </p>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                            A
                          </div>
                          <div>
                            <strong className="text-xs font-bold text-slate-900 block leading-tight">Aarav K.</strong>
                            <span className="text-[10px] text-slate-400">Verified Couple Stay</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200/80 text-[11px] font-bold">
                          <span>★</span>
                          <span>5.0</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed italic">
                        &quot;{latestGuestReview.quote}&quot;
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                            P
                          </div>
                          <div>
                            <strong className="text-xs font-bold text-slate-900 block leading-tight">Priya S.</strong>
                            <span className="text-[10px] text-slate-400">Verified Family Vacation</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200/80 text-[11px] font-bold">
                          <span>★</span>
                          <span>4.9</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed italic">
                        &quot;The direct check-in was seamless, the room had panoramic views, and breakfast was world-class. Would definitely return.&quot;
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-[11px] text-slate-500">
                100% genuine reviews from checked-out guests
              </span>
              <button
                type="button"
                onClick={() => setShowReviewsModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Screen Modal: Property Overview, Dining & Complete Amenities (Matches Image 2) */}
      {isOverviewModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={() => setIsOverviewModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-slate-900 animate-fadeIn border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h3 className="font-black text-xl text-slate-900 leading-tight">
                  About Property &amp; Amenities
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-sm sm:max-w-md">
                  {hotel.name} · {hotel.locality || hotel.city || 'India'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOverviewModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer text-sm font-black"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
              {/* 1. Property Story & Overview */}
              <section className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <i className="fa-solid fa-hotel text-blue-600" />
                  <span>About Property</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {hotel.description || `Welcome to ${hotel.name}, situated in the heart of ${hotel.city || 'India'}. Offering clean and comfortable accommodations with air conditioning, flat-screen television, attached private bathroom, and 24-hour hospitality.`}
                </p>
                {narrativeSecondParagraph && (
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {narrativeSecondParagraph}
                  </p>
                )}
              </section>

              {/* 2. Food & Dining Section (Styled matching Image 2) */}
              <section className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase block">
                      KITCHEN &amp; IN-ROOM SERVICE
                    </span>
                    <h4 className="text-base font-black text-slate-900 mt-0.5">
                      Food and Dining
                    </h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-200">
                    Ghar Ka Khana
                  </span>
                </div>

                <div className="space-y-3.5 text-xs text-slate-700">
                  {/* Meals Offered */}
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                      <i className="fa-solid fa-utensils text-xs text-amber-600" />
                    </span>
                    <div>
                      <strong className="block text-slate-900 font-bold">Meals Offered</strong>
                      <span className="text-slate-600">Breakfast, Lunch and Dinner</span>
                      <div className="flex items-center gap-2.5 mt-1">
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-800 text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" /> Veg
                        </span>
                        <span className="inline-flex items-center gap-1 font-bold text-rose-800 text-[11px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" /> Non Veg
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cuisines */}
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                      <i className="fa-solid fa-bowl-food text-xs text-amber-600" />
                    </span>
                    <div>
                      <strong className="block text-slate-900 font-bold">Cuisines</strong>
                      <span className="text-slate-600">North Indian, Rajasthani, Chinese, Continental &amp; Regional Comfort Food</span>
                    </div>
                  </div>

                  {/* Timings */}
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                      <i className="fa-regular fa-clock text-xs text-amber-600" />
                    </span>
                    <div>
                      <strong className="block text-slate-900 font-bold">Kitchen Timings: 7:30 AM – 11:30 PM</strong>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-[11px] text-slate-500 mt-1">
                        <span>• Breakfast: 7:30 AM – 10:30 AM</span>
                        <span>• Lunch: 11:30 AM – 3:30 PM</span>
                        <span>• Dinner: 7:00 PM – 11:30 PM</span>
                      </div>
                    </div>
                  </div>

                  {/* Cost & Type */}
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                      <i className="fa-solid fa-wallet text-xs text-amber-600" />
                    </span>
                    <div>
                      <strong className="block text-slate-900 font-bold">Average Meal Cost</strong>
                      <span className="text-slate-600">Average meal cost for one is ₹200 – ₹350</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/70 text-[11px] text-slate-500 flex items-center gap-2">
                  <i className="fa-solid fa-circle-check text-emerald-600" />
                  <span>Location serviceable by local food partners &amp; prompt 24/7 room service</span>
                </div>
              </section>

              {/* 3. Property Facilities & Complete Amenities */}
              <section className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <i className="fa-solid fa-list-check text-blue-600" />
                  <span>Property Facilities &amp; Amenities ({amenitiesList.length})</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  {amenitiesList.map((amenity, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-slate-800"
                    >
                      <i className={`${getAmenityIcon(amenity)} text-sky-600 text-xs shrink-0`} />
                      <span className="font-semibold truncate">{amenity}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* 4. House Rules & Check-in Details */}
              <section className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <i className="fa-solid fa-shield-halved text-emerald-600" />
                  <span>House Rules &amp; Check-in</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                  <div><strong>Check-in Time:</strong> 12:00 PM onwards</div>
                  <div><strong>Check-out Time:</strong> Until 11:00 AM</div>
                  <div><strong>Cancellation Policy:</strong> {hotel?.cancellationPolicy?.summary || 'Hotel terms apply'}</div>
                  <div><strong>Guest ID:</strong> Valid Govt Photo ID required at check-in</div>
                </div>
              </section>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                Inspected verified property partner
              </span>
              <button
                type="button"
                onClick={() => setIsOverviewModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
