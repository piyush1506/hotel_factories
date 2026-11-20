'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getStatusMeta } from '../../utils/helpers';
import {
  Badge,
  Drawer,
  EmptyState,
  Field,
  FilterSelect,
  GhostButton,
  Modal,
  PageHeader,
  Panel,
  PanelHeader,
  PrimaryButton,
  SearchField,
  SegmentedTabs,
  TableShell,
  TextArea
} from './AdminUI';
import {
  PAYMENT_META,
  PAYOUT_META,
  downloadCsv,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatShortDate,
  getInitials,
  percent
} from './adminUtils';

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'CHECKED_IN', label: 'In-House' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'NO_SHOW', label: 'No-Show' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'HELD', label: 'Pending' }
];

export default function AdminBookings({ bookings = [], hotels = [], onCheckIn, onCheckOut, onMarkNoShow, onCancel, focusRequest }) {
  const { verifyBookingCode } = useApp();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [hotelFilter, setHotelFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedId, setSelectedId] = useState(null);
  const [actionBusy, setActionBusy] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('Cancelled by platform administrator');
  const [cancelBusy, setCancelBusy] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [unlockBusy, setUnlockBusy] = useState(false);
  const handledFocus = useRef(null);

  const selected = bookings.find((booking) => booking.id === selectedId) || null;

  useEffect(() => {
    if (!focusRequest || focusRequest.type !== 'booking' || handledFocus.current === focusRequest.nonce) return undefined;
    const frame = window.requestAnimationFrame(() => {
      handledFocus.current = focusRequest.nonce;
      if (bookings.some((booking) => booking.id === focusRequest.id)) {
        setSelectedId(focusRequest.id);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusRequest, bookings]);

  const stats = useMemo(() => {
    const confirmed = bookings.filter((booking) => booking.status === 'CONFIRMED').length;
    const inStay = bookings.filter((booking) => ['CHECKED_IN', 'COMPLETED'].includes(booking.status)).length;
    const cancelled = bookings.filter((booking) => ['CANCELLED', 'REFUNDED'].includes(booking.status)).length;
    const paid = bookings.filter((booking) => booking.paymentStatus === 'PAID').length;
    return { confirmed, inStay, cancelled, paid };
  }, [bookings]);

  const statusCounts = useMemo(() => {
    return STATUS_TABS.reduce((result, tab) => {
      result[tab.value] = tab.value === 'all' ? bookings.length : bookings.filter((booking) => booking.status === tab.value).length;
      return result;
    }, {});
  }, [bookings]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return bookings
      .filter((booking) => {
        const matchesQuery =
          !query ||
          [booking.bookingCode, booking.guestName, booking.guestEmail, booking.guestPhone, booking.hotelName, booking.roomName]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));
        const matchesStatus = status === 'all' || booking.status === status;
        const matchesHotel = hotelFilter === 'all' || booking.hotelId === hotelFilter;
        return matchesQuery && matchesStatus && matchesHotel;
      })
      .sort((a, b) => {
        if (sortBy === 'amount') return (Number(b.totalAmount) || 0) - (Number(a.totalAmount) || 0);
        if (sortBy === 'checkin') return String(a.checkInDate || '').localeCompare(String(b.checkInDate || ''));
        return new Date(b.bookedAt || 0) - new Date(a.bookedAt || 0);
      });
  }, [bookings, search, status, hotelFilter, sortBy]);

  const revenue = bookings
    .filter((booking) => !['CANCELLED', 'EXPIRED'].includes(booking.status))
    .reduce((sum, booking) => sum + (Number(booking.totalAmount) || 0), 0);

  const checkIn = async (booking) => {
    setActionBusy(`checkin-${booking.id}`);
    try {
      await onCheckIn(booking);
    } finally {
      setActionBusy('');
    }
  };

  const checkOut = async (booking) => {
    setActionBusy(`checkout-${booking.id}`);
    try {
      if (onCheckOut) await onCheckOut(booking);
    } finally {
      setActionBusy('');
    }
  };

  const markNoShow = async (booking) => {
    setActionBusy(`noshow-${booking.id}`);
    try {
      if (onMarkNoShow) await onMarkNoShow(booking, 'Guest failed to arrive by check-in date');
    } finally {
      setActionBusy('');
    }
  };

  const cancelBooking = async () => {
    if (!cancelTarget) return;
    setCancelBusy(true);
    try {
      const ok = await onCancel(cancelTarget, cancelReason);
      if (ok) {
        setCancelTarget(null);
        setCancelReason('Cancelled by platform administrator');
      }
    } finally {
      setCancelBusy(false);
    }
  };

  const exportBookings = () => {
    downloadCsv(
      `hotel-factories-bookings-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { label: 'Booking code', key: 'bookingCode' },
        { label: 'Booked at', key: 'bookedAt' },
        { label: 'Guest', key: 'guestName' },
        { label: 'Email', key: 'guestEmail' },
        { label: 'Phone', key: 'guestPhone' },
        { label: 'Hotel', key: 'hotelName' },
        { label: 'Room', key: 'roomName' },
        { label: 'Check-in', key: 'checkInDate' },
        { label: 'Check-out', key: 'checkOutDate' },
        { label: 'Nights', key: 'nights' },
        { label: 'Amount', key: 'totalAmount' },
        { label: 'Payment', key: 'paymentStatus' },
        { label: 'Status', key: 'status' },
        { label: 'Payout', key: 'payoutStatus' }
      ],
      filtered
    );
  };

  return (
    <div className="admin-fade-up">
      <PageHeader
        eyebrow="Operations"
        title="Bookings"
        description="Monitor every reservation, verify payment and payout state, check guests in, and handle cancellations from one ledger."
        actions={
          <div className="flex items-center gap-2">
            <PrimaryButton icon="fa-key" onClick={() => setIsUnlockModalOpen(true)}>
              Unlock & Verify QR Pass
            </PrimaryButton>
            <GhostButton icon="fa-file-arrow-down" onClick={exportBookings}>Export CSV</GhostButton>
          </div>
        }
        meta={<Badge tone="sky" dot>{filtered.length} shown</Badge>}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <BookingStat label="Gross booking value" value={formatCurrency(revenue, true)} icon="fa-indian-rupee-sign" tone="sky" />
        <BookingStat label="Confirmed" value={stats.confirmed} icon="fa-circle-check" tone="sky" hint={`${stats.paid} paid`} />
        <BookingStat label="In stay / completed" value={stats.inStay} icon="fa-door-open" tone="violet" />
        <BookingStat label="Cancelled" value={stats.cancelled} icon="fa-ban" tone="rose" hint={`${percent(stats.cancelled, bookings.length)}% of total`} />
      </div>

      <Panel>
        <PanelHeader
          title="Reservation ledger"
          subtitle={`${bookings.length} total reservations`}
          icon="fa-calendar-days"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <SearchField value={search} onChange={setSearch} placeholder="Search code, guest or hotel" className="w-full sm:w-64" />
              <FilterSelect
                value={hotelFilter}
                onChange={setHotelFilter}
                ariaLabel="Filter by property"
                options={[{ value: 'all', label: 'All properties' }, ...hotels.map((hotel) => ({ value: hotel.id, label: hotel.name }))]}
              />
              <FilterSelect
                value={sortBy}
                onChange={setSortBy}
                ariaLabel="Sort bookings"
                options={[
                  { value: 'newest', label: 'Newest first' },
                  { value: 'amount', label: 'Highest amount' },
                  { value: 'checkin', label: 'Check-in date' }
                ]}
              />
            </div>
          }
        />
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pb-3 sm:px-6">
          <SegmentedTabs tabs={STATUS_TABS.map((tab) => ({ ...tab, count: statusCounts[tab.value] }))} value={status} onChange={setStatus} />
          <span className="hidden text-xs font-semibold text-slate-500 sm:inline">Click a booking to view the full folio</span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 pb-6 sm:px-6">
            <EmptyState icon="fa-calendar-xmark" title="No bookings found" description="Adjust the filters or search for a different guest, property or booking code." />
          </div>
        ) : (
          <TableShell>
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="w-[180px] min-w-[180px] px-5 py-3 sm:px-6 whitespace-nowrap">Booking</th>
                  <th className="w-[220px] min-w-[220px] px-4 py-3 whitespace-nowrap">Guest</th>
                  <th className="min-w-[240px] px-4 py-3">Property & room</th>
                  <th className="w-[160px] min-w-[160px] px-4 py-3 whitespace-nowrap">Stay</th>
                  <th className="w-[120px] min-w-[120px] px-4 py-3 text-right whitespace-nowrap">Amount</th>
                  <th className="w-[110px] min-w-[110px] px-4 py-3 whitespace-nowrap">Payment</th>
                  <th className="w-[120px] min-w-[120px] px-5 py-3 text-right sm:px-6 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((booking) => {
                  const meta = getStatusMeta(booking.status);
                  const payment = PAYMENT_META[booking.paymentStatus] || { label: booking.paymentStatus || '—', tone: 'slate' };
                  return (
                    <tr
                      key={booking.id}
                      onClick={() => setSelectedId(booking.id)}
                      className="group cursor-pointer transition hover:bg-slate-50"
                    >
                      <td className="w-[180px] min-w-[180px] px-5 py-3.5 sm:px-6 whitespace-nowrap">
                        <span className="block font-mono text-sm font-semibold text-slate-900 whitespace-nowrap tracking-tight select-all">{booking.bookingCode}</span>
                        <span className="block text-xs text-slate-500 whitespace-nowrap">{formatDateTime(booking.bookedAt)}</span>
                      </td>
                      <td className="w-[220px] min-w-[220px] px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white">{getInitials(booking.guestName)}</span>
                          <div className="min-w-0">
                            <span className="block max-w-[170px] truncate text-sm font-semibold text-slate-800" title={booking.guestName}>{booking.guestName}</span>
                            <span className="block max-w-[170px] truncate text-xs text-slate-500" title={booking.guestEmail}>{booking.guestEmail}</span>
                          </div>
                        </div>
                      </td>
                      <td className="min-w-[240px] px-4 py-3.5">
                        <span className="block max-w-[240px] truncate text-sm font-semibold text-slate-700" title={booking.hotelName}>{booking.hotelName}</span>
                        <span className="block max-w-[240px] truncate text-xs text-slate-500" title={booking.roomName}>{booking.roomName} · {booking.roomsCount || 1} room{Number(booking.roomsCount) > 1 ? 's' : ''}</span>
                      </td>
                      <td className="w-[160px] min-w-[160px] px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 whitespace-nowrap">
                          <span className="whitespace-nowrap">{formatShortDate(booking.checkInDate)}</span>
                          <i className="fa-solid fa-arrow-right text-xs text-slate-400 shrink-0" aria-hidden="true" />
                          <span className="whitespace-nowrap">{formatShortDate(booking.checkOutDate)}</span>
                        </span>
                        <span className="block text-xs text-slate-500 whitespace-nowrap">{booking.nights || 1} night{Number(booking.nights) !== 1 ? 's' : ''}</span>
                      </td>
                      <td className="w-[120px] min-w-[120px] px-4 py-3.5 text-right whitespace-nowrap">
                        <span className="block text-sm font-bold text-slate-900 whitespace-nowrap">{formatCurrency(booking.totalAmount)}</span>
                        <span className="block text-xs text-slate-500 whitespace-nowrap">{PAYOUT_META[booking.payoutStatus]?.label || booking.payoutStatus || '—'}</span>
                      </td>
                      <td className="w-[110px] min-w-[110px] px-4 py-3.5 whitespace-nowrap">
                        <Badge tone={payment.tone}>{payment.label}</Badge>
                      </td>
                      <td className="w-[120px] min-w-[120px] px-5 py-3.5 text-right sm:px-6 whitespace-nowrap">
                        <span className={`inline-flex whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${meta.tone}`}>{meta.label}</span>
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
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={selected ? `Booking ${selected.bookingCode}` : 'Booking'}
        subtitle={selected ? `${selected.hotelName} · ${selected.roomName}` : ''}
        width="max-w-2xl"
        footer={
          selected && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-500">Server-priced folio · amounts in INR</span>
              <div className="flex gap-2 flex-wrap">
                {['CONFIRMED', 'CHECKED_IN'].includes(selected.status) && (
                  <GhostButton onClick={() => setCancelTarget(selected)} disabled={actionBusy === `cancel-${selected.id}`}>
                    Cancel booking
                  </GhostButton>
                )}
                {selected.status === 'CONFIRMED' && (
                  <>
                    <GhostButton
                      icon="fa-user-slash"
                      onClick={() => markNoShow(selected)}
                      disabled={actionBusy === `noshow-${selected.id}`}
                    >
                      {actionBusy === `noshow-${selected.id}` ? 'Marking…' : 'Mark No-Show'}
                    </GhostButton>
                    <PrimaryButton icon="fa-door-open" onClick={() => checkIn(selected)} disabled={actionBusy === `checkin-${selected.id}`}>
                      {actionBusy === `checkin-${selected.id}` ? 'Checking in…' : 'Check in guest'}
                    </PrimaryButton>
                  </>
                )}
                {selected.status === 'CHECKED_IN' && (
                  <PrimaryButton icon="fa-door-closed" onClick={() => checkOut(selected)} disabled={actionBusy === `checkout-${selected.id}`}>
                    {actionBusy === `checkout-${selected.id}` ? 'Checking out…' : 'Check out guest'}
                  </PrimaryButton>
                )}
              </div>
            </div>
          )
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              {(() => {
                const meta = getStatusMeta(selected.status);
                const payment = PAYMENT_META[selected.paymentStatus] || { label: selected.paymentStatus, tone: 'slate' };
                const payout = PAYOUT_META[selected.payoutStatus] || { label: selected.payoutStatus, tone: 'slate' };
                return (
                  <>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${meta.tone}`}>
                      <i className={`fa-solid ${meta.icon} text-xs`} aria-hidden="true" /> {meta.label}
                    </span>
                    <Badge tone={payment.tone}>Payment · {payment.label}</Badge>
                    <Badge tone={payout.tone}>Payout · {payout.label}</Badge>
                  </>
                );
              })()}
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="flex gap-3 p-4">
                <img src={selected.hotelImage || hotels.find((hotel) => hotel.id === selected.hotelId)?.images?.[0]} alt="" className="h-20 w-24 shrink-0 rounded-lg object-cover ring-1 ring-slate-200" />
                <div className="min-w-0">
                  <h3 className="truncate font-heading text-base font-semibold text-slate-900">{selected.hotelName}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{selected.hotelAddress || '—'}</p>
                  <p className="mt-1.5 text-xs font-semibold text-slate-700">
                    <i className="fa-solid fa-bed mr-1 text-blue-500" aria-hidden="true" />
                    {selected.roomName} · {selected.bedType || 'Room'} · {selected.roomsCount || 1} room{Number(selected.roomsCount) > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100 sm:grid-cols-4">
                <StayCell label="Check-in" value={formatDate(selected.checkInDate)} />
                <StayCell label="Check-out" value={formatDate(selected.checkOutDate)} />
                <StayCell label="Nights" value={selected.nights || 1} />
                <StayCell label="Guests" value={`${selected.guestCount?.adults || selected.guestCount || 2} adults`} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Panel className="p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Primary guest</h3>
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-slate-900 text-sm font-semibold text-white">{getInitials(selected.guestName)}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{selected.guestName}</p>
                    <p className="truncate text-xs text-slate-500">{selected.guestEmail}</p>
                    <p className="truncate text-xs text-slate-500">{selected.guestPhone || 'No phone provided'}</p>
                  </div>
                </div>
                {selected.specialRequests && (
                  <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-inset ring-amber-100">
                    <span className="font-bold">Special request: </span>{selected.specialRequests}
                  </div>
                )}
                <div className="mt-3 border-t border-slate-100 pt-2">
                  <InfoLine label="Booked on" value={formatDateTime(selected.bookedAt)} />
                  <InfoLine label="User ID" value={<span className="font-mono text-xs">{selected.userId}</span>} />
                  {selected.paymentMethod && <InfoLine label="Payment method" value={selected.paymentMethod} />}
                </div>
              </Panel>

              <Panel className="p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Amount breakdown</h3>
                <MoneyLine label="Room tariff" value={selected.totalBaseTariff || 0} />
                {Number(selected.discountAmount) > 0 && <MoneyLine label="Coupon discount" value={-selected.discountAmount} tone="sky" />}
                <MoneyLine label="Hotel GST" value={selected.hotelGstAmount || 0} />
                <MoneyLine label="Convenience fee" value={selected.platformConvenienceFee || 0} />
                <MoneyLine label="Fee GST" value={selected.convenienceFeeGst || 0} />
                <div className="my-2 border-t border-slate-200" />
                <MoneyLine label="Guest paid" value={selected.totalAmount || 0} strong />
                <div className="mt-3 rounded-lg bg-slate-50 p-2.5">
                  <MoneyLine label="Platform commission" value={selected.platformCommissionGross || 0} small />
                  <MoneyLine label="Gateway fee" value={selected.gatewayFee || 0} small />
                  <MoneyLine label="Net hotel payout" value={selected.netHotelPayout || 0} small strong />
                </div>
              </Panel>
            </div>

            <Panel className="p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Reservation timeline</h3>
              <Timeline
                items={[
                  { label: 'Reservation created', value: selected.bookedAt, icon: 'fa-cart-plus' },
                  { label: 'Payment confirmed', value: selected.confirmedAt, icon: 'fa-credit-card' },
                  { label: 'Guest checked in', value: selected.checkedInAt, icon: 'fa-door-open' },
                  { label: 'Cancelled', value: selected.cancelledAt, icon: 'fa-ban', danger: true }
                ]}
              />
              {selected.refundStatus && selected.refundStatus !== 'NOT_REQUIRED' && (
                <div className="mt-3 flex items-center justify-between rounded-lg bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-100">
                  <span>Refund status: {selected.refundStatus.replaceAll('_', ' ').toLowerCase()}</span>
                  <span className="font-semibold">{formatCurrency(selected.refundAmount)}</span>
                </div>
              )}
            </Panel>
          </div>
        )}
      </Drawer>

      <Modal
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="Cancel reservation"
        subtitle={cancelTarget ? `${cancelTarget.bookingCode} · ${cancelTarget.guestName}` : ''}
        size="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <GhostButton onClick={() => setCancelTarget(null)} disabled={cancelBusy}>Keep booking</GhostButton>
            <button
              type="button"
              onClick={cancelBooking}
              disabled={cancelBusy}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-rose-600 px-4 text-[12px] font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
            >
              {cancelBusy && <i className="fa-solid fa-circle-notch fa-spin text-xs" aria-hidden="true" />}
              Confirm cancellation
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-800">
            Refund eligibility is calculated by the server using the property cancellation policy. This action cannot be undone.
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-600">
            <div className="flex justify-between py-0.5"><span>Guest paid</span><strong className="text-slate-900">{formatCurrency(cancelTarget?.totalAmount)}</strong></div>
            <div className="flex justify-between py-0.5"><span>Current status</span><strong className="text-slate-900">{getStatusMeta(cancelTarget?.status).label}</strong></div>
          </div>
          <Field label="Cancellation reason" htmlFor="cancel-reason">
            <TextArea id="cancel-reason" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} rows={3} />
          </Field>
        </div>
      </Modal>

      <Modal
        open={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        title="Admin Key Decryptor — Secure QR Pass"
        footer={
          <div className="flex justify-end gap-2">
            <GhostButton onClick={() => setIsUnlockModalOpen(false)}>Cancel</GhostButton>
            <PrimaryButton
              icon="fa-unlock-keyhole"
              busy={unlockBusy}
              onClick={async () => {
                if (!passInput.trim()) return;
                setUnlockBusy(true);
                try {
                  await verifyBookingCode(passInput.trim());
                  setIsUnlockModalOpen(false);
                  setPassInput('');
                } finally {
                  setUnlockBusy(false);
                }
              }}
            >
              Decrypt Pass via Secret Key
            </PrimaryButton>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-3 text-xs leading-relaxed text-sky-800">
            <i className="fa-solid fa-shield-halved mr-1.5 text-sky-600"></i>
            Paste the raw encrypted pass token (<code className="font-mono font-bold">HF1.iv.cipher.authTag</code>), a reservation code (<code className="font-mono font-bold">HF-XXXXXX</code>), or scan the guest&apos;s QR code. The server will use the secret AES-256 vault key to decrypt, authenticate, and display verified guest details.
          </div>
          <Field label="Encrypted Vault Token or Reservation Code" htmlFor="qr-pass-input">
            <TextArea
              id="qr-pass-input"
              value={passInput}
              onChange={(e) => setPassInput(e.target.value)}
              placeholder="e.g. HF1.s3cr3t... or HF-102938 or paste scanned QR content"
              rows={3}
              className="font-mono text-xs"
            />
          </Field>
          {bookings.length > 0 && bookings[0].vaultToken && (
            <div className="rounded-md bg-slate-50 p-2.5 text-xs text-slate-600 border border-slate-200">
              <span className="font-medium text-slate-700">Quick test with latest booking ({bookings[0].bookingCode}):</span>
              <button
                type="button"
                className="mt-1 block text-left text-sky-600 hover:text-sky-700 font-mono text-[11px] truncate w-full underline"
                onClick={() => setPassInput(bookings[0].vaultToken)}
              >
                Load encrypted token for {bookings[0].guestName} ({bookings[0].bookingCode})
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

function BookingStat({ label, value, icon, hint }) {
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

function StayCell({ label, value }) {
  return (
    <div className="px-3 py-2.5">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-xs font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-right text-xs font-semibold text-slate-700">{value}</span>
    </div>
  );
}

function MoneyLine({ label, value, strong = false, small = false, tone }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${small ? 'py-0.5 text-xs' : 'py-1 text-xs'}`}>
      <span className="text-slate-500">{label}</span>
      <span className={`${strong ? 'font-semibold text-slate-900' : 'font-semibold text-slate-700'} ${tone === 'rose' ? 'text-rose-600' : ''}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function Timeline({ items }) {
  const visible = items.filter((item) => item.value);
  if (visible.length === 0) return <p className="text-xs text-slate-400">No timeline events yet.</p>;
  return (
    <div className="space-y-0">
      {visible.map((item, index) => (
        <div key={item.label} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className={`grid h-7 w-7 place-items-center rounded-full text-xs ${item.danger ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-500'}`}>
              <i className={`fa-solid ${item.icon}`} aria-hidden="true" />
            </span>
            {index < visible.length - 1 && <span className="h-5 w-px bg-slate-200" />}
          </div>
          <div className="pb-3 pt-1">
            <p className="text-xs font-bold text-slate-700">{item.label}</p>
            <p className="text-xs text-slate-400">{formatDateTime(item.value)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
