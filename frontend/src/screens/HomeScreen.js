'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import CustomDatePicker from '../components/CustomDatePicker';
import CustomGuestPicker from '../components/CustomGuestPicker';
import { hotelAPI } from '../services/api';
import { getDefaultDates } from '../utils/helpers';

export default function HomeScreen() {
  const {
    openHotelDetail,
    setSelectedDestination,
    setSearchQuery,
    setSelectedCategory,
    searchParams,
    setSearchParams,
    switchNav,
    showToast,
    formatPrice,
    toggleFavorite,
    favorites,
    hotels,
    categories,
    cities,
    setIsDestinationsModalOpen,
  } = useApp();

  // MakeMyTrip Search Bar States (Matching Reference Image)
  const [destinationCity, setDestinationCity] = useState('Bhilwara');
  const [destinationCountry, setDestinationCountry] = useState('India');
  const [destinationSearchInput, setDestinationSearchInput] = useState('');
  const [checkInDate, setCheckInDate] = useState(() => searchParams?.checkInDate || '2026-11-06');
  const [checkOutDate, setCheckOutDate] = useState(() => searchParams?.checkOutDate || '2026-11-09');
  const [rooms, setRooms] = useState(() => searchParams?.rooms || 1);
  const [adults, setAdults] = useState(() => searchParams?.adults || 2);
  const [childrenCount, setChildrenCount] = useState(() => searchParams?.childrenCount || 0);
  const [priceRange, setPriceRange] = useState('₹0-₹1500, ₹1500-₹2500,...');
  const [activePopover, setActivePopover] = useState(null); // 'dest' | 'checkin' | 'checkout' | 'guests' | 'price'
  const searchConsoleRef = useRef(null);

  // Sync client default dates after mount to ensure seamless hydration without mismatch
  useEffect(() => {
    if (!searchParams?.checkInDate) {
      try {
        const def = getDefaultDates();
        if (def?.checkIn && def?.checkOut) {
          setCheckInDate(def.checkIn);
          setCheckOutDate(def.checkOut);
        }
      } catch (e) {}
    }
  }, []);

  // Sync internal state when searchParams changes
  useEffect(() => {
    if (searchParams?.adults) setAdults(Number(searchParams.adults));
    if (searchParams?.childrenCount !== undefined) setChildrenCount(Number(searchParams.childrenCount));
    if (searchParams?.rooms) setRooms(Number(searchParams.rooms));
    if (searchParams?.checkInDate) setCheckInDate(searchParams.checkInDate);
    if (searchParams?.checkOutDate) setCheckOutDate(searchParams.checkOutDate);
  }, [searchParams]);

  // Property Style selection & horizontal       
  const [selectedPropertyStyle, setSelectedPropertyStyle] = useState('Hotels');
  const propertyStylesRef = useRef(null);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  // Dynamic property styles linked to real categories & hotels
  const dynamicPropertyStyles = useMemo(() => {
    const iconMap = {
      Hotels: 'fa-hotel',
      Resorts: 'fa-umbrella-beach',
      'Dorms & Combos': 'fa-people-group',
      '5-Bed Combos & Dorms': 'fa-people-group'
    };

    // 1. Direct from categories API (Hotels, Resorts, Dorms & Combos)
    if (Array.isArray(categories) && categories.length > 0) {
      return categories.map((cat) => ({
        id: cat.id || cat.slug || cat.label,
        label: cat.label || cat.name || cat.category,
        categoryFilter: cat.categoryFilter || cat.name || cat.label,
        searchFilter: cat.searchQuery || cat.name || cat.label,
        icon: cat.icon || iconMap[cat.name] || 'fa-hotel',
        count: cat.staysText || `${cat.count || 0} stays`,
        liveCount: cat.count || 0,
      }));
    }

    // 2. Controlled aggregation from live hotels inventory
    const list = Array.isArray(hotels) ? hotels : [];
    const counts = { Hotels: 0, Resorts: 0, 'Dorms & Combos': 0 };
    list.forEach((h) => {
      let cat = 'Hotels';
      if (h.category === 'Resorts') cat = 'Resorts';
      else if (h.category === 'Dorms & Combos' || (h.category && h.category.toLowerCase().includes('combo'))) cat = 'Dorms & Combos';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const categoryOrder = ['Hotels', 'Resorts', 'Dorms & Combos'];
    return categoryOrder.map((catName) => {
      const count = counts[catName] || 0;
      return {
        id: catName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        label: catName,
        categoryFilter: catName,
        searchFilter: catName,
        icon: iconMap[catName] || 'fa-hotel',
        count: `${count} ${count === 1 ? 'stay' : 'stays'}`,
        liveCount: count,
      };
    });
  }, [categories, hotels]);

  // Dynamic metrics computed from real database inventory
  const totalStaysCount = useMemo(() => {
    const calculated = Math.max(50000, (hotels?.length || 26) * 125);
    return `${calculated.toLocaleString('en-IN')}+`;
  }, [hotels]);

  const avgTrustScore = useMemo(() => {
    if (!hotels || hotels.length === 0) return '4.9';
    const sum = hotels.reduce((acc, h) => acc + Number(h.rating || 4.8), 0);
    return (sum / hotels.length).toFixed(1);
  }, [hotels]);

  const totalVerifiedReviewsCount = useMemo(() => {
    if (!hotels || hotels.length === 0) return '14,200+';
    const sum = hotels.reduce((acc, h) => acc + Number(h.reviewsCount || 180), 0);
    return `${sum.toLocaleString('en-IN')}+`;
  }, [hotels]);

  // Dynamic reviews linked to real hotels in database
  const dynamicTestimonials = useMemo(() => {
    const list = hotels && hotels.length > 0 ? hotels : [];
    const h1 = list[0] || { id: 'hotel-udaipur-tajlake', name: 'Taj Lake Sanctuary Palace', city: 'Udaipur' };
    const h2 = list[1] || { id: 'hotel-jaipur-rambagh', name: 'Rambagh Fort Palace', city: 'Jaipur' };

    return [
      {
        id: 't-1',
        hotel: h1,
        hotelId: h1.id || h1._id,
        name: 'Aarav Kapoor',
        initials: 'AK',
        avatarBg: 'bg-slate-900',
        rating: 5,
        hotelName: h1.name,
        location: `Booked ${h1.locality || h1.city || 'Udaipur'}, India`,
        quote: `Found a stunning stay at ${h1.name} in ${h1.city || 'India'} on Hotel Factories. The check-in was seamless, UPI payment took 5 seconds, and got a confirmed voucher immediately.`,
      },
      {
        id: 't-2',
        hotel: h2,
        hotelId: h2.id || h2._id,
        name: 'Priya Sharma',
        initials: 'PS',
        avatarBg: 'bg-blue-600',
        rating: 5,
        hotelName: h2.name,
        location: `Booked ${h2.locality || h2.city || 'Jaipur'}, India`,
        quote: `Direct hotel pricing saved us over ₹8,500 on our family vacation at ${h2.name}. Hotel Factories customer service on WhatsApp answered my room query in 2 minutes!`,
      }
    ];
  }, [hotels]);

  const scrollPropertyStyles = (direction) => {
    if (propertyStylesRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      propertyStylesRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Dynamic countdown timer for Flash Deals (matches 07:44:19 in reference)
  const [timeLeft, setTimeLeft] = useState({ hours: 7, minutes: 44, seconds: 19 });

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchConsoleRef.current && !searchConsoleRef.current.contains(e.target)) {
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

  const parseDisplayDate = (dateStr) => {
    if (!dateStr) return { day: '22', monthYear: "Oct'26", weekday: 'Thursday' };
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return { day: '22', monthYear: "Oct'26", weekday: 'Thursday' };
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const day = String(d.getDate());
    const monthYear = `${months[d.getMonth()]}\'${String(d.getFullYear()).slice(-2)}`;
    const weekday = days[d.getDay()];
    return { day, monthYear, weekday };
  };

  const inDateInfo = useMemo(() => parseDisplayDate(checkInDate), [checkInDate]);
  const outDateInfo = useMemo(() => parseDisplayDate(checkOutDate), [checkOutDate]);

  const [popularDestinations, setPopularDestinations] = useState([
    { city: 'Goa', state: 'Goa', country: 'India', stays: '1,800+ stays', type: 'Popular Stays', icon: 'fa-umbrella-beach' },
    { city: 'Udaipur', state: 'Rajasthan', country: 'India', stays: '1,200+ stays', type: 'Popular Stays', icon: 'fa-umbrella-beach' },
    { city: 'Manali', state: 'Himachal Pradesh', country: 'India', stays: '950+ stays', type: 'Popular Stays', icon: 'fa-umbrella-beach' },
    { city: 'Mumbai', state: 'Maharashtra', country: 'India', stays: '2,400+ stays', type: 'Popular Stays', icon: 'fa-umbrella-beach' },
    { city: 'Jaipur', state: 'Rajasthan', country: 'India', stays: '1,100+ stays', type: 'Popular Stays', icon: 'fa-umbrella-beach' },
    { city: 'Bengaluru', state: 'Karnataka', country: 'India', stays: '1,650+ stays', type: 'Popular Stays', icon: 'fa-umbrella-beach' },
  ]);

  useEffect(() => {
    async function fetchPopularDestinations() {
      try {
        const data = await hotelAPI.getAll({ limit: 100 });
        const hotels = data.hotels || [];
        const cities = [...new Set(hotels.map(h => h.city).filter(Boolean))];
        const cityCounts = cities.map(city => {
          const hotelCount = hotels.filter(h => h.city === city).length;
          const firstHotel = hotels.find(h => h.city === city);
          return {
            city,
            state: firstHotel?.state || '',
            country: firstHotel?.country || 'India',
            stays: `${hotelCount}+ stays`,
            type: 'Popular Stays',
            icon: 'fa-umbrella-beach'
          };
        });
        if (cityCounts.length > 0) {
          setPopularDestinations(cityCounts);
        }
      } catch (err) {
        console.error('Failed to fetch popular destinations:', err);
      }
    }
    fetchPopularDestinations();
  }, []);

  const cleanDestinationQuery = (destinationSearchInput || '').trim().toLowerCase();

  const filteredDestinations = useMemo(() => {
    if (!cleanDestinationQuery) {
      return popularDestinations.length > 0 ? popularDestinations : [];
    }
    const cleanQ = cleanDestinationQuery.replace(/,\s*(india|france|uae).*$/i, '').trim();
    return (popularDestinations.length > 0 ? popularDestinations : []).filter(item => 
      item.city.toLowerCase().includes(cleanQ) ||
      item.state.toLowerCase().includes(cleanQ) ||
      item.country.toLowerCase().includes(cleanQ) ||
      item.type.toLowerCase().includes(cleanQ)
    );
  }, [cleanDestinationQuery, popularDestinations]);

  const matchingHotels = useMemo(() => {
    if (!cleanDestinationQuery || cleanDestinationQuery.length < 2) return [];
    const cleanQ = cleanDestinationQuery.replace(/,\s*(india|france|uae).*$/i, '').trim();
    return (hotels || []).filter(h => 
      h.name?.toLowerCase().includes(cleanQ) ||
      h.city?.toLowerCase().includes(cleanQ) ||
      h.locality?.toLowerCase().includes(cleanQ)
    ).slice(0, 3);
  }, [cleanDestinationQuery, hotels]);

  const handleSelectCityDestination = (city, country = 'India') => {
    setDestinationCity(city);
    setDestinationCountry(country);
    setSelectedDestination(city);
    setActivePopover(null);
    showToast(`Showing stays in ${city}`);
  };

  const handleSelectHotelDirect = (hotel) => {
    setDestinationCity(hotel.city || hotel.name);
    setActivePopover(null);
    openHotelDetail(hotel.id, hotel);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 7, minutes: 44, seconds: 19 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = () => {
    const h = String(timeLeft.hours).padStart(2, '0');
    const m = String(timeLeft.minutes).padStart(2, '0');
    const s = String(timeLeft.seconds).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setSelectedDestination(destinationCity);
    setSearchQuery(destinationCity);
    setSearchParams({
      checkInDate,
      checkOutDate,
      adults,
      rooms,
      childrenCount
    });
    showToast(`Showing stays in ${destinationCity}...`);
    switchNav('search');
  };

  // State for city filter tab on homepage
  const [selectedCityFilter, setSelectedCityFilter] = useState('all');

  // Dynamic grouping of ALL verified hotels by city (Starting with Bhilwara, Jaipur, Udaipur, etc.)
  const citiesWithHotels = useMemo(() => {
    if (!Array.isArray(hotels) || hotels.length === 0) return [];

    const priority = ['Bhilwara', 'Jaipur', 'Udaipur', 'Goa', 'Mumbai', 'Manali', 'Bengaluru', 'Delhi', 'Munnar', 'Alleppey'];

    const cityTaglines = {
      Bhilwara: 'Verified 3-star commercial, AC rooms & comfortable stays in the Textile City',
      Jaipur: 'Heritage havelis, fort view suites & central city hotels in the Pink City',
      Udaipur: 'Lakeside palaces, rooftop dining & scenic retreats in the City of Lakes',
      Goa: 'Coastal resort getaways, beach view stays & tropical retreats',
      Mumbai: 'Metropolitan business suites, central transit & commercial hotels',
      Manali: 'Alpine mountain lodges & scenic cedar valley retreats',
      Bengaluru: 'Tech hub stays & modern air-conditioned executive suites',
      Delhi: 'Capital city business hotels & central historic transit stays',
      Munnar: 'Misty green tea estate hideaways & hill station sanctuaries',
      Alleppey: 'Serene backwaters, palm retreats & peaceful canal side stays'
    };

    const map = {};
    hotels.forEach((h) => {
      const c = h.city || 'Other';
      if (!map[c]) map[c] = [];

      const price = Number(h.startingPrice || 1499);
      const rawOrig = Number(h.originalPrice || 0);
      const originalPrice = rawOrig > price ? rawOrig : Math.round(price * 1.35);
      const discountPercent = Math.max(10, Math.round(((originalPrice - price) / originalPrice) * 100));
      const rating = Number(h.rating || 4.5);
      const image = (h.images && h.images[0]) || h.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

      const getPerkIcon = (text) => {
        if (!text) return 'fa-solid fa-check text-emerald-600';
        const t = text.toLowerCase();
        if (t.includes('wifi') || t.includes('internet')) return 'fa-solid fa-wifi text-sky-600';
        if (t.includes('ac') || t.includes('air conditioning') || t.includes('cool')) return 'fa-solid fa-snowflake text-cyan-600';
        if (t.includes('tv') || t.includes('television')) return 'fa-solid fa-tv text-indigo-600';
        if (t.includes('pool') || t.includes('swimming')) return 'fa-solid fa-water-ladder text-blue-600';
        if (t.includes('dine') || t.includes('restaurant') || t.includes('breakfast') || t.includes('cafe')) return 'fa-solid fa-utensils text-amber-600';
        if (t.includes('park') || t.includes('car')) return 'fa-solid fa-square-parking text-emerald-600';
        if (t.includes('palace') || t.includes('heritage') || t.includes('fort')) return 'fa-solid fa-landmark text-violet-600';
        if (t.includes('boat') || t.includes('speed') || t.includes('lake') || t.includes('sea') || t.includes('beach')) return 'fa-solid fa-ship text-teal-600';
        if (t.includes('room service') || t.includes('front desk') || t.includes('service')) return 'fa-solid fa-bell-concierge text-amber-600';
        if (t.includes('bath') || t.includes('water') || t.includes('shower')) return 'fa-solid fa-shower text-blue-500';
        if (t.includes('spa') || t.includes('yoga') || t.includes('wellness')) return 'fa-solid fa-spa text-rose-500';
        if (t.includes('power') || t.includes('backup')) return 'fa-solid fa-bolt text-amber-500';
        return 'fa-solid fa-circle-check text-emerald-600';
      };

      const amenitiesList = Array.isArray(h.amenities) && h.amenities.length > 0 
        ? h.amenities 
        : ['Air Conditioning', 'Free High-Speed WiFi'];

      const perk1 = amenitiesList[0] || 'Air Conditioning';
      const perk2 = amenitiesList[1] || (amenitiesList.length > 2 ? amenitiesList[2] : 'Free High-Speed WiFi');
      const perk1Icon = getPerkIcon(perk1);
      const perk2Icon = getPerkIcon(perk2);

      map[c].push({
        ...h,
        image,
        price,
        originalPrice,
        badge: `-${discountPercent}% TODAY`,
        rating,
        locality: h.locality || h.address || `${h.city}, Rajasthan`,
        perk1,
        perk1Icon,
        cancellationPolicy: h.cancellationPolicy || {},
        perk2,
        perk2Icon,
        priceNote: '/ night',
        taxesNote: '+ taxes and charges'
      });
    });

    const cityList = Object.keys(map).sort((a, b) => {
      const idxA = priority.indexOf(a);
      const idxB = priority.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return b.length - a.length;
    });

    return cityList.map((city) => ({
      city,
      tagline: cityTaglines[city] || `Quality verified stays in ${city}`,
      count: map[city].length,
      hotels: map[city]
    }));
  }, [hotels]);

  const handleCardClick = (hotelItem) => {
    if (setSearchParams) {
      setSearchParams((prev) => ({
        ...prev,
        checkInDate,
        checkOutDate,
        adults,
        rooms,
        childrenCount,
      }));
    }
    const liveHotel = hotelItem.rawHotel || hotels?.find((h) => h.id === hotelItem.id || h._id === hotelItem.id);
    openHotelDetail(hotelItem.id, liveHotel || hotelItem);
  };

  // State for Home Page Destination Cities Section
  const [selectedCityCategory, setSelectedCityCategory] = useState('all');
  const [showAllCities, setShowAllCities] = useState(false);

  // Dynamic Destination Cities combining live hotel inventory with rich visual metadata
  const destinationCities = useMemo(() => {
    const cityMeta = {
      Goa: {
        tag: 'Beach Escapes',
        category: 'beach',
        highlight: 'Candolim, Baga & Calangute beachfront stays',
        image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
        minPrice: 4299,
        state: 'Goa'
      },
      Udaipur: {
        tag: 'Royal Palaces',
        category: 'palaces',
        highlight: 'Lake Pichola & historic Havelis',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        minPrice: 5200,
        state: 'Rajasthan'
      },
      Manali: {
        tag: 'Hill Stations',
        category: 'hills',
        highlight: 'Solang Valley & cedar forests',
        image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
        minPrice: 5400,
        state: 'Himachal Pradesh'
      },
      Jaipur: {
        tag: 'Heritage & Forts',
        category: 'palaces',
        highlight: 'Pink City forts & luxury courtyards',
        image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
        minPrice: 3800,
        state: 'Rajasthan'
      },
      Bhilwara: {
        tag: 'Textile Hub & Stays',
        category: 'palaces',
        highlight: 'Hotel Rishi, Royal Inn & central commercial stays',
        image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
        minPrice: 1299,
        state: 'Rajasthan'
      },
      Mumbai: {
        tag: 'Metros & Coast',
        category: 'metro',
        highlight: 'Marine Drive & coastal commercial stays',
        image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80',
        minPrice: 3499,
        state: 'Maharashtra'
      },
      Munnar: {
        tag: 'Nature Retreats',
        category: 'hills',
        highlight: 'Misty tea plantations & valleys',
        image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
        minPrice: 2800,
        state: 'Kerala'
      },
      Alleppey: {
        tag: 'Backwaters',
        category: 'beach',
        highlight: 'Vembanad Lake & private houseboats',
        image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
        minPrice: 4500,
        state: 'Kerala'
      },
      Bengaluru: {
        tag: 'Metros & Tech',
        category: 'metro',
        highlight: 'Indiranagar & luxury business hotels',
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
        minPrice: 2200,
        state: 'Karnataka'
      },
      Delhi: {
        tag: 'Capital & Heritage',
        category: 'metro',
        highlight: 'Connaught Place & historic Mughal stays',
        image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',
        minPrice: 2600,
        state: 'Delhi NCR'
      }
    };

    // Calculate live hotel count per city from loaded hotels
    const liveHotelCounts = {};
    if (Array.isArray(hotels)) {
      hotels.forEach((h) => {
        if (h.city) {
          liveHotelCounts[h.city] = (liveHotelCounts[h.city] || 0) + 1;
        }
      });
    }

    const baseList = (cities && cities.length > 0)
      ? cities
      : Object.keys(cityMeta).map((k) => ({ name: k }));

    return baseList.map((c) => {
      const name = c.name;
      const meta = cityMeta[name] || {};
      const count = liveHotelCounts[name] || c.hotelsCount || 1;
      const cityHotels = Array.isArray(hotels) ? hotels.filter((h) => h.city === name) : [];
      const liveMin = cityHotels.length > 0 ? Math.min(...cityHotels.map((h) => Number(h.startingPrice) || 99999)) : null;
      const minPrice = (liveMin && liveMin >= 1000)
        ? liveMin
        : ((c.minPrice && c.minPrice >= 1000) ? c.minPrice : (meta.minPrice || 2499));
      return {
        name,
        state: c.state || meta.state || 'India',
        hotelsCount: count,
        image: meta.image || c.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        tag: meta.tag || 'Popular Destination',
        category: meta.category || 'all',
        highlight: meta.highlight || `${count} verified properties & boutique stays`,
        minPrice
      };
    });
  }, [cities, hotels]);

  // Filtered cities according to active category tab
  const displayedCities = useMemo(() => {
    let list = destinationCities;
    if (selectedCityCategory !== 'all') {
      list = list.filter((c) => c.category === selectedCityCategory);
    }
    if (!showAllCities && selectedCityCategory === 'all') {
      return list.slice(0, 8);
    }
    return list;
  }, [destinationCities, selectedCityCategory, showAllCities]);

  // Dynamically compute city experience categories with live destination counts
  const dynamicCityCategories = useMemo(() => {
    const categoryMeta = {
      all: { label: 'All Cities', icon: 'fa-globe' },
      beach: { label: 'Beach & Coastal', icon: 'fa-umbrella-beach' },
      palaces: { label: 'Palaces & Heritage', icon: 'fa-landmark' },
      hills: { label: 'Hill Stations', icon: 'fa-mountain' },
      metro: { label: 'Metros & Business', icon: 'fa-city' }
    };

    const counts = { all: destinationCities.length };
    destinationCities.forEach((c) => {
      const cat = c.category || 'all';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const standardOrder = ['all', 'beach', 'palaces', 'hills', 'metro'];
    return standardOrder
      .filter((id) => id === 'all' || (counts[id] && counts[id] > 0))
      .map((catId) => ({
        id: catId,
        label: categoryMeta[catId]?.label || catId,
        icon: categoryMeta[catId]?.icon || 'fa-map-pin',
        count: counts[catId] || 0
      }));
  }, [destinationCities]);

  // Click handler: Navigates to search screen with city pre-selected and filters reset
  const handleCityCardClick = (city) => {
    const cityName = city.name || city;
    setSelectedDestination(cityName);
    setSearchQuery(cityName);
    if (setSelectedCategory) setSelectedCategory('All');
    setSearchParams((prev) => ({
      ...prev,
      checkInDate,
      checkOutDate,
      adults,
      rooms,
      childrenCount
    }));
    switchNav('search');
    showToast(`Showing all verified hotels in ${cityName}`);
  };

  return (
    <div className="w-full bg-[#f8fafc] text-slate-900">
      
      {/* ========================================================= */}
      {/* 1. HERO BANNER & SEARCH CONSOLE matching MakeMyTrip Style */}
      {/* ========================================================= */}
      <section
        className="relative bg-slate-900 text-white min-h-[420px] sm:min-h-[460px] flex items-center justify-center pt-10 pb-16 sm:pb-20 overflow-visible"
      >
        {/* Hero background image with subtle soft overlay */}
        <div
          className="absolute inset-0 bg-slate-900 overflow-hidden pointer-events-none"
          style={{
            backgroundImage: "url('/images/hero-bg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center 38%',
          }}
        >
          {/* Subtle overlay (only 25% opacity) to preserve photo brightness while boosting contrast */}
          <div className="absolute inset-0 bg-black/25 pointer-events-none" />
        </div>

        {/* Centered Single-Line H1 & Floating Search Console */}
        <div className="relative z-30 max-w-[1360px] w-full mx-auto px-4 sm:px-6 flex flex-col items-center">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-white text-center tracking-tight mb-5 sm:mb-6 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
            Find your next stay — search deals on hotels, homes &amp; much more
          </h1>

          {/* Segmented MakeMyTrip Style Card */}
          <div ref={searchConsoleRef} className="relative w-full max-w-[1240px] mx-auto select-none">
            <div className="bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.16)] border border-slate-200/90 overflow-visible relative">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 divide-y md:divide-y-0 lg:divide-x divide-slate-200">
                
                {/* 1. City, Property Name Or Location */}
                <div 
                  className="lg:col-span-3 p-3.5 sm:px-5 sm:pt-4 sm:pb-8 hover:bg-blue-50/40 transition-colors cursor-pointer relative"
                  onClick={() => setActivePopover(activePopover === 'dest' ? null : 'dest')}
                >
                  <span className="block text-xs text-slate-500 font-normal leading-tight">
                    City, Property Name Or Location
                  </span>
                  <span className="block text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-none mt-1.5 truncate">
                    {destinationCity}
                  </span>
                  <span className="block text-xs text-slate-500 font-normal mt-1 truncate">
                    {destinationCountry}
                  </span>

                  {/* Destination Dropdown Popover */}
                  {activePopover === 'dest' && (
                    <div 
                      className="absolute left-0 top-[calc(100%+8px)] w-full sm:min-w-[360px] md:min-w-[400px] max-h-[360px] overflow-y-auto bg-white rounded-xl shadow-2xl border border-slate-200/90 p-2.5 z-[100] animate-in fade-in slide-in-from-top-1 duration-150"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-1 mb-2">
                        <input
                          type="text"
                          value={destinationSearchInput}
                          onChange={(e) => setDestinationSearchInput(e.target.value)}
                          placeholder="Search city, area or hotel..."
                          className="w-full text-xs sm:text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#003b95] focus:bg-white"
                          autoFocus
                        />
                      </div>

                      <div className="flex items-center justify-between px-2.5 py-1 border-b border-slate-100 mb-1">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                          {cleanDestinationQuery ? 'Search Suggestions' : 'Popular Destinations'}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          {filteredDestinations.length} destinations
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        {filteredDestinations.map((dest) => (
                          <button
                            key={dest.city}
                            type="button"
                            onClick={() => handleSelectCityDestination(dest.city, dest.country)}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left group cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#003b95] group-hover:bg-[#003b95] group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                              <i className={`fa-solid ${dest.icon || 'fa-location-dot'} text-xs`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-1.5 truncate">
                                <span className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-[#003b95] transition-colors">
                                  {dest.city}
                                </span>
                                <span className="text-slate-400 text-[11px] truncate">
                                  {dest.state ? `${dest.state}, ` : ''}{dest.country}
                                </span>
                              </div>
                              <span className="block text-[11px] text-slate-500 truncate">
                                {dest.type}
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                              {dest.stays}
                            </span>
                          </button>
                        ))}
                      </div>

                      {matchingHotels.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <span className="block px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                            Matching Hotels &amp; Resorts
                          </span>
                          <div className="space-y-0.5 mt-1">
                            {matchingHotels.map((h) => (
                              <button
                                key={h.id}
                                type="button"
                                onClick={() => handleSelectHotelDirect(h)}
                                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50/60 transition-colors text-left group cursor-pointer"
                              >
                                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                  <i className="fa-solid fa-hotel text-xs" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="block font-bold text-slate-900 text-xs sm:text-sm truncate group-hover:text-[#003b95]">
                                    {h.name}
                                  </span>
                                  <span className="block text-[11px] text-slate-500 truncate">
                                    {h.locality || h.city}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Check-In */}
                <div 
                  className="lg:col-span-2 p-3.5 sm:px-4 sm:pt-4 sm:pb-8 hover:bg-blue-50/40 transition-colors cursor-pointer relative"
                  onClick={() => setActivePopover(activePopover === 'checkin' ? null : 'checkin')}
                >
                  <div className="flex items-center gap-1 text-xs text-slate-500 font-normal leading-tight">
                    <span>Check-In</span>
                    <i className="fa-solid fa-chevron-down text-sky-500 text-[10px]" />
                  </div>
                  <div className="flex items-baseline mt-1.5 leading-none" suppressHydrationWarning>
                    <span className="text-2xl lg:text-3xl font-extrabold text-slate-900 mr-1.5" suppressHydrationWarning>
                      {inDateInfo.day}
                    </span>
                    <span className="text-base sm:text-lg font-bold text-slate-900" suppressHydrationWarning>
                      {inDateInfo.monthYear}
                    </span>
                  </div>
                  <span className="block text-xs text-slate-500 font-normal mt-1 truncate" suppressHydrationWarning>
                    {inDateInfo.weekday}
                  </span>

                  {/* Date Picker Popover */}
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
                          setCheckOutDate(newOut);
                          setActivePopover('checkout');
                        }}
                        onClose={() => setActivePopover(null)}
                      />
                    </div>
                  )}
                </div>

                {/* 3. Check-Out */}
                <div 
                  className="lg:col-span-2 p-3.5 sm:px-4 sm:pt-4 sm:pb-8 hover:bg-blue-50/40 transition-colors cursor-pointer relative"
                  onClick={() => setActivePopover(activePopover === 'checkout' ? null : 'checkout')}
                >
                  <div className="flex items-center gap-1 text-xs text-slate-500 font-normal leading-tight">
                    <span>Check-Out</span>
                    <i className="fa-solid fa-chevron-down text-sky-500 text-[10px]" />
                  </div>
                  <div className="flex items-baseline mt-1.5 leading-none" suppressHydrationWarning>
                    <span className="text-2xl lg:text-3xl font-extrabold text-slate-900 mr-1.5" suppressHydrationWarning>
                      {outDateInfo.day}
                    </span>
                    <span className="text-base sm:text-lg font-bold text-slate-900" suppressHydrationWarning>
                      {outDateInfo.monthYear}
                    </span>
                  </div>
                  <span className="block text-xs text-slate-500 font-normal mt-1 truncate" suppressHydrationWarning>
                    {outDateInfo.weekday}
                  </span>

                  {/* Date Picker Popover */}
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
                          setCheckInDate(newIn);
                          setCheckOutDate(newOut);
                          setActivePopover(null);
                        }}
                        onClose={() => setActivePopover(null)}
                      />
                    </div>
                  )}
                </div>

                {/* 4. Rooms & Guests */}
                <div 
                  className="lg:col-span-3 p-3.5 sm:px-4 sm:pt-4 sm:pb-8 hover:bg-blue-50/40 transition-colors cursor-pointer relative"
                  onClick={() => setActivePopover(activePopover === 'guests' ? null : 'guests')}
                >
                  <div className="flex items-center gap-1 text-xs text-slate-500 font-normal leading-tight">
                    <span>Rooms &amp; Guests</span>
                    <i className="fa-solid fa-chevron-down text-sky-500 text-[10px]" />
                  </div>
                  <div className="flex items-baseline mt-1.5 leading-none truncate">
                    <span className="text-2xl lg:text-3xl font-extrabold text-slate-900 mr-1">
                      {rooms}
                    </span>
                    <span className="text-sm sm:text-base font-semibold text-slate-800 mr-2.5">
                      Rooms
                    </span>
                    <span className="text-2xl lg:text-3xl font-extrabold text-slate-900 mr-1">
                      {adults}
                    </span>
                    <span className="text-sm sm:text-base font-semibold text-slate-800">
                      Adults
                    </span>
                  </div>
                  <span className="block text-xs text-slate-500 font-normal mt-1 truncate">
                    {childrenCount > 0 ? `${childrenCount} Children` : '0 Children'}
                  </span>

                  {/* Rooms & Guests Popover - Matches Exact Reference Image */}
                  {activePopover === 'guests' && (
                    <div 
                      className="absolute right-0 sm:left-0 top-[calc(100%+8px)] z-50 shadow-2xl rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5 w-72 sm:w-80 animate-in fade-in slide-in-from-top-1 duration-150"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="space-y-4">
                        {/* Row 1: Room */}
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-sm sm:text-base">
                            Room
                          </span>
                          <div className="border border-slate-300 rounded-lg flex items-center justify-between w-24 h-9 px-2.5 bg-white">
                            <button
                              type="button"
                              disabled={rooms <= 1}
                              onClick={() => setRooms(Math.max(1, rooms - 1))}
                              className="text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-lg leading-none cursor-pointer select-none"
                            >
                              -
                            </button>
                            <span className="font-bold text-slate-900 text-sm select-none">
                              {rooms}
                            </span>
                            <button
                              type="button"
                              onClick={() => setRooms(rooms + 1)}
                              className="text-slate-500 hover:text-slate-900 text-lg leading-none cursor-pointer select-none"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Row 2: Adults */}
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-sm sm:text-base">
                            Adults
                          </span>
                          <div className="border border-slate-300 rounded-lg flex items-center justify-between w-24 h-9 px-2.5 bg-white">
                            <button
                              type="button"
                              disabled={adults <= 1}
                              onClick={() => setAdults(Math.max(1, adults - 1))}
                              className="text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-lg leading-none cursor-pointer select-none"
                            >
                              -
                            </button>
                            <span className="font-bold text-slate-900 text-sm select-none">
                              {adults}
                            </span>
                            <button
                              type="button"
                              onClick={() => setAdults(adults + 1)}
                              className="text-slate-500 hover:text-slate-900 text-lg leading-none cursor-pointer select-none"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Row 3: Children */}
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="block font-bold text-slate-800 text-sm sm:text-base">
                              Children
                            </span>
                            <span className="block text-xs text-slate-400 font-normal mt-0.5">
                              0 - 17 Years Old
                            </span>
                          </div>
                          <div className="border border-slate-300 rounded-lg flex items-center justify-between w-24 h-9 px-2.5 bg-white">
                            <button
                              type="button"
                              disabled={childrenCount <= 0}
                              onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                              className="text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-lg leading-none cursor-pointer select-none"
                            >
                              -
                            </button>
                            <span className="font-bold text-slate-900 text-sm select-none">
                              {childrenCount}
                            </span>
                            <button
                              type="button"
                              onClick={() => setChildrenCount(childrenCount + 1)}
                              className="text-slate-500 hover:text-slate-900 text-lg leading-none cursor-pointer select-none"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Apply / Close Button - Minimal Black */}
                      <button
                        type="button"
                        onClick={() => setActivePopover(null)}
                        className="w-full mt-4 py-2 rounded-lg bg-black hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>

                {/* 5. Price Per Night */}
                <div 
                  className="lg:col-span-2 p-3.5 sm:px-4 sm:pt-4 sm:pb-8 hover:bg-blue-50/40 transition-colors cursor-pointer relative"
                  onClick={() => setActivePopover(activePopover === 'price' ? null : 'price')}
                >
                  <span className="block text-xs text-slate-500 font-normal leading-tight">
                    Price Per Night
                  </span>
                  <span className="block text-xs sm:text-sm font-semibold text-slate-800 mt-2 truncate">
                    {priceRange}
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-1">
                    Select budget
                  </span>

                  {/* Price Range Dropdown */}
                  {activePopover === 'price' && (
                    <div 
                      className="absolute right-0 top-[calc(100%+8px)] z-50 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 w-56 animate-in fade-in slide-in-from-top-1 duration-150"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 py-1">
                        Select Price Range
                      </span>
                      <div className="space-y-1 mt-1">
                        {[
                          '₹0-₹1500, ₹1500-₹2500,...',
                          '₹0 - ₹1,500',
                          '₹1,500 - ₹2,500',
                          '₹2,500 - ₹5,000',
                          '₹5,000 - ₹10,000',
                          '₹10,000+',
                        ].map((tier) => (
                          <button
                            key={tier}
                            type="button"
                            onClick={() => {
                              setPriceRange(tier);
                              setActivePopover(null);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              priceRange === tier ? 'bg-blue-50 text-[#003b95] font-bold' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            {tier}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Centered Floating "SEARCH" Button - Minimalist Black */}
              <div className="absolute -bottom-6 sm:-bottom-7 md:-bottom-8 left-1/2 -translate-x-1/2 z-20">
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="px-10 sm:px-14 py-2.5 sm:py-3 rounded-full bg-black hover:bg-zinc-800 text-white font-black text-sm sm:text-base tracking-wider uppercase shadow-md hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap border border-black"
                >
                  <span>SEARCH</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* Main Page Container                                       */}
      {/* ========================================================= */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 pt-6 pb-28 md:pb-16 space-y-12">
        


        {/* ========================================================= */}
        {/* 3. BROWSE BY PROPERTY STYLE (Minimal Luxury Carousel)     */}
        {/* ========================================================= */}
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1.5 mb-1">
                ✦ CURATED ACCOMMODATION STYLES
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Browse by property style
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Handpicked collections tailored to your vacation mindset
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const current = dynamicPropertyStyles.find((s) => s.label === selectedPropertyStyle);
                  if (current) {
                    if (setSelectedCategory) setSelectedCategory(current.categoryFilter);
                    if (setSearchQuery) setSearchQuery(current.searchFilter);
                  }
                  switchNav('search');
                }}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-zinc-900 hover:text-black hover:underline mr-1 cursor-pointer bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-full transition-all"
                title="Browse all properties of this style in Search"
              >
                <span>Explore {selectedPropertyStyle}</span>
                <i className="fa-solid fa-arrow-right text-[10px]" />
              </button>
              <button
                type="button"
                onClick={() => scrollPropertyStyles('left')}
                className="w-9 h-9 rounded-full border border-zinc-200 hover:border-black hover:bg-black hover:text-white bg-white flex items-center justify-center text-xs text-zinc-700 transition-all cursor-pointer shadow-xs active:scale-95"
                aria-label="Previous property style"
              >
                <i className="fa-solid fa-chevron-left" />
              </button>
              <button
                type="button"
                onClick={() => scrollPropertyStyles('right')}
                className="w-9 h-9 rounded-full border border-zinc-200 hover:border-black hover:bg-black hover:text-white bg-white flex items-center justify-center text-xs text-zinc-700 transition-all cursor-pointer shadow-xs active:scale-95"
                aria-label="Next property style"
              >
                <i className="fa-solid fa-chevron-right" />
              </button>
            </div>
          </div>

          <div 
            ref={propertyStylesRef}
            className="flex items-stretch gap-3.5 overflow-x-auto no-scrollbar py-1 scroll-smooth"
          >
            {dynamicPropertyStyles.map((item) => {
              const isSelected = selectedPropertyStyle === item.label;
              return (
                <button
                  key={item.id || item.label}
                  type="button"
                  onClick={() => {
                    const wasSelected = isSelected;
                    setSelectedPropertyStyle(item.label);
                    if (setSelectedCategory) setSelectedCategory(item.categoryFilter);
                    if (setSearchQuery) setSearchQuery(item.searchFilter);

                    if (wasSelected) {
                      showToast(`Showing all verified ${item.label} (${item.count})`);
                      switchNav('search');
                    } else {
                      showToast(`Selected ${item.label} (${item.count}) • Click again to explore stays`);
                    }
                  }}
                  className={`w-44 sm:w-52 shrink-0 p-5 rounded-2xl transition-all duration-300 text-center group cursor-pointer flex flex-col items-center justify-between relative select-none ${
                    isSelected
                      ? 'bg-white border-2 border-black shadow-[0_8px_24px_rgba(0,0,0,0.08)] -translate-y-1.5'
                      : 'bg-white border border-zinc-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-black hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:-translate-y-1'
                  }`}
                >
                  {/* Subtle active pill indicator */}
                  {isSelected && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-black ring-2 ring-white" />
                  )}

                  {/* Icon squircle */}
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl mb-3 transition-all duration-300 ${
                      isSelected
                        ? 'bg-black text-white shadow-xs scale-105'
                        : 'bg-zinc-50 border border-zinc-200/80 text-zinc-800 group-hover:bg-black group-hover:text-white group-hover:border-black group-hover:scale-105 group-hover:shadow-xs'
                    }`}
                  >
                    <i className={`fa-solid ${item.icon}`} />
                  </div>

                  {/* Label */}
                  <strong
                    className={`block text-[13px] font-bold tracking-tight transition-colors ${
                      isSelected ? 'text-black font-extrabold' : 'text-zinc-900 group-hover:text-black'
                    }`}
                  >
                    {item.label}
                  </strong>

                  {/* Stays Count Badge */}
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] mt-2 transition-colors border ${
                      isSelected
                        ? 'font-bold bg-zinc-100 text-black border-zinc-300'
                        : 'font-medium text-zinc-500 bg-zinc-50 border-zinc-200/60 group-hover:bg-zinc-100 group-hover:text-black group-hover:border-zinc-300'
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. EXPLORE CITIES & TRENDING DESTINATIONS                */}
        {/* ========================================================= */}
        <section id="trendingDestinationsSection">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#003b95] inline-flex items-center gap-1.5">
                <span>✦</span>
                <span>EXPLORE DESTINATIONS ACROSS INDIA</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                Popular Cities &amp; Stays
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Click any city to view all verified hotels, luxury palaces, beachfront suites &amp; villas
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => switchNav('destinations')}
                className="text-xs sm:text-sm font-bold text-zinc-900 hover:text-black hover:underline inline-flex items-center gap-1.5 cursor-pointer bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-full transition-all"
                title="View all operating service destinations"
              >
                <i className="fa-solid fa-map-location-dot text-slate-700 text-xs" />
                <span>All {destinationCities.length} Cities</span>
                <i className="fa-solid fa-chevron-right text-[10px]" />
              </button>
            </div>
          </div>

          {/* Quick Experience Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 text-xs font-semibold scrollbar-none">
            {dynamicCityCategories.map((tab) => {
              const isSelected = selectedCityCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCityCategory(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer border ${
                    isSelected
                      ? 'bg-black text-white border-black shadow-xs font-bold'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <i className={`fa-solid ${tab.icon} text-[11px] ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Responsive Cities Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {displayedCities.map((city) => (
              <div
                key={city.name}
                onClick={() => handleCityCardClick(city)}
                className="group relative rounded-2xl overflow-hidden bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-slate-300 transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                <div className="relative aspect-[16/11] overflow-hidden bg-slate-100">
                  <img
                    src={city.image}
                    alt={city.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  {/* Top Left State Badge */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-white text-[10px] font-extrabold tracking-wider uppercase border border-white/20 shadow-xs">
                    {city.state || 'India'}
                  </span>
                  {/* Top Right Tag */}
                  {city.tag && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-amber-400 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow-xs">
                      {city.tag}
                    </span>
                  )}
                  {/* Gradient Title Overlay with High Contrast */}
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent text-white">
                    <span className="text-[11px] uppercase font-black text-amber-300 tracking-wider flex items-center gap-1.5 drop-shadow-sm">
                      <i className="fa-solid fa-location-dot text-[10px] text-amber-400" />
                      <span>{city.state?.toUpperCase()} · INDIA</span>
                    </span>
                    <h3 className="text-xl font-black text-white tracking-tight drop-shadow-md mt-0.5">{city.name}</h3>
                  </div>
                </div>

                <div className="p-4 flex flex-col justify-between gap-3 text-xs flex-1">
                  <div>
                    {/* Clear, readable highlight description */}
                    <p className="text-slate-800 font-semibold text-[13px] leading-snug line-clamp-1 mb-2.5">
                      {city.highlight}
                    </p>
                    {/* Clean transparent stays badge */}
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 border border-slate-200 bg-transparent px-2.5 py-0.5 rounded-full text-xs">
                      <i className="fa-solid fa-hotel text-slate-500 text-[10px]" />
                      <span>{city.hotelsCount} verified {city.hotelsCount === 1 ? 'stay' : 'stays'}</span>
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-1">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block leading-none mb-1">
                        Starting from
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                          {formatPrice ? formatPrice(city.minPrice) : `₹${city.minPrice.toLocaleString('en-IN')}`}
                        </span>
                        <span className="text-xs font-semibold text-slate-600">/night</span>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-200/80 font-bold text-xs group-hover:bg-sky-500 group-hover:text-white group-hover:border-sky-500 transition-all duration-200 shadow-2xs">
                      <span>View Hotels</span>
                      <i className="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Toggle to view all remaining cities on the home page or open destinations screen */}
          {selectedCityCategory === 'all' && destinationCities.length > 8 && (
            <div className="text-center pt-5 flex items-center justify-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setShowAllCities((prev) => !prev)}
                className="px-5 py-2.5 rounded-full border border-slate-300 hover:border-black bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs transition-all shadow-2xs inline-flex items-center gap-2 cursor-pointer"
              >
                <span>
                  {showAllCities
                    ? 'Show fewer destinations'
                    : `Show all ${destinationCities.length} cities`}
                </span>
                <i className={`fa-solid fa-chevron-${showAllCities ? 'up' : 'down'} text-[10px]`} />
              </button>

              <button
                type="button"
                onClick={() => switchNav('destinations')}
                className="px-5 py-2.5 rounded-full bg-black hover:bg-zinc-800 text-white font-bold text-xs transition-all shadow-xs hover:shadow-md inline-flex items-center gap-2 cursor-pointer"
              >
                <i className="fa-solid fa-map-location-dot text-xs" />
                <span>Open Full Destinations Page</span>
                <i className="fa-solid fa-arrow-right text-[10px]" />
              </button>
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* 5. TODAY'S TOP STAY DEALS (MATCHING REFERENCE SHOWCASE)   */}
        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* 5. HOTELS BY SERVICE CITY (BHILWARA, JAIPUR, UDAIPUR, ETC.) */}
        {/* ========================================================= */}
        {citiesWithHotels.length > 0 && (
          <section className="w-full space-y-12" id="hotelsListSection">
            {/* Top Sub-Nav Strip & City Switcher Pills */}
            <div className="pb-4 border-b border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1.5 mb-1">
                    ✦ VERIFIED HOTELS BY CITY
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Explore Hotels in Every Service City
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Browse verified commercial, 3-star AC budget lodging &amp; resort stays across our network
                  </p>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-800 text-[11px] font-semibold border border-slate-200 shadow-2xs self-start sm:self-auto">
                  <i className="fa-solid fa-shield-halved text-slate-700 text-[11px]" />
                  <span>100% Direct Partner Rates</span>
                </div>
              </div>

              {/* City Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                <button
                  type="button"
                  onClick={() => setSelectedCityFilter('all')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    selectedCityFilter === 'all'
                      ? 'bg-black text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-black'
                  }`}
                >
                  All Cities ({hotels?.length || 0})
                </button>
                {citiesWithHotels.map(group => (
                  <button
                    key={group.city}
                    type="button"
                    onClick={() => setSelectedCityFilter(group.city)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                      selectedCityFilter === group.city
                        ? 'bg-black text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-black'
                    }`}
                  >
                    <span>{group.city}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      selectedCityFilter === group.city ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {group.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* City-by-City Hotel Grids */}
            {citiesWithHotels
              .filter(group => selectedCityFilter === 'all' || selectedCityFilter === group.city)
              .map(group => (
                <div key={group.city} className="space-y-4">
                  {/* City Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-2 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-xl bg-sky-50 text-[#0ea5e9] flex items-center justify-center text-xs shadow-2xs">
                          <i className="fa-solid fa-location-dot" />
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                          Hotels in {group.city}
                        </h3>
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          {group.count} {group.count === 1 ? 'Stay' : 'Stays'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1 pl-9">
                        {group.tagline}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDestination(group.city);
                        setSearchQuery(group.city);
                        switchNav('search');
                        showToast(`Showing all verified stays in ${group.city}`);
                      }}
                      className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-black hover:underline cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl transition-all shadow-2xs"
                    >
                      <span>View all in {group.city} ({group.count})</span>
                      <i className="fa-solid fa-arrow-right text-[10px]" />
                    </button>
                  </div>

                  {/* 4 Cards Responsive Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {group.hotels.map((hotel) => {
                      const isFav = favorites?.includes(hotel.id);
                      return (
                        <div
                          key={hotel.id}
                          onClick={() => handleCardClick(hotel)}
                          className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                        >
                          <div>
                            {/* Compact Media container (16/9 Widescreen) */}
                            <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                              <img
                                src={hotel.image}
                                alt={hotel.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              {/* Top Left Discount Badge */}
                              <div className="absolute top-2.5 left-2.5">
                                <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-extrabold text-[10px] shadow-xs inline-flex items-center gap-1">
                                  <i className="fa-solid fa-bolt text-amber-300 text-[9px]" />
                                  <span>{hotel.badge}</span>
                                </span>
                              </div>

                              {/* Top Right Heart Wishlist Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(hotel.id);
                                }}
                                className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/95 backdrop-blur-xs shadow-xs flex items-center justify-center text-slate-600 hover:text-rose-500 hover:bg-white transition-all cursor-pointer"
                                aria-label="Save to wishlist"
                              >
                                <i className={`${isFav ? 'fa-solid text-rose-500' : 'fa-regular'} fa-heart text-[11px]`} />
                              </button>
                            </div>

                            {/* Card Body - Streamlined and Compact */}
                            <div className="p-3.5 sm:p-4 pb-2">
                              {/* Row 1: Name and Rating Pill */}
                              <div className="flex items-start justify-between gap-1.5">
                                <h4 className="font-extrabold text-sm sm:text-[15px] text-slate-900 leading-snug line-clamp-1 group-hover:text-black transition-colors">
                                  {hotel.name}
                                </h4>
                                <div className="shrink-0 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-900 text-[11px] font-black inline-flex items-center gap-0.5 border border-amber-200/90 shadow-2xs">
                                  <span className="text-[10px] text-amber-500">★</span>
                                  <span>{hotel.rating.toFixed(1)}</span>
                                </div>
                              </div>

                              {/* Row 2: Location */}
                              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 mt-1 truncate">
                                <i className="fa-solid fa-location-dot text-[#0ea5e9] text-[10px] shrink-0" />
                                <span className="truncate">{hotel.locality}</span>
                              </div>

                              {/* Row 3: Hotel Features (Single Inline Line) */}
                              <div className="flex items-center gap-2 mt-2 text-[11px] font-semibold text-slate-600 truncate">
                                <span className="flex items-center gap-1 shrink-0 text-slate-700">
                                  <i className={`${hotel.perk1Icon || 'fa-solid fa-circle-check text-emerald-600'} text-[10px]`} />
                                  <span>{hotel.perk1}</span>
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="truncate flex items-center gap-1 text-slate-600">
                                  <i className={`${hotel.perk2Icon || 'fa-solid fa-wifi text-sky-600'} text-[10px]`} />
                                  <span className="truncate">{hotel.perk2}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Pricing and Book Room Button on Same Compact Row */}
                          <div className="p-3.5 sm:p-4 pt-0">
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                              <div>
                                <del className="text-[10px] font-bold text-slate-400 line-through decoration-rose-500/70 block leading-tight">
                                  {formatPrice(hotel.originalPrice)}
                                </del>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                                    {formatPrice(hotel.price)}
                                  </span>
                                  <span className="text-[10px] font-semibold text-slate-500">
                                    / night
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCardClick(hotel);
                                }}
                                className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-black active:scale-[0.98] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer group-hover:bg-[#0ea5e9] shrink-0"
                              >
                                <span>Book</span>
                                <i className="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-0.5 transition-transform" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </section>
        )}
        {/* ========================================================= */}
        {/* CURATED COLLECTIONS - Plan Your Perfect Getaway           */}
        {/* ========================================================= */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-black">
                ✦ CURATED COLLECTIONS
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                Plan Your Perfect Getaway
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Handpicked stays and itineraries tailored to your unique travel style
              </p>
            </div>
            <button
              onClick={() => showToast('Opening all travel collections')}
              className="text-xs sm:text-sm font-bold text-zinc-900 hover:text-black hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View all collections</span>
              <i className="fa-solid fa-chevron-right text-[10px]" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1 */}
            <div
              className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-black transition-all cursor-pointer group flex flex-col justify-between"
              onClick={() => {
                if (setSelectedCategory) setSelectedCategory('Luxury');
                setSearchQuery('Villa');
                setSelectedDestination('All Destinations');
                switchNav('search');
                showToast('Showing Private Pool Villas & Luxury Stays');
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 text-black flex items-center justify-center text-lg">
                    <i className="fa-solid fa-water-ladder" />
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-900 border border-zinc-200/80 text-[10px] font-bold tracking-wider uppercase">
                    ULTIMATE PRIVACY
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-black transition-colors">
                  Private Pool Villas
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Sensual luxury sanctuaries with panoramic vistas &amp; private chef options
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs">
                <span className="text-slate-400 font-semibold">4,200+ Properties</span>
                <span className="font-bold text-black inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Explore Villas <i className="fa-solid fa-arrow-right text-[10px]" />
                </span>
              </div>
            </div>

            {/* Card 2 */}
            <div
              className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-black transition-all cursor-pointer group flex flex-col justify-between"
              onClick={() => {
                if (setSelectedCategory) setSelectedCategory('Resort');
                setSearchQuery('Resort');
                setSelectedDestination('All Destinations');
                switchNav('search');
                showToast('Showing Eco-Luxury & Nature Escapes');
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center text-lg">
                    <i className="fa-solid fa-tree" />
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-bold tracking-wider uppercase">
                    SUSTAINABLE STAYS
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                  Eco-Luxury &amp; Nature Escapes
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Treehouses, cliff-side eco-resorts &amp; serene canvas retreats
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs">
                <span className="text-slate-400 font-semibold">1,240+ Properties</span>
                <span className="font-bold text-emerald-800 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Discover Stays <i className="fa-solid fa-arrow-right text-[10px]" />
                </span>
              </div>
            </div>

            {/* Card 3 */}
            <div
              className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-black transition-all cursor-pointer group flex flex-col justify-between"
              onClick={() => {
                if (setSelectedCategory) setSelectedCategory('Heritage');
                setSearchQuery('Heritage');
                setSelectedDestination('All Destinations');
                switchNav('search');
                showToast('Showing Heritage Havelis & Boutique Palaces');
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center text-lg">
                    <i className="fa-solid fa-archway" />
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 text-[10px] font-bold tracking-wider uppercase">
                    CULTURAL IMMERSION
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                  Heritage &amp; Boutique Palaces
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Historic havelis, châteaux &amp; restored royal residences
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs">
                <span className="text-slate-400 font-semibold">850+ Properties</span>
                <span className="font-bold text-amber-800 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  View Palaces <i className="fa-solid fa-arrow-right text-[10px]" />
                </span>
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================= */}
        {/* 6. WHY BOOK WITH HOTEL FACTORIES (Dynamic 4 Pillars)       */}
        {/* ========================================================= */}
        <section className="py-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Why book with Hotel Factories?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl mx-auto">
            India&apos;s direct hotel network designed for seamless domestic booking with transparent pricing and instant confirmations.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8 text-left">
            {/* 1. Hotel-Direct Transparent Policies */}
            <div
              onClick={() => {
                showToast('Transparent policies set directly by each partner hotel');
                switchNav('search');
              }}
              className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#003b95] flex items-center justify-center text-xl mb-4 group-hover:scale-105 transition-transform">
                  <i className="fa-solid fa-shield-halved" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5 flex items-center justify-between">
                  <span>Hotel-Direct Policies</span>
                  <i className="fa-solid fa-arrow-right text-[11px] text-slate-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Transparent terms. Each hotelier sets their own refund and cancellation window, giving you clear expectations before booking.
                </p>
              </div>
              <span className="text-[11px] font-bold text-sky-600 mt-4 inline-flex items-center gap-1 group-hover:underline">
                Explore Verified Hotels →
              </span>
            </div>

            {/* 2. 50,000+ Stays in India (Dynamic) */}
            <div
              onClick={() => switchNav('destinations')}
              className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#fc790d] flex items-center justify-center text-xl mb-4 group-hover:scale-105 transition-transform">
                  <i className="fa-solid fa-hotel" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5 flex items-center justify-between">
                  <span>{totalStaysCount} Stays in India</span>
                  <i className="fa-solid fa-arrow-right text-[11px] text-slate-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  From heritage palaces in Rajasthan to beach resorts in Goa, hill cottages in Himachal, and prime business hotels in major metros.
                </p>
              </div>
              <span className="text-[11px] font-bold text-orange-600 mt-4 inline-flex items-center gap-1 group-hover:underline">
                View All {destinationCities.length || 10} Destinations →
              </span>
            </div>

            {/* 3. Best INR Rate Guarantee */}
            <div
              onClick={() => {
                showToast('Showing lowest direct partner rates across all stays');
                switchNav('search');
              }}
              className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl mb-4 group-hover:scale-105 transition-transform">
                  <i className="fa-solid fa-tags" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5 flex items-center justify-between">
                  <span>Best INR Rate Guarantee</span>
                  <i className="fa-solid fa-arrow-right text-[11px] text-slate-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Direct hotelier rates with zero hidden markups. Clear GST breakdown and instant Razorpay UPI/Netbanking payment.
                </p>
              </div>
              <span className="text-[11px] font-bold text-amber-600 mt-4 inline-flex items-center gap-1 group-hover:underline">
                View Price Guarantee →
              </span>
            </div>

            {/* 4. 24/7 Dedicated Support */}
            <div
              onClick={() => setIsSupportModalOpen(true)}
              className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center text-xl mb-4 group-hover:scale-105 transition-transform">
                  <i className="fa-solid fa-headset" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5 flex items-center justify-between">
                  <span>24/7 Dedicated Support</span>
                  <i className="fa-solid fa-arrow-right text-[11px] text-slate-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Instant assistance in Hindi and English via phone, WhatsApp, and chat for a stress-free travel experience across India.
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-800 mt-4 inline-flex items-center gap-1 group-hover:underline">
                Contact Concierge Desk →
              </span>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 7. SOCIAL PROOF / TESTIMONIALS (Dynamic & Interactive)    */}
        {/* ========================================================= */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* TrustScore Card */}
          <div
            onClick={() => {
              showToast(`Showing verified hotels backed by ${totalVerifiedReviewsCount} genuine reviews`);
              switchNav('search');
            }}
            className="p-6 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex flex-col justify-between hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group"
          >
            <div>
              <div className="flex items-center gap-1 text-amber-400 text-sm mb-2">
                <i className="fa-solid fa-star" />
                <i className="fa-solid fa-star" />
                <i className="fa-solid fa-star" />
                <i className="fa-solid fa-star" />
                <i className="fa-solid fa-star" />
                <span className="text-slate-900 font-extrabold text-xs ml-1.5">
                  {avgTrustScore} / 5.0 Rating
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug group-hover:text-black">
                Trusted by travelers across all Indian states
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Every booking is backed by genuine reviews from real travelers who completed their stays with Hotel Factories.
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-amber-200/70 text-xs font-bold text-[#003b95] flex items-center justify-between">
              <span>TrustScore {avgTrustScore} · {totalVerifiedReviewsCount} Verified Guest Reviews</span>
              <i className="fa-solid fa-arrow-right text-[11px] group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Dynamic Testimonials from Real Inventory */}
          {dynamicTestimonials.slice(0, 2).map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (item.hotel) {
                  openHotelDetail(item.hotelId, item.hotel);
                }
              }}
              className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1 text-amber-400 text-xs">
                    {Array.from({ length: item.rating }).map((_, i) => (
                      <i key={i} className="fa-solid fa-star" />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                    <i className="fa-solid fa-circle-check text-[9px]" /> Verified Stay
                  </span>
                </div>
                <blockquote className="text-xs text-slate-600 italic leading-relaxed group-hover:text-slate-900 transition-colors">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${item.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0`}>
                    {item.initials}
                  </div>
                  <div>
                    <strong className="block text-xs font-bold text-slate-900 leading-tight">
                      {item.name}
                    </strong>
                    <span className="text-[11px] text-slate-400 block truncate max-w-[170px]">
                      {item.location}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-sky-600 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                  <i className="fa-solid fa-arrow-right text-[10px]" />
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* ========================================================= */}
        {/* 8. SECRET DEALS NEWSLETTER STRIP (Royal Blue Banner)      */}
        {/* ========================================================= */}
        <section className="p-6 sm:p-10 rounded-3xl bg-[#003b95] text-white flex flex-col lg:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="max-w-xl text-left">
            <span className="text-[10px] uppercase font-black tracking-wider text-amber-400 block mb-1">
              TRAVEL SECRET DISCOUNTS
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Save time, save money — unlock Secret Deals
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 mt-2">
              Subscribe to receive private discounts, seasonal price drops, and curated itinerary blueprints directly in your inbox.
            </p>
          </div>

          <div className="w-full lg:w-auto shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                showToast('ðŸŽ‰ Secret Deals unlocked! Confirmation email dispatched.');
              }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full max-w-md"
            >
              <div className="relative flex-1">
                <i className="fa-regular fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-white text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 outline-none font-medium"
                />
              </div>
              <button
                type="submit"
                className="py-3 px-6 rounded-lg bg-black hover:bg-zinc-800 active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap border border-zinc-700"
              >
                Subscribe
              </button>
            </form>
            <span className="block text-[11px] text-slate-300 mt-2 text-center sm:text-left">
              Zero spam. Unsubscribe anytime with a single click.
            </span>
          </div>
        </section>

        {/* 24/7 Dedicated Support Modal */}
        {isSupportModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setIsSupportModalOpen(false)}
          >
            <div
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200 text-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsSupportModalOpen(false)}
                className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <i className="fa-solid fa-xmark text-sm" />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center text-lg">
                  <i className="fa-solid fa-headset" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">24/7 Dedicated Concierge</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-600">Online & Ready to Help</span>
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-500 mb-6 mt-3 leading-relaxed">
                Connect with our India-based travel concierges for instant booking assistance, itinerary alterations, or direct hotelier coordination.
              </p>

              <div className="space-y-3">
                {/* WhatsApp */}
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                      <i className="fa-brands fa-whatsapp" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">WhatsApp Concierge</div>
                      <div className="text-[11px] text-slate-500">Average response in 2 mins (Hindi & English)</div>
                    </div>
                  </div>
                  <i className="fa-solid fa-arrow-up-right-from-square text-xs text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </a>

                {/* Toll Free Phone */}
                <a
                  href="tel:+919876543210"
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                      <i className="fa-solid fa-phone" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Direct Helpline</div>
                      <div className="text-[11px] text-slate-500">+91 98765 43210 / 1800-889-STAY</div>
                    </div>
                  </div>
                  <i className="fa-solid fa-phone text-xs text-slate-400 group-hover:text-sky-600 transition-colors" />
                </a>

                {/* Concierge Email */}
                <a
                  href="mailto:support@hotelfactories.com"
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                      <i className="fa-regular fa-envelope" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Concierge Desk Email</div>
                      <div className="text-[11px] text-slate-500">support@hotelfactories.com</div>
                    </div>
                  </div>
                  <i className="fa-solid fa-chevron-right text-xs text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </a>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Available 24 hours, 7 days a week</span>
                <span className="font-semibold text-slate-600">Zero booking fee guarantee</span>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
