import React, { createContext, useContext, useState, useEffect } from 'react';
import { DB } from '../data/hotels';
import { formatPrice as formatPriceUtil } from '../utils/helpers';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [viewMode, setViewMode] = useState('phone'); // 'phone' | 'full'
  const [currency, setCurrency] = useState('INR'); // 'INR' | 'USD'
  
  // Filtering & Search
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRating, setFilterRating] = useState(0);
  const [filterMaxPrice, setFilterMaxPrice] = useState(35000);
  const [filterSort, setFilterSort] = useState('featured');
  const [selectedDestination, setSelectedDestination] = useState('All Destinations');

  // Database / Persisted state
  const [hotels, setHotels] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [bookings, setBookings] = useState([]);

  // Active view states
  const [activeHotelId, setActiveHotelId] = useState(null);
  const [activeBookingData, setActiveBookingData] = useState({
    hotel: null,
    room: null,
    promoDiscount: 0,
    checkIn: '',
    checkOut: '',
    nights: 1,
    total: 0
  });

  // Modal / Sheet visibility
  const [isBookingSheetOpen, setIsBookingSheetOpen] = useState(false);
  const [isVoucherSheetOpen, setIsVoucherSheetOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [activeVoucherBooking, setActiveVoucherBooking] = useState(null);

  // Admin Tab & Preselection
  const [adminTab, setAdminTab] = useState('newHotel'); // 'newHotel' | 'newRoom' | 'catalog'
  const [targetHotelIdForRoom, setTargetHotelIdForRoom] = useState('');

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Initialize data on mount
  useEffect(() => {
    setHotels(DB.getHotels());
    setFavorites(DB.getFavorites());
    setBookings(DB.getBookings());
  }, []);

  const showToast = (message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  const toggleCurrency = () => {
    const next = currency === 'INR' ? 'USD' : 'INR';
    setCurrency(next);
    showToast(`Currency changed to ${next}`);
  };

  const formatPrice = (amount) => {
    return formatPriceUtil(amount, currency);
  };

  const switchNav = (screen) => {
    setCurrentScreen(screen);
    const viewport = document.getElementById('appViewport');
    if (viewport) {
      viewport.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const openHotelDetail = (hotelId) => {
    setActiveHotelId(hotelId);
    setCurrentScreen('detail');
    const viewport = document.getElementById('appViewport');
    if (viewport) {
      viewport.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleFavorite = (hotelId) => {
    const updated = DB.toggleFavorite(hotelId);
    setFavorites([...updated]);
    const isNowFav = updated.includes(hotelId);
    showToast(isNowFav ? "Added to your wishlist ❤️" : "Removed from wishlist");
  };

  const openBookingSheet = (hotelId, roomId) => {
    const hotel = hotels.find(h => h.id === hotelId);
    if (!hotel) return;
    const room = (hotel.rooms || []).find(r => r.id === roomId);
    if (!room) return;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 4);

    const checkInStr = tomorrow.toISOString().split('T')[0];
    const checkOutStr = checkOut.toISOString().split('T')[0];
    const nights = 3;
    const roomRate = room.price * nights;
    const taxes = Math.round(roomRate * 0.12);
    const total = roomRate + taxes;

    setActiveBookingData({
      hotel,
      room,
      promoDiscount: 0,
      checkIn: checkInStr,
      checkOut: checkOutStr,
      nights,
      total
    });

    setIsBookingSheetOpen(true);
  };

  const openVoucherSheet = (booking) => {
    setActiveVoucherBooking(booking);
    setIsVoucherSheetOpen(true);
  };

  const closeAllSheets = () => {
    setIsBookingSheetOpen(false);
    setIsVoucherSheetOpen(false);
    setIsFilterSheetOpen(false);
  };

  const handleAddHotel = (hotelData) => {
    const newHotel = DB.addHotel(hotelData);
    setHotels(DB.getHotels());
    showToast(`✅ "${newHotel.name}" published successfully!`);
    openHotelDetail(newHotel.id);
    return newHotel;
  };

  const handleDeleteHotel = (hotelId) => {
    if (window.confirm("Are you sure you want to delete this hotel from inventory?")) {
      const updated = DB.deleteHotel(hotelId);
      setHotels(updated);
      showToast("Hotel removed from catalog");
    }
  };

  const handleAddRoom = (hotelId, roomData) => {
    const room = DB.addRoomToHotel(hotelId, roomData);
    if (room) {
      setHotels(DB.getHotels());
      showToast(`✅ Room "${room.name}" added to hotel!`);
      openHotelDetail(hotelId);
    }
    return room;
  };

  const handleCreateBooking = (bookingData) => {
    const newBooking = DB.saveBooking(bookingData);
    setBookings(DB.getBookings());
    setIsBookingSheetOpen(false);
    openVoucherSheet(newBooking);
    showToast(`Booking ${newBooking.id} confirmed successfully!`);
  };

  const resetDemoData = () => {
    if (window.confirm("Reset all hotel and room data to luxury defaults?")) {
      const fresh = DB.resetDefaults();
      setHotels(fresh);
      showToast("Reset to factory defaults completed");
      switchNav('home');
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setFilterRating(0);
    setFilterMaxPrice(35000);
    setFilterSort('featured');
    setSelectedDestination('All Destinations');
    showToast("Filters reset");
  };

  const cycleDestination = () => {
    const cities = ["All Destinations", "Udaipur", "Goa", "Mumbai", "Manali"];
    const nextIdx = (cities.indexOf(selectedDestination) + 1) % cities.length;
    const chosen = cities[nextIdx];
    setSelectedDestination(chosen);
    setSearchQuery(chosen === "All Destinations" ? "" : chosen);
    showToast(`Showing hotels in ${chosen}`);
  };

  const openAddRoomForHotel = (hotelId) => {
    setTargetHotelIdForRoom(hotelId);
    setAdminTab('newRoom');
    switchNav('admin');
  };

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        viewMode,
        setViewMode,
        currency,
        toggleCurrency,
        formatPrice,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        filterRating,
        setFilterRating,
        filterMaxPrice,
        setFilterMaxPrice,
        filterSort,
        setFilterSort,
        selectedDestination,
        cycleDestination,
        hotels,
        favorites,
        bookings,
        activeHotelId,
        activeBookingData,
        setActiveBookingData,
        isBookingSheetOpen,
        setIsBookingSheetOpen,
        isVoucherSheetOpen,
        setIsVoucherSheetOpen,
        isFilterSheetOpen,
        setIsFilterSheetOpen,
        activeVoucherBooking,
        adminTab,
        setAdminTab,
        targetHotelIdForRoom,
        setTargetHotelIdForRoom,
        toasts,
        showToast,
        switchNav,
        openHotelDetail,
        toggleFavorite,
        openBookingSheet,
        openVoucherSheet,
        closeAllSheets,
        handleAddHotel,
        handleDeleteHotel,
        handleAddRoom,
        handleCreateBooking,
        resetDemoData,
        resetFilters,
        openAddRoomForHotel
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
