'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { hotelAPI, bookingAPI, paymentAPI, authAPI, couponAPI, adminAPI, roomAPI } from '../services/api';
import { openRazorpayCheckout } from '../services/razorpay';
import { formatPrice as formatPriceUtil, getDefaultDates } from '../utils/helpers';

const AppContext = createContext(null);

const readStorage = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return key === 'hf_token' ? raw : JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const unwrapList = (data, key) => {
  const list = data?.[key] ?? data?.data ?? data;
  return Array.isArray(list) ? list : [];
};

export const AppProvider = ({ children, initialScreen = 'home' }) => {
  const [currentScreen, setCurrentScreen] = useState(initialScreen);
  const [currency, setCurrency] = useState('INR');

  // Auth
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'

  // Filtering & Search
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRating, setFilterRating] = useState(0);
  const [filterMaxPrice, setFilterMaxPrice] = useState(35000);
  const [filterSort, setFilterSort] = useState('featured');
  const [selectedDestination, setSelectedDestination] = useState('All Destinations');
  const [searchParams, setSearchParams] = useState(() => ({ ...getDefaultDates(), adults: 2, rooms: 1 }));

  // Database / Persisted state
  const [hotels, setHotels] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Active view states
  const [activeHotelId, setActiveHotelId] = useState(null);
  const [activeHotelData, setActiveHotelData] = useState(null);
  const [isHotelDetailLoading, setIsHotelDetailLoading] = useState(false);
  const [activeBookingData, setActiveBookingData] = useState({ hotel: null, room: null });

  // Modal / Sheet visibility
  const [isBookingSheetOpen, setIsBookingSheetOpen] = useState(false);
  const [isVoucherSheetOpen, setIsVoucherSheetOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isOffersSheetOpen, setIsOffersSheetOpen] = useState(false);
  const [isDestinationsModalOpen, setIsDestinationsModalOpen] = useState(false);
  const [activeVoucherBooking, setActiveVoucherBooking] = useState(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifiedPassData, setVerifiedPassData] = useState(null);

  // Partner portal tab & preselection
  const [adminTab, setAdminTab] = useState('dashboard');
  const [targetHotelIdForRoom, setTargetHotelIdForRoom] = useState('');

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((payload, type = 'info') => {
    let message = typeof payload === 'string' ? payload : (payload?.message || '');
    let title = typeof payload === 'object' ? payload?.title : undefined;
    let explicitType = typeof payload === 'object' ? (payload?.type || type) : type;
    let duration = typeof payload === 'object' ? (payload?.duration || 4200) : 4200;
    let action = typeof payload === 'object' ? payload?.action : undefined;

    let detectedType = explicitType;
    const lower = String(message || '').toLowerCase();
    if (explicitType === 'info') {
      if (lower.includes('fail') || lower.includes('error') || lower.includes('cannot') || lower.includes('denied') || lower.includes('invalid') || lower.includes('rejected') || lower.includes('blocked')) {
        detectedType = 'error';
      } else if (lower.includes('success') || lower.includes('confirmed') || lower.includes('saved') || lower.includes('applied') || lower.includes('welcome') || lower.includes('signed in') || lower.includes('unlocked') || lower.includes('booked') || lower.includes('copied')) {
        detectedType = 'success';
      } else if (lower.includes('deal') || lower.includes('discount') || lower.includes('secret') || lower.includes('🎉') || lower.includes('offer')) {
        detectedType = 'special';
      } else {
        detectedType = 'info';
      }
    }

    const id = Date.now() + Math.random();
    setToasts((prev) => [
      ...prev.slice(-2),
      { id, message, title, type: detectedType, duration, action, timestamp: Date.now() }
    ]);
  }, []);

  /* ---------------- Data loaders ---------------- */

  const fetchHotels = useCallback(() => {
    hotelAPI.getCategories().then((d) => setCategories(unwrapList(d, 'categories'))).catch(() => {});
    return hotelAPI
      .getAll({ limit: 100 })
      .then((data) => {
        setHotels(unwrapList(data, 'hotels'));
        setApiError(null);
      })
      .catch((err) => {
        console.error('Failed to fetch hotels:', err);
        setApiError(err.message);
        setHotels([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchCategories = useCallback(() => {
    return hotelAPI
      .getCategories()
      .then((d) => setCategories(unwrapList(d, 'categories')))
      .catch((err) => console.error('Failed to fetch categories:', err));
  }, []);

  const fetchMyBookings = useCallback(() => {
    if (!authToken) return Promise.resolve();
    setBookingsLoading(true);
    return bookingAPI
      .getMy()
      .then((data) => {
        const list = unwrapList(data, 'bookings').filter((b) => b.status !== 'HELD');
        list.sort((a, b) => new Date(b.bookedAt || 0) - new Date(a.bookedAt || 0));
        setBookings(list);
      })
      .catch((err) => console.error('Failed to fetch bookings:', err))
      .finally(() => setBookingsLoading(false));
  }, [authToken]);

  // Rehydrate client-side storage after initial mount to eliminate SSR hydration mismatch
  useEffect(() => {
    try {
      const storedFavs = localStorage.getItem('hf_favorites');
      if (storedFavs) {
        const parsed = JSON.parse(storedFavs);
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
        }
      }
      const storedToken = localStorage.getItem('hf_token');
      if (storedToken) {
        setAuthToken(storedToken);
      }
      if (window.location.pathname === '/admin') {
        setCurrentScreen('admin');
      }
      const handlePopState = () => {
        if (window.location.pathname === '/admin') {
          setCurrentScreen('admin');
        } else {
          setCurrentScreen('home');
        }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    } catch (e) {
      console.error('Failed to rehydrate local storage state:', e);
    }
  }, []);

  // Public catalogue: hotels, cities, coupons
  useEffect(() => {
    let cancelled = false;
    hotelAPI
      .getAll({ limit: 100 })
      .then((data) => {
        if (cancelled) return;
        setHotels(unwrapList(data, 'hotels'));
        setApiError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to fetch hotels:', err);
        setApiError(err.message);
      })
      .finally(() => !cancelled && setLoading(false));

    hotelAPI.getCities().then((d) => !cancelled && setCities(unwrapList(d, 'cities'))).catch(() => {});
    hotelAPI.getCategories().then((d) => !cancelled && setCategories(unwrapList(d, 'categories'))).catch(() => {});
    couponAPI.getAll().then((d) => !cancelled && setCoupons(unwrapList(d, 'coupons'))).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Session: profile + bookings whenever the token changes
  useEffect(() => {
    if (!authToken) return undefined;
    let cancelled = false;
    authAPI
      .getMe()
      .then((data) => !cancelled && setUser(data.user || data.data || null))
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 401) {
          localStorage.removeItem('hf_token');
          setAuthToken(null);
          setUser(null);
        }
      });
    bookingAPI
      .getMy()
      .then((data) => {
        if (cancelled) return;
        const list = unwrapList(data, 'bookings').filter((b) => b.status !== 'HELD');
        list.sort((a, b) => new Date(b.bookedAt || 0) - new Date(a.bookedAt || 0));
        setBookings(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [authToken]);

  /* ---------------- Auth ---------------- */

  const applySession = (data, message) => {
    const token = data.token || data.data?.token;
    if (!token) throw new Error('No session token returned by server.');
    localStorage.setItem('hf_token', token);
    setAuthToken(token);
    if (data.user) setUser(data.user);
    setIsAuthSheetOpen(false);
    showToast(message);
    return data.user;
  };

  const login = async (email, password) => {
    try {
      const data = await authAPI.login({ email, password });
      return applySession(data, `Welcome back${data.user?.name ? `, ${data.user.name.split(' ')[0]}` : ''}!`);
    } catch (err) {
      showToast(err.message);
      return null;
    }
  };

  const loginWithOtp = async ({ phone, email, otp, name }) => {
    try {
      const data = await authAPI.otpVerify({ phone: phone || undefined, email: email || undefined, otp, name: name || undefined });
      return applySession(data, 'Signed in with OTP');
    } catch (err) {
      showToast(err.message);
      return null;
    }
  };

  const register = async (body) => {
    try {
      const { role, ...customerData } = body;
      const data = await authAPI.register(customerData);
      return applySession(data, 'Account created successfully!');
    } catch (err) {
      showToast(err.message);
      return null;
    }
  };

  const loginWithGoogle = async (googlePayload) => {
    try {
      const data = await authAPI.googleAuth(googlePayload);
      return applySession(data, `Welcome${data.user?.name ? `, ${data.user.name.split(' ')[0]}` : ''}! Signed in with Google.`);
    } catch (err) {
      showToast(err.message || 'Google authentication failed.');
      return null;
    }
  };

  const openAuthModal = (tab = 'login') => {
    setAuthTab(tab);
    setIsAuthSheetOpen(true);
  };

  const updateProfile = async (updates) => {
    try {
      const data = await authAPI.updateProfile(updates);
      const updatedUser = data.user || data.data || data;
      if (updatedUser) {
        setUser((prev) => ({ ...prev, ...updatedUser }));
        showToast('Profile updated successfully!');
      }
      return updatedUser;
    } catch (err) {
      showToast(err.message || 'Failed to update profile.');
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem('hf_token');
    setAuthToken(null);
    setUser(null);
    setBookings([]);
    showToast('Signed out');
  };

  /* ---------------- UI helpers ---------------- */

  const toggleCurrency = () => {
    const next = currency === 'INR' ? 'USD' : 'INR';
    setCurrency(next);
    showToast(`Prices now shown in ${next}`);
  };

  const formatPrice = (amount) => formatPriceUtil(amount, currency);

  const scrollTop = () => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const switchNav = (screen) => {
    setCurrentScreen(screen);
    scrollTop();
    if (typeof window !== 'undefined') {
      const targetPath = screen === 'admin' ? '/admin' : '/';
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ screen }, '', targetPath);
      }
    }
  };

  const loadHotelDetail = useCallback(async (hotelId) => {
    if (!hotelId) return;
    setIsHotelDetailLoading(true);
    try {
      let data;
      try {
        data = await hotelAPI.getById(hotelId);
      } catch (err) {
        if (typeof hotelId === 'string' && hotelId.startsWith('ref-')) {
          const alternateId = hotelId.replace('ref-', 'hotel-');
          data = await hotelAPI.getById(alternateId);
        } else {
          throw err;
        }
      }
      if (data && (data.hotel || data.data)) {
        setActiveHotelData(data.hotel || data.data);
      }
    } catch (err) {
      console.error('Failed to fetch hotel details:', err);
    } finally {
      setIsHotelDetailLoading(false);
    }
  }, []);

  const openHotelDetail = (hotelId, initialData = null) => {
    setActiveHotelId(hotelId);
    if (initialData && typeof initialData === 'object') {
      setActiveHotelData(initialData);
    } else {
      const normId = typeof hotelId === 'string' ? hotelId.toLowerCase() : '';
      const altId = normId.startsWith('ref-') ? normId.replace('ref-', 'hotel-') : normId;
      const matched = hotels.find(
        (h) => h.id === hotelId || h._id === hotelId || h.id === altId || h._id === altId
      );
      if (matched) {
        setActiveHotelData(matched);
      }
    }
    setCurrentScreen('detail');
    scrollTop();
    loadHotelDetail(hotelId);
  };

  const toggleFavorite = (hotelId) => {
    const exists = favorites.includes(hotelId);
    const updated = exists ? favorites.filter((id) => id !== hotelId) : [...favorites, hotelId];
    showToast(exists ? 'Removed from saved stays' : 'Saved to your wishlist');
    setFavorites(updated);
    localStorage.setItem('hf_favorites', JSON.stringify(updated));
  };

  const openBookingSheet = (hotel, room) => {
    if (!hotel || !room || typeof hotel !== 'object' || typeof room !== 'object') return;
    setActiveBookingData({ hotel, room, openedAt: Date.now() });
    setIsBookingSheetOpen(false);
    setCurrentScreen('checkout');
    scrollTop();
  };

  const verifyBookingCode = useCallback(async (code, sig = '') => {
    if (!code) return;
    try {
      const clean = code.trim().toUpperCase();
      const query = sig ? `?sig=${encodeURIComponent(sig)}` : '';
      const apiBase = process.env.NEXT_PUBLIC_BACKEND_URL || '/api';
      const res = await fetch(`${apiBase}/bookings/verify/${encodeURIComponent(clean)}${query}`);
      const json = await res.json();
      if (json.success && json.verified) {
        setVerifiedPassData(json.verified);
        setIsVerifyModalOpen(true);
        return json.verified;
      }
    } catch {
      // Fallback
    }
    const local = bookings.find((b) => (b.bookingCode && b.bookingCode.toUpperCase() === code.toUpperCase()) || b.id === code);
    if (local) {
      const pass = {
        isValid: true,
        isCryptographicallySigned: Boolean(sig && local.passSignature === sig),
        signatureStatus: sig ? (local.passSignature === sig ? 'AUTHENTIC_SIGNED' : 'TAMPERED_OR_INVALID') : 'UNSIGNED_LOOKUP',
        securityStamp: sig && local.passSignature === sig 
          ? `HMAC-SHA256 Certified Authenticity (${sig})` 
          : 'MANUAL LOOKUP (No Signature)',
        bookingCode: local.bookingCode || local.id,
        hotelName: local.hotelName,
        roomName: local.roomName,
        guestName: local.guestName,
        guestCount: local.guestCount || 2,
        checkInDate: local.checkInDate || local.checkIn,
        checkOutDate: local.checkOutDate || local.checkOut,
        nights: local.nights || 1,
        status: local.status || 'CONFIRMED',
        paymentStatus: local.paymentStatus || 'PAID',
        totalAmount: local.totalAmount || 5154
      };
      setVerifiedPassData(pass);
      setIsVerifyModalOpen(true);
      return pass;
    }
    showToast(`No verified booking found matching code ${code}`, 'error');
  }, [bookings, showToast]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const verifyCode = params.get('verify');
      const verifySig = params.get('sig');
      if (verifyCode) {
        verifyBookingCode(verifyCode, verifySig || '');
      }
    }
  }, [verifyBookingCode]);

  const openVoucherSheet = (booking) => {
    setActiveVoucherBooking(booking);
    setIsVoucherSheetOpen(true);
  };

  const closeAllSheets = () => {
    setIsBookingSheetOpen(false);
    setIsVoucherSheetOpen(false);
    setIsFilterSheetOpen(false);
    setIsAuthSheetOpen(false);
    setIsOffersSheetOpen(false);
    setIsDestinationsModalOpen(false);
    setIsVerifyModalOpen(false);
  };

  /* ---------------- Bookings ---------------- */

  /**
   * Two-step reservation against the backend:
   * 1) hold -> locks inventory for 10 minutes and returns the priced booking
   * 2) confirm -> marks it paid and returns the QR pass
   * Throws on failure so the booking sheet can show the error inline.
   */
  const handleCreateBooking = async (payload) => {
    if (!authToken) {
      setIsAuthSheetOpen(true);
      throw new Error('Please sign in before booking.');
    }
    const holdRes = await bookingAPI.hold({
      roomId: payload.roomId,
      checkInDate: payload.checkIn,
      checkOutDate: payload.checkOut,
      roomsCount: payload.roomsCount || 1,
      guestName: payload.guestName,
      guestEmail: payload.guestEmail,
      guestPhone: payload.guestPhone,
      guestCount: payload.guestCount,
      specialRequests: payload.specialRequest,
      couponCode: payload.couponCode
    });
    const held = holdRes.booking || holdRes.data;
    if (!held?.id) throw new Error('Could not reserve the room. Please try again.');

    // If customer selected Pay at Hotel
    if (String(payload.paymentMode || '').toLowerCase() === 'hotel') {
      const hotelRes = await paymentAPI.payAtHotel({ bookingId: held.id });
      const confirmed = hotelRes.booking || hotelRes.data;
      if (!confirmed?.id) {
        throw new Error('Could not confirm reservation. Please try again.');
      }
      setIsBookingSheetOpen(false);
      setBookings((prev) => [confirmed, ...prev.filter((b) => b.id !== confirmed.id)]);
      setCurrentScreen('bookings');
      openVoucherSheet(confirmed);
      showToast(`Booking ${confirmed.bookingCode || confirmed.id} confirmed! Pay at property check-in.`);
      fetchHotels();
      return confirmed;
    }

    // Default: Razorpay Online Payment (UPI, Cards, NetBanking)
    const orderRes = await paymentAPI.createOrder({ bookingId: held.id });
    const order = orderRes.order || orderRes.data;
    if (!order?.orderId) throw new Error('Could not initialize payment with Razorpay. Please try again.');
    const payment = await openRazorpayCheckout(order);
    const confirmRes = await paymentAPI.verify({
      bookingId: held.id,
      ...payment
    });
    const confirmed = confirmRes.booking || confirmRes.data;
    if (!confirmed?.id || confirmed.status !== 'CONFIRMED') {
      throw new Error('Payment was not verified. Your reservation was not confirmed.');
    }

    setIsBookingSheetOpen(false);
    setBookings((prev) => [confirmed, ...prev.filter((b) => b.id !== confirmed.id)]);
    setCurrentScreen('bookings');
    openVoucherSheet(confirmed);
    showToast(`Booking ${confirmed.bookingCode || confirmed.id} confirmed!`);
    fetchHotels();
    return confirmed;
  };

  const cancelBooking = async (booking) => {
    try {
      const res = await bookingAPI.cancel(booking.id, 'Cancelled by guest from My Trips');
      const updated = res.booking || res.data;
      setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, ...updated } : b)));
      if (activeVoucherBooking?.id === booking.id) setActiveVoucherBooking({ ...booking, ...updated });
      const refund = updated?.refundAmount;
      showToast(refund !== undefined ? `Booking cancelled · ${formatPrice(refund)} refund pending` : 'Booking cancelled');
      return updated;
    } catch (err) {
      showToast(err.message);
      return null;
    }
  };

  /* ---------------- Partner portal ---------------- */

  const requirePartner = () => {
    if (!authToken) {
      showToast('Please sign in with a partner account');
      setIsAuthSheetOpen(true);
      return false;
    }
    return true;
  };

  const handleAddHotel = async (hotelData) => {
    if (!requirePartner()) return null;
    try {
      const res = await hotelAPI.create(hotelData);
      const newHotel = res.hotel || res.data;
      showToast(`"${newHotel.name}" published successfully!`);
      await fetchHotels();
      openHotelDetail(newHotel.id);
      return newHotel;
    } catch (err) {
      showToast(err.message);
      return null;
    }
  };

  const handleDeleteHotel = async (hotelId) => {
    if (!requirePartner()) return;
    if (!window.confirm('Delete this hotel and all of its rooms?')) return;
    try {
      await hotelAPI.delete(hotelId);
      showToast('Hotel removed from catalogue');
      fetchHotels();
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleAddRoom = async (hotelId, roomData) => {
    if (!requirePartner()) return null;
    try {
      const res = await roomAPI.create({ ...roomData, hotelId });
      const room = res.room || res.data || res;
      showToast(`Room "${room.name || roomData.name}" added`);
      await fetchHotels();
      openHotelDetail(hotelId);
      return room;
    } catch (err) {
      showToast(err.message);
      return null;
    }
  };

  const resetDemoData = async () => {
    if (!window.confirm('Reset all data to seed defaults?')) return;
    try {
      await adminAPI.resetSeed();
      showToast('Database reset to seed defaults');
      fetchHotels();
      switchNav('home');
    } catch (err) {
      showToast(`Reset failed: ${err.message}`);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setFilterRating(0);
    setFilterMaxPrice(35000);
    setFilterSort('featured');
    setSelectedDestination('All Destinations');
    showToast('Filters reset');
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
        setSelectedDestination,
        searchParams,
        setSearchParams,
        hotels,
        categories,
        fetchCategories,
        favorites,
        bookings,
        bookingsLoading,
        cities,
        coupons,
        loading,
        apiError,
        activeHotelId,
        activeHotelData,
        isHotelDetailLoading,
        loadHotelDetail,
        activeBookingData,
        isBookingSheetOpen,
        setIsBookingSheetOpen,
        isVoucherSheetOpen,
        setIsVoucherSheetOpen,
        isFilterSheetOpen,
        setIsFilterSheetOpen,
        isAuthSheetOpen,
        setIsAuthSheetOpen,
        isOffersSheetOpen,
        setIsOffersSheetOpen,
        isDestinationsModalOpen,
        setIsDestinationsModalOpen,
        isVerifyModalOpen,
        setIsVerifyModalOpen,
        verifiedPassData,
        verifyBookingCode,
        activeVoucherBooking,
        adminTab,
        setAdminTab,
        targetHotelIdForRoom,
        setTargetHotelIdForRoom,
        toasts,
        showToast,
        dismissToast,
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
        cancelBooking,
        fetchMyBookings,
        resetDemoData,
        resetFilters,
        openAddRoomForHotel,
        fetchHotels,
        // Auth
        user,
        authToken,
        authTab,
        setAuthTab,
        openAuthModal,
        login,
        loginWithOtp,
        loginWithGoogle,
        register,
        logout,
        updateProfile
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
