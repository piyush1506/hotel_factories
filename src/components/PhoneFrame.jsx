import React from 'react';
import { useApp } from '../context/AppContext';
import StatusBar from './StatusBar';
import BottomNav from './BottomNav';
import BookingSheet from './BookingSheet';
import VoucherSheet from './VoucherSheet';
import FilterSheet from './FilterSheet';
import HomeScreen from '../screens/HomeScreen';
import HotelDetailScreen from '../screens/HotelDetailScreen';
import SearchScreen from '../screens/SearchScreen';
import BookingsScreen from '../screens/BookingsScreen';
import SavedScreen from '../screens/SavedScreen';
import AdminScreen from '../screens/AdminScreen';

export default function PhoneFrame() {
  const { 
    currentScreen, 
    isBookingSheetOpen, 
    isVoucherSheetOpen, 
    isFilterSheetOpen, 
    closeAllSheets 
  } = useApp();

  const isAnySheetOpen = isBookingSheetOpen || isVoucherSheetOpen || isFilterSheetOpen;

  return (
    <div className="phone-frame" id="phoneFrame">
      {/* Phone Speaker Grill */}
      <div className="phone-speaker"></div>

      {/* Phone Screen Viewport */}
      <div className="phone-screen" id="phoneScreen">
        <StatusBar />

        {/* Scrollable Screen Content Viewport */}
        <div className="app-viewport" id="appViewport">
          {currentScreen === 'home' && <HomeScreen />}
          {currentScreen === 'detail' && <HotelDetailScreen />}
          {currentScreen === 'search' && <SearchScreen />}
          {currentScreen === 'bookings' && <BookingsScreen />}
          {currentScreen === 'saved' && <SavedScreen />}
          {currentScreen === 'admin' && <AdminScreen />}
        </div>

        {/* Bottom Navigation */}
        <BottomNav />

        {/* Android Gesture Bar */}
        <div className="gesture-indicator"></div>

        {/* Bottom Sheet Overlay */}
        <div 
          className={`sheet-overlay ${isAnySheetOpen ? 'active' : ''}`}
          onClick={closeAllSheets}
        ></div>

        {/* Modals / Sheets */}
        <BookingSheet />
        <VoucherSheet />
        <FilterSheet />
      </div>
    </div>
  );
}
