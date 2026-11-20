'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { roomAPI } from '../../services/api';
import {
  Badge,
  ConfirmDialog,
  Drawer,
  EmptyState,
  Field,
  FilterSelect,
  GhostButton,
  LoadingState,
  PageHeader,
  Panel,
  PanelHeader,
  PrimaryButton,
  SearchField,
  SelectInput,
  TableShell
} from './AdminUI';
import { PropertyForm, RoomForm } from './AdminPropertyForms';
import {
  VERIFICATION_META,
  PROPERTY_STATUS_META,
  ROOM_STATUS_META,
  downloadCsv,
  formatCurrency,
  formatDate,
  formatNumber,
  getHotelRevenue,
  hotelOwner
} from './adminUtils';

export default function AdminProperties({
  hotels = [],
  bookings = [],
  users = [],
  onVerify,
  onSaveCommission,
  onUpdateFlags,
  onCreateProperty,
  onCreateRoom,
  onUpdateRoom,
  onDeleteRoom,
  onDeleteHotel,
  createSignal = 0,
  showToast,
  focusRequest
}) {
  const [search, setSearch] = useState('');
  const [verifyFilter, setVerifyFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const [commissionDrafts, setCommissionDrafts] = useState({});
  const [pending, setPending] = useState('');
  const [propertyFormOpen, setPropertyFormOpen] = useState(createSignal > 0);
  const [propertySaving, setPropertySaving] = useState(false);
  const [roomModal, setRoomModal] = useState({ open: false, hotelId: null, room: null });
  const [roomSaving, setRoomSaving] = useState(false);
  const [roomCache, setRoomCache] = useState({});
  const [roomLoading, setRoomLoading] = useState(null);
  const [roomError, setRoomError] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const handledFocus = useRef(null);

  const selectedHotel = hotels.find((hotel) => hotel.id === selectedHotelId) || null;

  const commissionValue = (hotel) => commissionDrafts[hotel.id] ?? String(hotel.commissionRate ?? 15);

  const loadRooms = useCallback(async (hotelId, force = false) => {
    if (!hotelId) return;
    if (!force && roomCache[hotelId]) return;
    setRoomLoading(hotelId);
    setRoomError('');
    try {
      const result = await roomAPI.getByHotel(hotelId);
      setRoomCache((current) => ({ ...current, [hotelId]: result.rooms || result.data || [] }));
    } catch (error) {
      setRoomError(error.message || 'Unable to load room inventory.');
    } finally {
      setRoomLoading(null);
    }
  }, [roomCache]);

  const openProperty = (hotel) => {
    setSelectedHotelId(hotel.id);
    loadRooms(hotel.id);
  };

  useEffect(() => {
    if (!focusRequest || focusRequest.type !== 'property' || handledFocus.current === focusRequest.nonce) return undefined;
    const frame = window.requestAnimationFrame(() => {
      handledFocus.current = focusRequest.nonce;
      const hotel = hotels.find((item) => item.id === focusRequest.id);
      if (hotel) {
        setSelectedHotelId(hotel.id);
        loadRooms(hotel.id);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusRequest, hotels, loadRooms]);

  const cities = useMemo(
    () => Array.from(new Set(hotels.map((hotel) => hotel.city).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [hotels]
  );

  const filteredHotels = useMemo(() => {
    const query = search.trim().toLowerCase();
    return hotels
      .filter((hotel) => {
        const owner = hotelOwner(hotel, users);
        const matchesQuery = !query || [hotel.name, hotel.city, hotel.address, hotel.category, owner?.name, owner?.email]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
        const status = hotel.isVerified ? 'verified' : String(hotel.verificationStatus || 'PENDING').toLowerCase();
        const matchesVerification =
          verifyFilter === 'all' ||
          (verifyFilter === 'verified' && hotel.isVerified) ||
          (verifyFilter === 'pending' && !hotel.isVerified && status !== 'rejected') ||
          (verifyFilter === 'rejected' && status === 'rejected') ||
          (verifyFilter === 'featured' && hotel.featured);
        const matchesCity = cityFilter === 'all' || hotel.city === cityFilter;
        return matchesQuery && matchesVerification && matchesCity;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return String(a.name).localeCompare(String(b.name));
        if (sortBy === 'revenue') return getHotelRevenue(b.id, bookings) - getHotelRevenue(a.id, bookings);
        if (sortBy === 'commission') return (Number(b.commissionRate) || 0) - (Number(a.commissionRate) || 0);
        if (sortBy === 'rooms') return (Number(b.roomsCount) || 0) - (Number(a.roomsCount) || 0);
        return Number(b.featured) - Number(a.featured) || new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
  }, [hotels, users, search, verifyFilter, cityFilter, sortBy, bookings]);

  const stats = useMemo(() => {
    const verified = hotels.filter((hotel) => hotel.isVerified).length;
    const pending = hotels.filter((hotel) => !hotel.isVerified).length;
    const averageCommission = hotels.length
      ? Math.round((hotels.reduce((sum, hotel) => sum + (Number(hotel.commissionRate) || 0), 0) / hotels.length) * 10) / 10
      : 0;
    return {
      total: hotels.length,
      verified,
      pending,
      averageCommission,
      rooms: hotels.reduce((sum, hotel) => sum + (Number(hotel.roomsCount) || 0), 0)
    };
  }, [hotels]);

  const run = async (key, action) => {
    setPending(key);
    try {
      await action();
    } finally {
      setPending('');
    }
  };

  const saveCommission = async (hotel) => {
    const value = Number(commissionValue(hotel));
    if (!Number.isFinite(value) || value < 0 || value > 40) {
      showToast('Commission must be between 0 and 40 percent.');
      return;
    }
    await run(`commission-${hotel.id}`, () => onSaveCommission(hotel, value));
  };

  const submitProperty = async (payload) => {
    setPropertySaving(true);
    try {
      const created = await onCreateProperty(payload);
      if (created) {
        setPropertyFormOpen(false);
        if (created.id) openProperty(created);
        return true;
      }
      return false;
    } finally {
      setPropertySaving(false);
    }
  };

  const submitRoom = async (payload) => {
    setRoomSaving(true);
    try {
      let ok;
      if (roomModal.room) {
        ok = await onUpdateRoom(roomModal.room.id, payload);
      } else {
        ok = await onCreateRoom({ ...payload, hotelId: roomModal.hotelId });
      }
      if (ok) {
        const hotelId = roomModal.hotelId;
        setRoomModal({ open: false, hotelId: null, room: null });
        await loadRooms(hotelId, true);
        return true;
      }
      return false;
    } finally {
      setRoomSaving(false);
    }
  };

  const removeProperty = async () => {
    if (!confirm) return;
    setConfirmBusy(true);
    try {
      const ok = await onDeleteHotel(confirm.hotel);
      if (ok) {
        if (selectedHotelId === confirm.hotel.id) setSelectedHotelId(null);
        setConfirm(null);
      }
    } finally {
      setConfirmBusy(false);
    }
  };

  const removeRoom = async () => {
    if (!confirm) return;
    setConfirmBusy(true);
    try {
      const ok = await onDeleteRoom(confirm.room.id);
      if (ok) {
        const hotelId = confirm.hotel.id;
        setConfirm(null);
        await loadRooms(hotelId, true);
      }
    } finally {
      setConfirmBusy(false);
    }
  };

  const exportProperties = () => {
    downloadCsv(
      `hotel-factories-properties-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { label: 'Property', value: (row) => row.name },
        { label: 'Category', key: 'category' },
        { label: 'City', key: 'city' },
        { label: 'Owner', value: (row) => hotelOwner(row, users)?.name || '' },
        { label: 'Verification', value: (row) => (row.isVerified ? 'Verified' : row.verificationStatus || 'Pending') },
        { label: 'Listing status', key: 'status' },
        { label: 'Room types', key: 'roomsCount' },
        { label: 'Bookings', key: 'bookingsCount' },
        { label: 'Gross booking value', value: (row) => getHotelRevenue(row.id, bookings) },
        { label: 'Commission %', key: 'commissionRate' },
        { label: 'Featured', value: (row) => (row.featured ? 'Yes' : 'No') }
      ],
      filteredHotels
    );
  };

  const selectedRooms = selectedHotel ? roomCache[selectedHotel.id] || [] : [];
  const selectedRevenue = selectedHotel ? getHotelRevenue(selectedHotel.id, bookings) : 0;
  const selectedBookings = selectedHotel ? bookings.filter((booking) => booking.hotelId === selectedHotel.id) : [];

  return (
    <div className="admin-fade-up">
      <PageHeader
        eyebrow="Operations"
        title="Properties"
        description="Approve hotel partners, tune commercial terms, and keep room inventory accurate across the entire portfolio."
        actions={
          <>
            <GhostButton icon="fa-file-arrow-down" onClick={exportProperties}>Export</GhostButton>
            <PrimaryButton icon="fa-plus" onClick={() => setPropertyFormOpen(true)}>Add property</PrimaryButton>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Total properties" value={formatNumber(stats.total)} icon="fa-hotel" />
        <MiniStat label="Verified & live" value={formatNumber(stats.verified)} icon="fa-circle-check" tone="sky" />
        <MiniStat label="Awaiting review" value={formatNumber(stats.pending)} icon="fa-hourglass-half" tone="amber" />
        <MiniStat label="Avg. commission" value={`${stats.averageCommission}%`} icon="fa-percent" tone="violet" hint={`${formatNumber(stats.rooms)} room types`} />
      </div>

      <Panel>
        <PanelHeader
          title="Property portfolio"
          subtitle={`${filteredHotels.length} of ${hotels.length} properties`}
          icon="fa-building"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <SearchField value={search} onChange={setSearch} placeholder="Search property, city or owner" className="w-full sm:w-64" />
              <FilterSelect
                value={verifyFilter}
                onChange={setVerifyFilter}
                ariaLabel="Filter by verification"
                options={[
                  { value: 'all', label: 'All statuses' },
                  { value: 'verified', label: 'Verified' },
                  { value: 'pending', label: 'Pending review' },
                  { value: 'rejected', label: 'Rejected' },
                  { value: 'featured', label: 'Featured only' }
                ]}
              />
              <FilterSelect
                value={cityFilter}
                onChange={setCityFilter}
                ariaLabel="Filter by city"
                options={[{ value: 'all', label: 'All cities' }, ...cities.map((city) => ({ value: city, label: city }))]}
              />
              <FilterSelect
                value={sortBy}
                onChange={setSortBy}
                ariaLabel="Sort properties"
                options={[
                  { value: 'recommended', label: 'Recommended' },
                  { value: 'revenue', label: 'Highest revenue' },
                  { value: 'commission', label: 'Highest commission' },
                  { value: 'rooms', label: 'Most room types' },
                  { value: 'name', label: 'Name A–Z' }
                ]}
              />
            </div>
          }
        />

        {filteredHotels.length === 0 ? (
          <div className="px-5 pb-6 sm:px-6">
            <EmptyState
              icon="fa-hotel"
              title="No properties match"
              description="Try adjusting the search or filters, or add a new property to the platform."
              action={<PrimaryButton icon="fa-plus" onClick={() => setPropertyFormOpen(true)}>Add property</PrimaryButton>}
            />
          </div>
        ) : (
          <TableShell>
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3 sm:px-6">Property</th>
                  <th className="px-4 py-3">Verification</th>
                  <th className="px-4 py-3">Performance</th>
                  <th className="px-4 py-3">Commission</th>
                  <th className="px-5 py-3 text-right sm:px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHotels.map((hotel) => {
                  const owner = hotelOwner(hotel, users);
                  const revenue = getHotelRevenue(hotel.id, bookings);
                  const verification = hotel.isVerified
                    ? VERIFICATION_META.APPROVED
                    : VERIFICATION_META[hotel.verificationStatus] || VERIFICATION_META.PENDING;
                  return (
                    <tr
                      key={hotel.id}
                      onClick={() => openProperty(hotel)}
                      className="group cursor-pointer transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-3.5 sm:px-6">
                        <div className="flex items-center gap-3">
                          <img src={hotel.images?.[0]} alt="" className="h-12 w-14 shrink-0 rounded-lg object-cover ring-1 ring-slate-200" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="max-w-[240px] truncate text-sm font-semibold text-slate-900">{hotel.name}</p>
                              {hotel.featured && <i className="fa-solid fa-star text-xs text-amber-400" title="Featured property" aria-label="Featured" />}
                            </div>
                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              {hotel.city} · {hotel.category} · {hotel.starRating || 4}★
                            </p>
                            <p className="mt-0.5 truncate text-xs text-slate-400">{owner?.name || 'Unassigned partner'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge tone={verification.tone} dot>{verification.label}</Badge>
                        <p className="mt-1 text-xs text-slate-400">{PROPERTY_STATUS_META[hotel.status]?.label || 'Active'}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Rooms</span>
                            <span className="text-sm font-semibold text-slate-800">{formatNumber(hotel.roomsCount)}</span>
                          </div>
                          <div>
                            <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Bookings</span>
                            <span className="text-sm font-semibold text-slate-800">{formatNumber(hotel.bookingsCount)}</span>
                          </div>
                          <div>
                            <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Revenue</span>
                            <span className="text-sm font-semibold text-slate-800">{formatCurrency(revenue, true)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-1.5" onClick={(event) => event.stopPropagation()}>
                          <div className="flex h-8 w-[76px] items-center rounded-lg border border-slate-200 bg-white px-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                            <input
                              type="number"
                              min="0"
                              max="40"
                              step="0.5"
                              value={commissionValue(hotel)}
                              onChange={(event) => setCommissionDrafts((current) => ({ ...current, [hotel.id]: event.target.value }))}
                              aria-label={`Commission for ${hotel.name}`}
                              className="w-full bg-transparent text-center text-xs font-semibold text-slate-800 outline-none"
                            />
                            <span className="text-xs font-bold text-slate-400">%</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => saveCommission(hotel)}
                            disabled={pending === `commission-${hotel.id}` || Number(commissionValue(hotel)) === Number(hotel.commissionRate)}
                            title="Save commission"
                            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <i className={`fa-solid ${pending === `commission-${hotel.id}` ? 'fa-circle-notch fa-spin' : 'fa-check'} text-xs`} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right sm:px-6" onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => run(`verify-${hotel.id}`, () => onVerify(hotel, !hotel.isVerified))}
                            disabled={pending === `verify-${hotel.id}`}
                            className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition disabled:opacity-50 ${
                              hotel.isVerified
                                ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                                : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                            }`}
                          >
                            <i className={`fa-solid ${pending === `verify-${hotel.id}` ? 'fa-circle-notch fa-spin' : hotel.isVerified ? 'fa-ban' : 'fa-check'} text-xs`} aria-hidden="true" />
                            {hotel.isVerified ? 'Revoke' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              openProperty(hotel);
                              loadRooms(hotel.id, true);
                            }}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <i className="fa-solid fa-bed text-xs" aria-hidden="true" />
                            Rooms
                          </button>
                          <button
                            type="button"
                            onClick={() => openProperty(hotel)}
                            aria-label={`View ${hotel.name}`}
                            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          >
                            <i className="fa-solid fa-chevron-right text-xs" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableShell>
        )}
      </Panel>

      <Drawer
        open={Boolean(selectedHotel)}
        onClose={() => setSelectedHotelId(null)}
        title={selectedHotel?.name || 'Property'}
        subtitle={selectedHotel ? `${selectedHotel.city} · ${selectedHotel.category} · ${selectedHotel.starRating || 4} star` : ''}
        width="max-w-3xl"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => selectedHotel && setConfirm({ type: 'hotel', hotel: selectedHotel })}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
            >
              <i className="fa-solid fa-trash-can text-xs" aria-hidden="true" /> Delete property
            </button>
            <div className="flex gap-2">
              <GhostButton onClick={() => setRoomModal({ open: true, hotelId: selectedHotel?.id, room: null })} icon="fa-bed">
                Add room
              </GhostButton>
              <GhostButton onClick={() => setSelectedHotelId(null)}>Close</GhostButton>
            </div>
          </div>
        }
      >
        {selectedHotel && (
          <div className="space-y-5">
            <div className="relative overflow-hidden rounded-lg bg-slate-900">
              <img src={selectedHotel.images?.[0]} alt="" className="h-48 w-full object-cover opacity-75" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={selectedHotel.isVerified ? 'sky' : 'amber'} dot>
                      {selectedHotel.isVerified ? 'Verified & live' : 'Pending review'}
                    </Badge>
                    {selectedHotel.featured && <Badge tone="amber"><i className="fa-solid fa-star text-xs" aria-hidden="true" /> Featured</Badge>}
                    <Badge tone="slate">{PROPERTY_STATUS_META[selectedHotel.status]?.label || 'Active'}</Badge>
                  </div>
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-white/80">
                    <i className="fa-solid fa-location-dot text-xs" aria-hidden="true" /> {selectedHotel.city}
                    <span className="text-white/40">·</span>
                    <i className="fa-solid fa-star text-xs text-amber-300" aria-hidden="true" /> {selectedHotel.rating || '—'} ({formatNumber(selectedHotel.reviewsCount)} reviews)
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => run(`verify-drawer-${selectedHotel.id}`, () => onVerify(selectedHotel, !selectedHotel.isVerified))}
                    disabled={pending === `verify-drawer-${selectedHotel.id}`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/95 px-3 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-white disabled:opacity-50"
                  >
                    <i className={`fa-solid ${selectedHotel.isVerified ? 'fa-ban' : 'fa-check'} text-xs`} aria-hidden="true" />
                    {selectedHotel.isVerified ? 'Revoke approval' : 'Approve property'}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <DrawerStat label="Room types" value={formatNumber(selectedHotel.roomsCount)} icon="fa-bed" />
              <DrawerStat label="Bookings" value={formatNumber(selectedBookings.length)} icon="fa-calendar-check" />
              <DrawerStat label="Gross revenue" value={formatCurrency(selectedRevenue, true)} icon="fa-indian-rupee-sign" />
              <DrawerStat label="Commission" value={`${selectedHotel.commissionRate ?? 0}%`} icon="fa-percent" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Panel className="p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Property details</h3>
                <div className="space-y-0.5">
                  <Detail label="Owner" value={hotelOwner(selectedHotel, users)?.name || 'Unassigned'} />
                  <Detail label="Owner email" value={hotelOwner(selectedHotel, users)?.email || '—'} />
                  <Detail label="Address" value={selectedHotel.address} />
                  <Detail label="Category" value={selectedHotel.category} />
                  <Detail label="Listing created" value={formatDate(selectedHotel.createdAt)} />
                  <Detail label="Refund policy" value={selectedHotel.cancellationPolicy?.badgeText || 'Non-refundable'} />
                </div>
              </Panel>

              <Panel className="p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Commercial controls</h3>
                <Field label="Commission rate" htmlFor="drawer-commission">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 flex-1 items-center rounded-lg border border-slate-200 bg-white px-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                      <input
                        id="drawer-commission"
                        type="number"
                        min="0"
                        max="40"
                        step="0.5"
                        value={commissionValue(selectedHotel)}
                        onChange={(event) => setCommissionDrafts((current) => ({ ...current, [selectedHotel.id]: event.target.value }))}
                        className="w-full bg-transparent text-[13px] font-semibold text-slate-800 outline-none"
                      />
                      <span className="text-xs font-bold text-slate-400">%</span>
                    </div>
                    <PrimaryButton
                      onClick={() => saveCommission(selectedHotel)}
                      disabled={pending === `commission-${selectedHotel.id}` || Number(commissionValue(selectedHotel)) === Number(selectedHotel.commissionRate)}
                      className="h-10"
                    >
                      Save
                    </PrimaryButton>
                  </div>
                </Field>

                <label className="mt-4 flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 py-2.5">
                  <span>
                    <span className="block text-xs font-bold text-slate-700">Featured property</span>
                    <span className="block text-xs text-slate-500">Highlight on the homepage</span>
                  </span>
                  <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${selectedHotel.featured ? 'bg-blue-600' : 'bg-slate-300'}`}>
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={Boolean(selectedHotel.featured)}
                      disabled={pending === `flags-${selectedHotel.id}`}
                      onChange={(event) => run(`flags-${selectedHotel.id}`, () => onUpdateFlags(selectedHotel, { featured: event.target.checked }))}
                    />
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition ${selectedHotel.featured ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                  </span>
                </label>

                <Field label="Listing status" htmlFor="drawer-status" className="mt-3">
                  <SelectInput
                    id="drawer-status"
                    value={selectedHotel.status || 'ACTIVE'}
                    disabled={pending === `flags-${selectedHotel.id}`}
                    onChange={(event) => run(`flags-${selectedHotel.id}`, () => onUpdateFlags(selectedHotel, { status: event.target.value }))}
                  >
                    <option value="ACTIVE">Active — visible on the website</option>
                    <option value="SUSPENDED">Suspended — hidden from search</option>
                    <option value="INACTIVE">Inactive — archived</option>
                  </SelectInput>
                </Field>
              </Panel>
            </div>

            <Panel>
              <PanelHeader
                title="Room categories"
                subtitle={`${selectedRooms.length} room types · ${formatNumber(selectedRooms.reduce((sum, room) => sum + (Number(room.totalInventory) || 0), 0))} units`}
                icon="fa-bed"
                action={
                  <PrimaryButton icon="fa-plus" onClick={() => setRoomModal({ open: true, hotelId: selectedHotel.id, room: null })}>
                    Add room
                  </PrimaryButton>
                }
                className="border-b border-slate-100"
              />
              <div className="p-4 sm:p-5">
                {roomLoading === selectedHotel.id ? (
                  <LoadingState label="Loading room inventory…" className="border-0 bg-transparent py-8" />
                ) : roomError ? (
                  <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">
                    <span>{roomError}</span>
                    <button type="button" onClick={() => loadRooms(selectedHotel.id, true)} className="font-bold underline">Retry</button>
                  </div>
                ) : selectedRooms.length === 0 ? (
                  <EmptyState
                    icon="fa-bed"
                    title="No room categories"
                    description="Add the first room category so this property can accept reservations."
                    action={<PrimaryButton icon="fa-plus" onClick={() => setRoomModal({ open: true, hotelId: selectedHotel.id, room: null })}>Add room</PrimaryButton>}
                  />
                ) : (
                  <div className="space-y-2.5">
                    {selectedRooms.map((room) => {
                      const status = ROOM_STATUS_META[room.status] || ROOM_STATUS_META.AVAILABLE;
                      return (
                        <div key={room.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                          <img src={room.image || selectedHotel.images?.[0]} alt="" className="h-11 w-14 shrink-0 rounded-lg object-cover ring-1 ring-slate-200" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="truncate text-xs font-semibold text-slate-900">{room.name}</p>
                              <Badge tone={status.tone}>{status.label}</Badge>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500">{room.type || 'Room'} · {room.bedType || '—'} · {room.sizeSqFt ? `${room.sizeSqFt} sq ft` : '—'} · {formatNumber(room.totalInventory)} units</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold text-slate-900">{formatCurrency(room.basePrice)}</p>
                            {room.originalPrice > room.basePrice && <p className="text-xs text-slate-400 line-through">{formatCurrency(room.originalPrice)}</p>}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setRoomModal({ open: true, hotelId: selectedHotel.id, room })}
                              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-300 hover:text-blue-600"
                              title="Edit room"
                              aria-label={`Edit ${room.name}`}
                            >
                              <i className="fa-solid fa-pen text-xs" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirm({ type: 'room', hotel: selectedHotel, room })}
                              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                              title="Delete room"
                              aria-label={`Delete ${room.name}`}
                            >
                              <i className="fa-solid fa-trash-can text-xs" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Panel>
          </div>
        )}
      </Drawer>

      <PropertyForm open={propertyFormOpen} onClose={() => setPropertyFormOpen(false)} onSubmit={submitProperty} busy={propertySaving} />
      <RoomForm
        open={roomModal.open}
        onClose={() => setRoomModal({ open: false, hotelId: null, room: null })}
        onSubmit={submitRoom}
        room={roomModal.room}
        hotel={hotels.find((hotel) => hotel.id === roomModal.hotelId) || selectedHotel}
        busy={roomSaving}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={confirm?.type === 'room' ? removeRoom : removeProperty}
        title={confirm?.type === 'room' ? 'Delete room category?' : 'Delete property?'}
        message={
          confirm?.type === 'room'
            ? `This will permanently remove "${confirm?.room?.name}" from ${confirm?.hotel?.name}. Existing bookings are not affected.`
            : `This will permanently delete "${confirm?.hotel?.name}", its room inventory and listing. Properties with active bookings cannot be deleted.`
        }
        confirmLabel={confirm?.type === 'room' ? 'Delete room' : 'Delete property'}
        busy={confirmBusy}
      />
    </div>
  );
}

function MiniStat({ label, value, icon, hint }) {
  return (
    <Panel className="flex items-center gap-3 p-3.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-400 ring-1 ring-inset ring-slate-200">
        <i className={`fa-solid ${icon} text-xs`} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="font-heading text-lg font-semibold leading-tight text-slate-900">{value}</p>
        {hint && <p className="truncate text-xs text-slate-400">{hint}</p>}
      </div>
    </Panel>
  );
}

function DrawerStat({ label, value, icon }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <i className={`fa-solid ${icon} text-xs text-blue-500`} aria-hidden="true" />
      <p className="mt-1.5 truncate font-heading text-base font-semibold leading-tight text-slate-900">{value}</p>
      <p className="truncate text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 py-1.5 last:border-0">
      <span className="shrink-0 text-xs text-slate-400">{label}</span>
      <span className="text-right text-xs font-semibold text-slate-700">{value}</span>
    </div>
  );
}
