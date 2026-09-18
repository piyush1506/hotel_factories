import React from 'react';
import { useApp } from './context/AppContext';
import BottomNav from './components/BottomNav';
import BookingSheet from './components/BookingSheet';
import VoucherSheet from './components/VoucherSheet';
import FilterSheet from './components/FilterSheet';
import Toast from './components/Toast';
import HomeScreen from './screens/HomeScreen';
import HotelDetailScreen from './screens/HotelDetailScreen';
import SearchScreen from './screens/SearchScreen';
import BookingsScreen from './screens/BookingsScreen';
import SavedScreen from './screens/SavedScreen';
import AdminScreen from './screens/AdminScreen';

export default function App() {
  const { 
    currentScreen, 
    isBookingSheetOpen, 
    isVoucherSheetOpen, 
    isFilterSheetOpen, 
    closeAllSheets 
  } = useApp();

  const isAnySheetOpen = isBookingSheetOpen || isVoucherSheetOpen || isFilterSheetOpen;

  return (
    <div className="mobile-app-root">
      {/* Scrollable Screen Content Viewport */}
      <main className="app-viewport" id="appViewport">
        {currentScreen === 'home' && <HomeScreen />}
        {currentScreen === 'detail' && <HotelDetailScreen />}
        {currentScreen === 'search' && <SearchScreen />}
        {currentScreen === 'bookings' && <BookingsScreen />}
        {currentScreen === 'saved' && <SavedScreen />}
        {currentScreen === 'admin' && <AdminScreen />}
      </main>

      {/* Fixed Bottom Navigation Bar */}
      <BottomNav />

      {/* Bottom Sheet Overlay */}
      <div 
        className={`sheet-overlay ${isAnySheetOpen ? 'active' : ''}`}
        onClick={closeAllSheets}
      ></div>

      {/* Bottom Sheet Modals */}
      <BookingSheet />
      <VoucherSheet />
      <FilterSheet />

      {/* Toast Notifications */}
      <Toast />
    </div>
  );
}
