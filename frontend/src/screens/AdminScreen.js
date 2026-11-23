'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  adminAPI,
  bookingAPI,
  hotelAPI,
  payoutAPI,
  reviewAPI,
  roomAPI
} from '../services/api';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminTopbar from '../components/admin/AdminTopbar';
import AdminDashboard from '../components/admin/AdminDashboard';
import AdminReports from '../components/admin/AdminReports';
import AdminProperties from '../components/admin/AdminProperties';
import AdminBookings from '../components/admin/AdminBookings';
import AdminUsers from '../components/admin/AdminUsers';
import AdminFinance from '../components/admin/AdminFinance';
import AdminRefunds from '../components/admin/AdminRefunds';
import AdminCoupons from '../components/admin/AdminCoupons';
import AdminReviews from '../components/admin/AdminReviews';
import AdminSettings from '../components/admin/AdminSettings';
import AdminCommandPalette from '../components/admin/AdminCommandPalette';
import AdminQRScannerModal from '../components/admin/AdminQRScannerModal';
import { ADMIN_PAGE_META } from '../components/admin/adminNav';
import { LoadingState } from '../components/admin/AdminUI';

const EMPTY_DATA = {
  metrics: null,
  hotels: [],
  bookings: [],
  users: [],
  payoutOverview: null,
  coupons: [],
  reviews: []
};

const LEGACY_TABS = {
  hotels: 'properties',
  users: 'customers',
  newHotel: 'properties',
  newRoom: 'properties'
};

const VALID_TABS = new Set(Object.keys(ADMIN_PAGE_META));

const DATA_TASKS = [
  { key: 'metrics', request: () => adminAPI.getMetrics(), select: (value) => value },
  { key: 'hotels', request: () => adminAPI.getHotels(), select: (value) => value.hotels || [] },
  { key: 'bookings', request: () => adminAPI.getBookings(), select: (value) => value.bookings || [] },
  { key: 'users', request: () => adminAPI.getUsers(), select: (value) => value.users || [] },
  { key: 'payoutOverview', request: () => payoutAPI.getOverview(), select: (value) => value },
  { key: 'coupons', request: () => adminAPI.getCoupons(), select: (value) => value.coupons || [] },
  { key: 'reviews', request: () => adminAPI.getReviews(), select: (value) => value.reviews || [] }
];

export default function AdminScreen() {
  const {
    user,
    adminTab,
    setAdminTab,
    login,
    logout,
    switchNav,
    setIsAuthSheetOpen,
    showToast,
    fetchHotels,
    verifyBookingCode
  } = useApp();

  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const [propertyCreateSignal, setPropertyCreateSignal] = useState(0);
  const [couponCreateSignal, setCouponCreateSignal] = useState(0);
  const [commandOpen, setCommandOpen] = useState(false);
  const [focusRequest, setFocusRequest] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleScanPass = useCallback(async (scannedCode) => {
    setScannerOpen(false);
    if (verifyBookingCode) {
      await verifyBookingCode(scannedCode);
    }
  }, [verifyBookingCode]);

  const isAdmin = user?.role === 'admin';
  const activeTab = LEGACY_TABS[adminTab] || (VALID_TABS.has(adminTab) ? adminTab : 'dashboard');
  const pageMeta = ADMIN_PAGE_META[activeTab] || ADMIN_PAGE_META.dashboard;

  const loadAdminData = useCallback(async ({ notify = false } = {}) => {
    if (!isAdmin) return;
    setLoading(true);
    const results = await Promise.allSettled(DATA_TASKS.map((task) => task.request()));
    const next = {};
    const failures = [];

    results.forEach((result, index) => {
      const task = DATA_TASKS[index];
      if (result.status === 'fulfilled') {
        next[task.key] = task.select(result.value);
      } else {
        failures.push({ key: task.key, message: result.reason?.message || 'Request failed' });
      }
    });

    if (Object.keys(next).length > 0) {
      setData((current) => ({ ...current, ...next }));
    }

    const metricsFailure = failures.find((failure) => failure.key === 'metrics');
    if (metricsFailure) {
      setError(metricsFailure.message || 'Unable to load the administration data.');
    } else {
      setError('');
    }

    if (notify) {
      if (failures.length === 0) {
        showToast('Control center refreshed');
      } else if (!metricsFailure) {
        showToast(`${failures.length} panel${failures.length === 1 ? '' : 's'} could not refresh. Please try again.`);
      }
    }

    setLastUpdated(new Date());
    setLoading(false);
    setInitialLoading(false);
  }, [isAdmin, showToast]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    let active = true;
    const load = async () => {
      await Promise.resolve();
      if (active) await loadAdminData();
    };
    load();
    return () => {
      active = false;
    };
  }, [isAdmin, loadAdminData]);

  const navigateAdmin = useCallback((tab) => {
    setPropertyCreateSignal(0);
    setCouponCreateSignal(0);
    setFocusRequest(null);
    setAdminTab(tab);
  }, [setAdminTab]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && String(event.key).toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen((current) => !current);
        return;
      }
      const target = event.target;
      const isTyping =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);
      if (event.key === '/' && !isTyping) {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isAdmin]);

  const handleCommandSelect = useCallback((result) => {
    if (!result) return;
    if (result.action === 'scan-qr') {
      setCommandOpen(false);
      setScannerOpen(true);
      return;
    }
    navigateAdmin(result.tab);
    if (result.focusId) {
      setFocusRequest({ type: result.type, id: result.focusId, nonce: Date.now() });
    }
    setCommandOpen(false);
  }, [navigateAdmin]);

  const refresh = () => loadAdminData({ notify: true });

  const signInAsAdmin = async (message = 'Signed in as Platform Administrator') => {
    setDemoBusy(true);
    try {
      await login('admin@hotelfactories.com', 'Password@123');
      showToast(message);
    } catch (loginError) {
      showToast(loginError.message || 'Unable to sign in with the demo administrator.');
    } finally {
      setDemoBusy(false);
    }
  };

  const handleLogout = () => {
    setData(EMPTY_DATA);
    setInitialLoading(true);
    setLastUpdated(null);
    logout();
    switchNav('home');
  };

  const handleVerifyHotel = async (hotel, isVerified) => {
    try {
      await adminAPI.verifyHotel(hotel.id, {
        isVerified,
        verificationStatus: isVerified ? 'APPROVED' : 'REJECTED'
      });
      showToast(isVerified ? `${hotel.name} approved and published` : `${hotel.name} approval withdrawn`);
      await loadAdminData();
      return true;
    } catch (actionError) {
      showToast(actionError.message || 'Unable to update verification.');
      return false;
    }
  };

  const handleSaveCommission = async (hotel, commissionRate) => {
    try {
      await adminAPI.updateCommission(hotel.id, { commissionRate });
      showToast(`Commission updated to ${commissionRate}% for ${hotel.name}`);
      await loadAdminData();
      return true;
    } catch (actionError) {
      showToast(actionError.message || 'Unable to update commission.');
      return false;
    }
  };

  const handleUpdateFlags = async (hotel, flags) => {
    try {
      await adminAPI.updateHotelFlags(hotel.id, flags);
      showToast('Property settings updated');
      await loadAdminData();
      return true;
    } catch (actionError) {
      showToast(actionError.message || 'Unable to update property settings.');
      return false;
    }
  };

  const handleCreateProperty = async (propertyData) => {
    const { autoVerify = true, ...payload } = propertyData;
    try {
      const result = await hotelAPI.create(payload);
      const hotel = result.hotel || result.data;
      if (autoVerify && hotel?.id) {
        await adminAPI.verifyHotel(hotel.id, { isVerified: true, verificationStatus: 'APPROVED' });
      }
      showToast(`"${hotel?.name || payload.name}" published successfully`);
      await Promise.all([loadAdminData(), fetchHotels?.()]);
      return hotel;
    } catch (actionError) {
      showToast(actionError.message || 'Unable to publish the property.');
      return null;
    }
  };

  const handleCreateRoom = async (roomData) => {
    try {
      await roomAPI.create(roomData);
      showToast(`Room "${roomData.name}" added to inventory`);
      await Promise.all([loadAdminData(), fetchHotels?.()]);
      return true;
    } catch (actionError) {
      showToast(actionError.message || 'Unable to add the room.');
      return false;
    }
  };

  const handleUpdateRoom = async (roomId, roomData) => {
    try {
      await roomAPI.update(roomId, roomData);
      showToast('Room inventory updated');
      await Promise.all([loadAdminData(), fetchHotels?.()]);
      return true;
    } catch (actionError) {
      showToast(actionError.message || 'Unable to update the room.');
      return false;
    }
  };

  const handleDeleteRoom = async (roomId) => {
    try {
      await roomAPI.delete(roomId);
      showToast('Room category removed');
      await Promise.all([loadAdminData(), fetchHotels?.()]);
      return true;
    } catch (actionError) {
      showToast(actionError.message || 'Unable to delete the room.');
      return false;
    }
  };

  const handleDeleteHotel = async (hotel) => {
    try {
      await hotelAPI.delete(hotel.id);
      showToast(`"${hotel.name}" removed from the catalogue`);
      await Promise.all([loadAdminData(), fetchHotels?.()]);
      return true;
    } catch (actionError) {
      showToast(actionError.message || 'Unable to delete the property.');
      return false;
    }
  };

  const handleUpdateRole = async (account, role) => {
    try {
      await adminAPI.updateUserRole(account.id, role);
      showToast(`${account.name} is now ${role === 'hotel_owner' ? 'a hotel partner' : role === 'admin' ? 'an administrator' : 'a traveller'}`);
      await loadAdminData();
      return true;
    } catch (actionError) {
      showToast(actionError.message || 'Unable to update the access role.');
      return false;
    }
  };

  const handleExecutePayout = async (booking) => {
    try {
      await payoutAPI.execute({ bookingId: booking.id });
      showToast(`Payout queued for ${booking.hotelName}`);
      await loadAdminData();
      return true;
    } catch (actionError) {
      showToast(actionError.message || 'Unable to queue the payout.');
      return false;
    }
  };

  const handleProcessRefund = async (booking, action, note) => {
    try {
      const res = await adminAPI.processRefund(booking.id, { action, note });
      showToast(res.message || 'Refund updated successfully');
      await loadAdminData();
      return true;
    } catch (actionError) {
      showToast(actionError.message || 'Unable to process refund.');
      return false;
    }
  };

  const handleCheckIn = async (booking) => {
    try {
      await bookingAPI.checkIn(booking.bookingCode);
      showToast(`Guest checked in for ${booking.bookingCode}`);
      await loadAdminData();
      return true;
    } catch (actionError) {
      showToast(actionError.message || 'Unable to check in the guest.');
      return false;
    }
  };

  const handleCheckOut = async (booking) => {
    try {
      await bookingAPI.checkOut(booking.bookingCode);
      showToast(`Guest checked out for ${booking.bookingCode}. Stay completed.`);
      await loadAdminData();
      return true;
    } catch (actionError) {
      showToast(actionError.message || 'Unable to check out the guest.');
      return false;
    }
  };

  const handleMarkNoShow = async (booking, reason) => {
    try {
      await bookingAPI.noShow(booking.bookingCode, reason);
      showToast(`Booking ${booking.bookingCode} marked as No-Show`);
      await loadAdminData();
      return true;
    } catch (actionError) {
      showToast(actionError.message || 'Unable to mark as No-Show.');
      return false;
    }
  };

  const handleCancelBooking = async (booking, reason) => {
    try {
      await bookingAPI.cancel(booking.id, reason);
      showToast(`Booking ${booking.bookingCode} cancelled`);
      await loadAdminData();
      return true;
    } catch (actionError) {
      showToast(actionError.message || 'Unable to cancel the booking.');
      return false;
    }
  };

  const handleCreateCoupon = async (payload) => {
    try {
      await adminAPI.createCoupon(payload);
      showToast(`Coupon ${payload.code} created`);
      await loadAdminData();
      return true;
    } catch (actionError) {
      showToast(actionError.message || 'Unable to create the coupon.');
      return false;
    }
  };

  const handleUpdateCoupon = async (coupon, payload) => {
    try {
      await adminAPI.updateCoupon(coupon.id, payload);
      showToast(`Coupon ${coupon.code} updated`);
      await loadAdminData();
      return true;
    } catch (actionError) {
      showToast(actionError.message || 'Unable to update the coupon.');
      return false;
    }
  };

  const handleDeleteCoupon = async (coupon) => {
    try {
      await adminAPI.deleteCoupon(coupon.id);
      showToast(`Coupon ${coupon.code} deleted`);
      await loadAdminData();
      return true;
    } catch (actionError) {
      showToast(actionError.message || 'Unable to delete the coupon.');
      return false;
    }
  };

  const handleReplyReview = async (review, replyText) => {
    try {
      await reviewAPI.reply(review.id, { replyText });
      showToast(review.hotelResponse ? 'Review response updated' : 'Review response published');
      await loadAdminData();
      return true;
    } catch (actionError) {
      showToast(actionError.message || 'Unable to publish the response.');
      return false;
    }
  };

  const handleResetSeed = async () => {
    try {
      await adminAPI.resetSeed();
      showToast('Workspace reset to the seed catalogue');
      setData(EMPTY_DATA);
      navigateAdmin('dashboard');
      await Promise.all([loadAdminData(), fetchHotels?.()]);
      return true;
    } catch (actionError) {
      showToast(actionError.message || 'Unable to reset the workspace.');
      return false;
    }
  };

  const handleQuickAction = (type) => {
    setFocusRequest(null);
    if (type === 'property') {
      setCouponCreateSignal(0);
      setPropertyCreateSignal((value) => value + 1);
      setAdminTab('properties');
    } else if (type === 'coupon') {
      setPropertyCreateSignal(0);
      setCouponCreateSignal((value) => value + 1);
      setAdminTab('coupons');
    } else if (type === 'room') {
      navigateAdmin('properties');
      showToast('Open a property from the portfolio to add a room category.');
    }
  };

  const badges = useMemo(
    () => ({
      properties: data.hotels.filter((hotel) => !hotel.isVerified).length,
      bookings: data.bookings.filter((booking) => ['CONFIRMED', 'CHECKED_IN'].includes(booking.status)).length,
      finance: (data.payoutOverview?.pendingBookings || []).filter((booking) => booking.payoutStatus === 'READY_FOR_PAYOUT').length,
      refunds: data.bookings.filter((booking) => booking.refundStatus === 'PENDING_PROVIDER').length,
      reviews: data.reviews.filter((review) => !review.hotelResponse).length
    }),
    [data.hotels, data.bookings, data.payoutOverview, data.reviews]
  );

  const alerts = useMemo(() => {
    const pendingRefunds = data.bookings.filter((booking) => booking.refundStatus === 'PENDING_PROVIDER').length;
    const referenceTime = lastUpdated ? lastUpdated.getTime() : null;
    const expiringCoupons = referenceTime === null ? 0 : data.coupons.filter((coupon) => {
      if (!coupon.isActive || !coupon.expiresAt) return false;
      const days = (new Date(coupon.expiresAt).getTime() - referenceTime) / 86400000;
      return days >= 0 && days <= 30;
    }).length;
    return [
      badges.properties > 0 && { id: 'properties', icon: 'fa-hotel', tone: 'amber', label: 'Properties awaiting verification', detail: 'Review new hotel partners', count: badges.properties, tab: 'properties' },
      badges.finance > 0 && { id: 'payouts', icon: 'fa-building-columns', tone: 'sky', label: 'Payouts ready to release', detail: 'Guest check-in completed', count: badges.finance, tab: 'finance' },
      pendingRefunds > 0 && { id: 'refunds', icon: 'fa-rotate-left', tone: 'rose', label: 'Refunds pending provider', detail: 'Cancelled bookings awaiting refund', count: pendingRefunds, tab: 'refunds' },
      badges.reviews > 0 && { id: 'reviews', icon: 'fa-comment-dots', tone: 'sky', label: 'Reviews without a reply', detail: 'Respond on behalf of hotel partners', count: badges.reviews, tab: 'reviews' },
      expiringCoupons > 0 && { id: 'coupons', icon: 'fa-ticket', tone: 'amber', label: 'Coupons expiring this month', detail: 'Review promotions before they lapse', count: expiringCoupons, tab: 'coupons' }
    ].filter(Boolean);
  }, [badges, data.bookings, data.coupons, lastUpdated]);

  if (!user) {
    return (
      <AdminGate
        icon="fa-shield-halved"
        eyebrow="Restricted area"
        title="Administrator sign-in required"
        description="Sign in with an administrator account to open the Hotel Factories control center. Analytics, property approvals, bookings, payouts and platform settings are protected."
        primary={{ label: demoBusy ? 'Signing in…' : '1-Click admin demo login', icon: 'fa-bolt', onClick: () => signInAsAdmin(), busy: demoBusy }}
        secondary={{ label: 'Sign in manually', onClick: () => setIsAuthSheetOpen(true) }}
        tertiary={{ label: 'Return to hotel website', onClick: () => switchNav('home') }}
      />
    );
  }

  if (!isAdmin) {
    return (
      <AdminGate
        icon="fa-lock"
        eyebrow="Access denied"
        title="Administrator access only"
        description={`Your current account (${user.role === 'hotel_owner' ? 'Hotel Partner' : 'Traveller'}) does not have platform administrator privileges. Switch to the demo administrator to continue.`}
        primary={{ label: demoBusy ? 'Switching…' : 'Switch to admin account', icon: 'fa-arrows-rotate', onClick: () => signInAsAdmin('Switched to Platform Administrator'), busy: demoBusy }}
        secondary={{ label: 'Return to hotel website', onClick: () => switchNav('home') }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <AdminSidebar
        activeTab={activeTab}
        onSelect={navigateAdmin}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user}
        onLogout={handleLogout}
        onExit={() => switchNav('home')}
        badges={badges}
        onSearch={() => setCommandOpen(true)}
      />

      <div className="min-h-screen lg:pl-[262px]">
        <AdminTopbar
          title={pageMeta.title}
          description={pageMeta.description}
          user={user}
          onMenu={() => setMobileOpen(true)}
          onRefresh={refresh}
          loading={loading}
          onExit={() => switchNav('home')}
          onLogout={handleLogout}
          alerts={alerts}
          onNavigate={navigateAdmin}
          onSearch={() => setCommandOpen(true)}
          onOpenScanner={() => setScannerOpen(true)}
        />

        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-5 flex flex-col gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-start gap-2">
                <i className="fa-solid fa-triangle-exclamation mt-0.5" aria-hidden="true" />
                {error}
              </span>
              <button type="button" onClick={refresh} className="shrink-0 self-start rounded-md bg-white px-3 py-1.5 text-[10px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-200 transition hover:bg-rose-100 sm:self-auto">
                Retry
              </button>
            </div>
          )}

          {initialLoading ? (
            <LoadingState label="Loading the control center…" />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <AdminDashboard
                  metrics={data.metrics}
                  hotels={data.hotels}
                  bookings={data.bookings}
                  users={data.users}
                  payoutOverview={data.payoutOverview}
                  coupons={data.coupons}
                  reviews={data.reviews}
                  asOf={lastUpdated}
                  onNavigate={navigateAdmin}
                  onQuickAction={handleQuickAction}
                  onOpenScanner={() => setScannerOpen(true)}
                />
              )}
              {activeTab === 'reports' && (
                <AdminReports
                  bookings={data.bookings}
                  hotels={data.hotels}
                  metrics={data.metrics}
                  asOf={lastUpdated}
                  onNavigate={navigateAdmin}
                />
              )}
              {activeTab === 'properties' && (
                <AdminProperties
                  hotels={data.hotels}
                  bookings={data.bookings}
                  users={data.users}
                  onVerify={handleVerifyHotel}
                  onSaveCommission={handleSaveCommission}
                  onUpdateFlags={handleUpdateFlags}
                  onCreateProperty={handleCreateProperty}
                  onCreateRoom={handleCreateRoom}
                  onUpdateRoom={handleUpdateRoom}
                  onDeleteRoom={handleDeleteRoom}
                  onDeleteHotel={handleDeleteHotel}
                  createSignal={propertyCreateSignal}
                  showToast={showToast}
                  focusRequest={focusRequest}
                />
              )}
              {activeTab === 'bookings' && (
                <AdminBookings
                  bookings={data.bookings}
                  hotels={data.hotels}
                  onCheckIn={handleCheckIn}
                  onCheckOut={handleCheckOut}
                  onMarkNoShow={handleMarkNoShow}
                  onCancel={handleCancelBooking}
                  focusRequest={focusRequest}
                  onOpenScanner={() => setScannerOpen(true)}
                />
              )}
              {activeTab === 'customers' && (
                <AdminUsers
                  users={data.users}
                  bookings={data.bookings}
                  currentUser={user}
                  onUpdateRole={handleUpdateRole}
                  focusRequest={focusRequest}
                />
              )}
              {activeTab === 'finance' && (
                <AdminFinance
                  overview={data.payoutOverview}
                  metrics={data.metrics}
                  bookings={data.bookings}
                  hotels={data.hotels}
                  onExecutePayout={handleExecutePayout}
                  showToast={showToast}
                />
              )}
              {activeTab === 'refunds' && (
                <AdminRefunds
                  bookings={data.bookings}
                  onProcessRefund={handleProcessRefund}
                  onNavigate={navigateAdmin}
                  focusRequest={focusRequest}
                />
              )}
              {activeTab === 'coupons' && (
                <AdminCoupons
                  coupons={data.coupons}
                  onCreate={handleCreateCoupon}
                  onUpdate={handleUpdateCoupon}
                  onDelete={handleDeleteCoupon}
                  createSignal={couponCreateSignal}
                  focusRequest={focusRequest}
                />
              )}
              {activeTab === 'reviews' && (
                <AdminReviews
                  reviews={data.reviews}
                  onReply={handleReplyReview}
                  onNavigate={navigateAdmin}
                  focusRequest={focusRequest}
                />
              )}
              {activeTab === 'settings' && (
                <AdminSettings
                  user={user}
                  metrics={data.metrics}
                  hotels={data.hotels}
                  bookings={data.bookings}
                  users={data.users}
                  coupons={data.coupons}
                  reviews={data.reviews}
                  payoutOverview={data.payoutOverview}
                  loading={loading}
                  onRefresh={refresh}
                  onResetSeed={handleResetSeed}
                  onNavigate={navigateAdmin}
                  onLogout={handleLogout}
                  onExit={() => switchNav('home')}
                  showToast={showToast}
                />
              )}

              <div className="mt-6 flex flex-col gap-1 border-t border-slate-200/80 pt-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Signed in as <strong className="font-semibold text-slate-600">{user.name}</strong> · Platform Administrator
                </span>
                <span>
                  Last refreshed {lastUpdated ? lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'} · Hotel Factories Control Center v1.1
                </span>
              </div>
            </>
          )}
        </main>
      </div>

      {commandOpen && (
        <AdminCommandPalette
          onClose={() => setCommandOpen(false)}
          onSelect={handleCommandSelect}
          data={data}
          activeTab={activeTab}
        />
      )}

      <AdminQRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScanPass}
      />
    </div>
  );
}

function AdminGate({ icon, eyebrow, title, description, primary, secondary, tertiary }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 py-12 sm:px-6">
      <div className="relative grid w-full max-w-3xl overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(15,23,42,0.06),0_12px_24px_-4px_rgba(15,23,42,0.04)] ring-1 ring-slate-900/[0.04] lg:grid-cols-5">
        {/* Left Informational Column */}
        <div className="hidden border-r border-slate-200/80 bg-slate-50/75 p-7 lg:col-span-2 lg:flex lg:flex-col justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-xs font-bold text-white shadow-sm">
              <i className="fa-solid fa-hotel" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[13px] font-bold leading-tight tracking-tight text-slate-900">Hotel Factories</p>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Control Center</p>
            </div>
          </div>

          <div className="my-auto py-6">
            <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Platform Administration
            </div>
            <h2 className="mt-3 font-heading text-lg font-bold leading-snug tracking-tight text-slate-900">
              Run the marketplace from one calm workspace.
            </h2>
            <ul className="mt-4 space-y-2.5 text-xs text-slate-600">
              {[
                'Live analytics and booking performance',
                'Property approvals and room inventory',
                'Escrow health and hotel settlements',
                'Guest reviews, coupons and access roles'
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <i className="fa-solid fa-check text-xs text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-slate-200/70 pt-3.5 flex items-center justify-between text-xs text-slate-400 font-medium">
            <span className="inline-flex items-center gap-1.5">
              <i className="fa-solid fa-shield-halved text-xs text-slate-400" aria-hidden="true" />
              Authorized personnel only
            </span>
            <span className="rounded bg-slate-200/60 px-1.5 py-0.5 text-[11px] font-bold text-slate-600">v1.1</span>
          </div>
        </div>

        {/* Right Interaction Column */}
        <div className="p-7 sm:p-9 lg:col-span-3 bg-white flex flex-col justify-between">
          <div>
            <span className="mb-3.5 inline-grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-sm text-slate-700 border border-slate-200/60">
              <i className={`fa-solid ${icon}`} aria-hidden="true" />
            </span>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{eyebrow}</p>
            <h1 className="mt-1 font-heading text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">{description}</p>
          </div>

          <div className="mt-7 space-y-2">
            <button
              type="button"
              onClick={primary.onClick}
              disabled={primary.busy}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {primary.busy ? (
                <i className="fa-solid fa-circle-notch fa-spin text-xs" aria-hidden="true" />
              ) : (
                <i className={`fa-solid ${primary.icon} text-xs text-white/80`} aria-hidden="true" />
              )}
              {primary.label}
            </button>
            {secondary && (
              <button
                type="button"
                onClick={secondary.onClick}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
              >
                <i className="fa-solid fa-arrow-right-to-bracket text-xs text-slate-400" aria-hidden="true" />
                {secondary.label}
              </button>
            )}
            {tertiary && (
              <button
                type="button"
                onClick={tertiary.onClick}
                className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg px-4 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
              >
                <i className="fa-solid fa-arrow-left text-xs" aria-hidden="true" />
                {tertiary.label}
              </button>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
            <i className="fa-solid fa-lock text-xs text-slate-400 shrink-0" aria-hidden="true" />
            <span>Demo administrator access pre-configured · Manual sign-in supported</span>
          </div>
        </div>
      </div>
    </div>
  );
}
