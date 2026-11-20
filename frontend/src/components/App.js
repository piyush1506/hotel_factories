'use client';

import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import DesktopNavbar from './DesktopNavbar';
import DesktopFooter from './DesktopFooter';
import BottomNav from './BottomNav';
import BookingSheet from './BookingSheet';
import VoucherSheet from './VoucherSheet';
import FilterSheet from './FilterSheet';
import AuthSheet from './AuthSheet';
import VerifyModal from './VerifyModal';
import Toast from './Toast';
import HomeScreen from '../screens/HomeScreen';
import HotelDetailScreen from '../screens/HotelDetailScreen';
import SearchScreen from '../screens/SearchScreen';
import BookingsScreen from '../screens/BookingsScreen';
import SavedScreen from '../screens/SavedScreen';
import AdminScreen from '../screens/AdminScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import DestinationsScreen from '../screens/DestinationsScreen';
export default function App() {
  const {
    currentScreen,
    isBookingSheetOpen,
    isVoucherSheetOpen,
    isFilterSheetOpen,
    isAuthSheetOpen,
    isDestinationsModalOpen,
    closeAllSheets
  } = useApp();

  const isAnySheetOpen = isBookingSheetOpen || isVoucherSheetOpen || isFilterSheetOpen || isAuthSheetOpen;
  const hasOpenModal = isAnySheetOpen || isDestinationsModalOpen;

  // Close active sheets on Escape key press
  useEffect(() => {
    if (!hasOpenModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeAllSheets();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hasOpenModal, closeAllSheets]);

  return (
    <div className="hf-web-app-root min-h-screen flex flex-col bg-white text-slate-900 font-sans antialiased selection:bg-brand selection:text-white">
      {/* Top Luxury Desktop & Tablet Navigation */}
      {currentScreen !== 'admin' && <DesktopNavbar />}

      {/* Main Viewport Content */}
      <main className="hf-main-content flex-1 w-full" id="appViewport">
        {currentScreen === 'home' && <HomeScreen />}
        {currentScreen === 'detail' && <HotelDetailScreen />}
        {currentScreen === 'checkout' && <CheckoutScreen />}
        {currentScreen === 'search' && <SearchScreen />}
        {currentScreen === 'destinations' && <DestinationsScreen />}
        {currentScreen === 'bookings' && <BookingsScreen />}
        {currentScreen === 'saved' && <SavedScreen />}
        {currentScreen === 'admin' && <AdminScreen />}
      </main>

      {/* Full Luxury Footer (Visible on Desktop / Web View) */}
      {currentScreen !== 'admin' && <DesktopFooter />}

      {/* Floating Island Mobile Bottom Navigation (Reduced Width & Height) */}
      {currentScreen !== 'admin' && <BottomNav />}



      {/* Modal / Sheet Backdrop Overlay */}
      <div
        className={`sheet-overlay fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 ${isAnySheetOpen ? 'active opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={closeAllSheets}
        aria-hidden="true"
      ></div>

      {/* Dynamic Sheet & Dialog Modals */}
      <BookingSheet />
      <VoucherSheet />
      <FilterSheet />
      <AuthSheet />
      <VerifyModal />

      {/* Global Interactive Toast Notification */}
      <Toast />
    </div>
  );
}
