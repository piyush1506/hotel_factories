'use client';

import React, { useMemo, useState } from 'react';
import {
  Avatar,
  Badge,
  EmptyState,
  GhostButton,
  PageHeader,
  Panel,
  PanelHeader,
  SegmentedTabs,
  StatCard
} from './AdminUI';
import {
  downloadCsv,
  formatCurrency,
  formatDate,
  formatNumber,
  monthLabel,
  monthLabelLong,
  percent
} from './adminUtils';

const RANGE_OPTIONS = [
  { value: '30', label: '30 days', days: 30 },
  { value: '90', label: '90 days', days: 90 },
  { value: '365', label: '12 months', days: 365 },
  { value: 'all', label: 'All time', days: null }
];

const STATUS_SEGMENTS = [
  { key: 'confirmed', label: 'Confirmed', color: '#2563eb' },
  { key: 'stay', label: 'In stay / completed', color: '#94a3b8' },
  { key: 'cancelled', label: 'Cancelled / refunded', color: '#dc2626' },
  { key: 'other', label: 'Held / expired', color: '#e2e8f0' }
];

const PAYMENT_LABELS = {
  PAID: 'Paid',
  PENDING: 'Pending',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
  PARTIALLY_REFUNDED: 'Partially refunded'
};

const PAYMENT_TONES = {
  PAID: 'bg-emerald-400',
  PENDING: 'bg-amber-400',
  FAILED: 'bg-rose-400',
  REFUNDED: 'bg-slate-400',
  PARTIALLY_REFUNDED: 'bg-blue-600'
};

const REVENUE_EXCLUDED = new Set(['CANCELLED', 'EXPIRED', 'REFUNDED']);

function parseDate(value) {
  if (!value) return null;
  const raw = String(value);
  const date = new Date(raw.length === 10 ? `${raw}T00:00:00` : raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function bookingDate(booking) {
  return parseDate(booking.bookedAt) || parseDate(booking.checkInDate);
}

function dayStart(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function dayEnd(date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function monthKey(date) {
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function guestCount(booking) {
  const raw = booking.guestCount;
  if (typeof raw === 'number') return raw;
  if (raw && typeof raw === 'object') return Number(raw.adults) || 1;
  return 1;
}

function isRevenueBooking(booking) {
  return !REVENUE_EXCLUDED.has(booking.status);
}

function sumBy(list, selector) {
  return list.reduce((total, item) => total + (Number(selector(item)) || 0), 0);
}

function delta(current, previous) {
  if (previous === null || previous === undefined) return null;
  if (!previous) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function summarize(list) {
  const revenueBookings = list.filter(isRevenueBooking);
  const revenue = sumBy(revenueBookings, (booking) => booking.totalAmount);
  const commission = sumBy(revenueBookings, (booking) => booking.platformCommissionGross);
  const convenienceFees = sumBy(revenueBookings, (booking) => booking.platformConvenienceFee);
  const gatewayFees = sumBy(revenueBookings, (booking) => booking.gatewayFee);
  const tax = sumBy(revenueBookings, (booking) => (Number(booking.hotelGstAmount) || 0) + (Number(booking.convenienceFeeGst) || 0));
  const roomTariff = sumBy(revenueBookings, (booking) => booking.totalBaseTariff);
  const discounts = sumBy(revenueBookings, (booking) => booking.discountAmount);
  const payouts = sumBy(revenueBookings, (booking) => booking.netHotelPayout);
  const tds = sumBy(revenueBookings, (booking) => booking.tdsDeduction);
  const roomNights = sumBy(revenueBookings, (booking) => (Number(booking.nights) || 1) * (Number(booking.roomsCount) || 1));
  const guests = sumBy(revenueBookings, guestCount);
  const cancelled = list.filter((booking) => ['CANCELLED', 'REFUNDED'].includes(booking.status)).length;
  const paid = list.filter((booking) => booking.paymentStatus === 'PAID').length;

  return {
    revenue,
    commission,
    convenienceFees,
    gatewayFees,
    tax,
    roomTariff,
    discounts,
    payouts,
    tds,
    roomNights,
    guests,
    cancelled,
    paid,
    netProfit: commission + convenienceFees - gatewayFees,
    bookingsCount: list.length,
    revenueBookingsCount: revenueBookings.length,
    averageValue: revenueBookings.length ? revenue / revenueBookings.length : 0,
    cancellationRate: list.length ? (cancelled / list.length) * 100 : 0
  };
}

function buildMonthSeries(list, start, reference) {
  const end = new Date(reference.getFullYear(), reference.getMonth(), 1);
  let cursor;
  if (start) {
    cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  } else {
    const dated = list.map(bookingDate).filter(Boolean).sort((a, b) => a - b);
    const earliest = dated[0] || end;
    cursor = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
  }

  const span = (end.getFullYear() - cursor.getFullYear()) * 12 + (end.getMonth() - cursor.getMonth());
  if (span > 11) cursor = new Date(end.getFullYear(), end.getMonth() - 11, 1);

  const keys = [];
  let pointer = cursor;
  while (pointer <= end) {
    keys.push(monthKey(pointer));
    pointer = new Date(pointer.getFullYear(), pointer.getMonth() + 1, 1);
  }

  return keys.map((key) => {
    const monthBookings = list.filter((booking) => monthKey(bookingDate(booking)) === key);
    const revenueBookings = monthBookings.filter(isRevenueBooking);
    return {
      month: key,
      revenue: sumBy(revenueBookings, (booking) => booking.totalAmount),
      commission: sumBy(revenueBookings, (booking) => booking.platformCommissionGross),
      bookings: monthBookings.length,
      cancellations: monthBookings.filter((booking) => ['CANCELLED', 'REFUNDED'].includes(booking.status)).length
    };
  });
}

function buildCityStats(list, hotelMap) {
  const map = new Map();
  list.filter(isRevenueBooking).forEach((booking) => {
    const city = booking.hotelCity || hotelMap.get(booking.hotelId)?.city || 'Other';
    const current = map.get(city) || { city, revenue: 0, bookings: 0, roomNights: 0 };
    current.revenue += Number(booking.totalAmount) || 0;
    current.bookings += 1;
    current.roomNights += (Number(booking.nights) || 1) * (Number(booking.roomsCount) || 1);
    map.set(city, current);
  });
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}

function buildPropertyStats(list, hotelMap) {
  const map = new Map();
  list.filter(isRevenueBooking).forEach((booking) => {
    const hotel = hotelMap.get(booking.hotelId);
    const current = map.get(booking.hotelId) || {
      id: booking.hotelId,
      name: booking.hotelName || hotel?.name || 'Unknown property',
      city: booking.hotelCity || hotel?.city || '',
      image: booking.hotelImage || hotel?.images?.[0] || '',
      revenue: 0,
      bookings: 0,
      commission: 0,
      roomNights: 0
    };
    current.revenue += Number(booking.totalAmount) || 0;
    current.commission += Number(booking.platformCommissionGross) || 0;
    current.bookings += 1;
    current.roomNights += (Number(booking.nights) || 1) * (Number(booking.roomsCount) || 1);
    map.set(booking.hotelId, current);
  });
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}

function buildGuestStats(list) {
  const map = new Map();
  list.filter(isRevenueBooking).forEach((booking) => {
    const key = booking.guestEmail || booking.userId || booking.guestName;
    const current = map.get(key) || {
      key,
      name: booking.guestName || 'Guest',
      email: booking.guestEmail || '',
      spend: 0,
      trips: 0,
      lastStay: null
    };
    current.spend += Number(booking.totalAmount) || 0;
    current.trips += 1;
    const stay = parseDate(booking.checkInDate) || bookingDate(booking);
    if (stay && (!current.lastStay || stay > current.lastStay)) current.lastStay = stay;
    map.set(key, current);
  });
  return [...map.values()].sort((a, b) => b.spend - a.spend);
}

export default function AdminReports({ bookings = [], hotels = [], metrics, asOf, onNavigate }) {
  const [range, setRange] = useState('90');
  const reference = useMemo(() => {
    const date = asOf ? new Date(asOf) : new Date();
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }, [asOf]);

  const rangeOption = RANGE_OPTIONS.find((option) => option.value === range) || RANGE_OPTIONS[1];
  const bounds = useMemo(() => {
    const end = dayEnd(reference);
    if (!rangeOption.days) return { start: null, end, previous: null };
    const start = dayStart(addDays(end, -(rangeOption.days - 1)));
    const previousEnd = new Date(start.getTime() - 1);
    const previousStart = dayStart(addDays(previousEnd, -(rangeOption.days - 1)));
    return { start, end, previous: { start: previousStart, end: previousEnd } };
  }, [reference, rangeOption]);

  const filtered = useMemo(() => {
    return bookings.filter((booking) => {
      const date = bookingDate(booking);
      if (!bounds.start) return true;
      return Boolean(date) && date >= bounds.start && date <= bounds.end;
    });
  }, [bookings, bounds]);

  const previousBookings = useMemo(() => {
    if (!bounds.previous) return [];
    return bookings.filter((booking) => {
      const date = bookingDate(booking);
      return Boolean(date) && date >= bounds.previous.start && date <= bounds.previous.end;
    });
  }, [bookings, bounds]);

  const summary = useMemo(() => summarize(filtered), [filtered]);
  const previous = useMemo(() => (bounds.previous ? summarize(previousBookings) : null), [bounds.previous, previousBookings]);

  const hotelMap = useMemo(() => new Map(hotels.map((hotel) => [hotel.id, hotel])), [hotels]);
  const monthSeries = useMemo(() => buildMonthSeries(filtered, bounds.start, reference), [filtered, bounds.start, reference]);
  const cityStats = useMemo(() => buildCityStats(filtered, hotelMap), [filtered, hotelMap]);
  const propertyStats = useMemo(() => buildPropertyStats(filtered, hotelMap), [filtered, hotelMap]);
  const guestStats = useMemo(() => buildGuestStats(filtered), [filtered]);

  const statusSplit = useMemo(() => {
    const confirmed = filtered.filter((booking) => booking.status === 'CONFIRMED').length;
    const stay = filtered.filter((booking) => ['CHECKED_IN', 'COMPLETED'].includes(booking.status)).length;
    const cancelled = filtered.filter((booking) => ['CANCELLED', 'REFUNDED'].includes(booking.status)).length;
    const other = Math.max(0, filtered.length - confirmed - stay - cancelled);
    return [
      { ...STATUS_SEGMENTS[0], count: confirmed },
      { ...STATUS_SEGMENTS[1], count: stay },
      { ...STATUS_SEGMENTS[2], count: cancelled },
      { ...STATUS_SEGMENTS[3], count: other }
    ].filter((segment) => segment.count > 0);
  }, [filtered]);

  const paymentSplit = useMemo(() => {
    const map = new Map();
    filtered.forEach((booking) => {
      const key = booking.paymentStatus || 'UNKNOWN';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()]
      .map(([key, count]) => ({
        key,
        label: PAYMENT_LABELS[key] || key,
        count,
        amount: sumBy(filtered.filter((booking) => (booking.paymentStatus || 'UNKNOWN') === key && isRevenueBooking(booking)), (booking) => booking.totalAmount)
      }))
      .sort((a, b) => b.count - a.count);
  }, [filtered]);

  const chartMax = Math.max(...monthSeries.map((month) => month.revenue), 1);
  const chartTotal = monthSeries.reduce((sum, month) => sum + month.revenue, 0);
  const bestMonth = monthSeries.reduce((best, month) => (!best || month.revenue > best.revenue ? month : best), null);
  const topCities = cityStats.slice(0, 6);
  const otherCities = cityStats.slice(6);
  const otherCityStats = otherCities.reduce(
    (total, city) => ({
      revenue: total.revenue + city.revenue,
      bookings: total.bookings + city.bookings,
      roomNights: total.roomNights + city.roomNights
    }),
    { revenue: 0, bookings: 0, roomNights: 0 }
  );
  const maxCityRevenue = Math.max(topCities[0]?.revenue || 0, 1);
  const topProperties = propertyStats.slice(0, 5);
  const topGuests = guestStats.slice(0, 5);
  const takeRate = summary.revenue ? percent(summary.netProfit, summary.revenue) : 0;
  const daysInRange = rangeOption.days || (bounds.start ? Math.round((bounds.end - bounds.start) / 86400000) + 1 : null);

  const donutGradient = (() => {
    if (!filtered.length) return 'conic-gradient(#e2e8f0 0% 100%)';
    let cursor = 0;
    const stops = statusSplit.map((segment) => {
      const start = cursor;
      cursor += (segment.count / filtered.length) * 100;
      return `${segment.color} ${start}% ${cursor}%`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  })();

  const exportReport = () => {
    const rows = [
      { section: 'Summary', metric: 'Period', value: rangeOption.label, bookings: filtered.length },
      { section: 'Summary', metric: 'Gross booking value', value: Math.round(summary.revenue), bookings: summary.revenueBookingsCount },
      { section: 'Summary', metric: 'Platform net profit', value: Math.round(summary.netProfit), bookings: '' },
      { section: 'Summary', metric: 'Average booking value', value: Math.round(summary.averageValue), bookings: '' },
      { section: 'Summary', metric: 'Cancellation rate (%)', value: Math.round(summary.cancellationRate * 10) / 10, bookings: summary.cancelled },
      { section: 'Summary', metric: 'Room-nights sold', value: summary.roomNights, bookings: summary.bookingsCount },
      ...monthSeries.map((month) => ({
        section: 'Monthly trend',
        metric: monthLabelLong(month.month),
        value: Math.round(month.revenue),
        bookings: month.bookings
      })),
      ...cityStats.map((city) => ({
        section: 'City performance',
        metric: city.city,
        value: Math.round(city.revenue),
        bookings: city.bookings
      })),
      ...propertyStats.map((property) => ({
        section: 'Property performance',
        metric: [property.name, property.city].filter(Boolean).join(' · '),
        value: Math.round(property.revenue),
        bookings: property.bookings
      }))
    ];
    downloadCsv(
      `hotel-factories-report-${range}-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { label: 'Section', key: 'section' },
        { label: 'Metric', key: 'metric' },
        { label: 'Value (INR)', key: 'value' },
        { label: 'Bookings', key: 'bookings' }
      ],
      rows
    );
  };

  return (
    <div className="admin-fade-up">
      <PageHeader
        eyebrow="Overview"
        title="Reports & insights"
        description="Compare performance across periods, find the destinations driving revenue and understand the guests behind every booking."
        actions={
          <>
            <GhostButton icon="fa-calendar-check" onClick={() => onNavigate('bookings')}>Open bookings</GhostButton>
            <GhostButton icon="fa-file-arrow-down" onClick={exportReport}>Export report</GhostButton>
          </>
        }
        meta={<Badge tone="sky" dot>Period comparison</Badge>}
      />

      <Panel className="mb-5 flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedTabs tabs={RANGE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))} value={range} onChange={setRange} />
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-slate-500">
          <i className="fa-regular fa-calendar text-slate-400" aria-hidden="true" />
          <span>{bounds.start ? `${formatDate(bounds.start)} – ${formatDate(reference)}` : `All bookings through ${formatDate(reference)}`}</span>
          <span className="text-slate-300">·</span>
          <span>{formatNumber(filtered.length)} bookings</span>
          {bounds.previous && (
            <>
              <span className="text-slate-300">·</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">vs previous {daysInRange} days</span>
            </>
          )}
        </div>
      </Panel>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Gross booking value"
          value={formatCurrency(summary.revenue, true)}
          icon="fa-indian-rupee-sign"
          tone="sky"
          hint={`${formatNumber(summary.revenueBookingsCount)} revenue-bearing stays`}
          trend={previous ? delta(summary.revenue, previous.revenue) : undefined}
        />
        <StatCard
          label="Platform net profit"
          value={formatCurrency(summary.netProfit, true)}
          icon="fa-chart-line"
          tone="sky"
          hint={`${takeRate}% take rate · commission + fees`}
          trend={previous ? delta(summary.netProfit, previous.netProfit) : undefined}
        />
        <StatCard
          label="Total bookings"
          value={formatNumber(summary.bookingsCount)}
          icon="fa-calendar-check"
          tone="violet"
          hint={`${formatNumber(summary.paid)} paid · ${summary.cancelled} cancelled`}
          trend={previous ? delta(summary.bookingsCount, previous.bookingsCount) : undefined}
        />
        <StatCard
          label="Average booking value"
          value={formatCurrency(summary.averageValue, true)}
          icon="fa-tag"
          tone="amber"
          hint={`${formatNumber(summary.roomNights)} room-nights sold`}
          trend={previous ? delta(summary.averageValue, previous.averageValue) : undefined}
        />
      </div>

      {filtered.length === 0 && (
        <div className="mb-5 flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2">
            <i className="fa-solid fa-circle-info" aria-hidden="true" />
            No bookings were recorded in this period. Switch to all time to see the complete platform history.
          </span>
          <button type="button" onClick={() => setRange('all')} className="shrink-0 self-start rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 sm:self-auto">
            View all time
          </button>
        </div>
      )}

      <div className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
        <Panel className="xl:col-span-8">
          <PanelHeader
            title="Revenue trend"
            subtitle="Gross booking value and reservation volume by month"
            icon="fa-chart-column"
            action={
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-blue-600" /> Revenue</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-400" /> Bookings</span>
              </div>
            }
          />
          <div className="px-5 pb-5 sm:px-6">
            <div className="mb-5 flex flex-wrap items-end gap-x-8 gap-y-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">Revenue in period</p>
                <p className="font-heading text-xl font-semibold tracking-tight text-slate-900">{formatCurrency(chartTotal)}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">Best month</p>
                <p className="text-xs font-semibold text-slate-800">
                  {bestMonth && bestMonth.revenue > 0 ? monthLabelLong(bestMonth.month) : '—'}
                  {bestMonth && bestMonth.revenue > 0 && <span className="ml-1 text-xs font-semibold text-slate-400">· {formatCurrency(bestMonth.revenue, true)}</span>}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">Commission earned</p>
                <p className="text-xs font-semibold text-slate-900">{formatCurrency(summary.commission, true)}</p>
              </div>
            </div>

            {monthSeries.length === 0 ? (
              <EmptyState icon="fa-chart-column" title="No revenue data" description="Revenue will appear here once bookings are recorded in the selected period." />
            ) : (
              <div className="relative h-[230px]">
                <div className="absolute inset-x-0 bottom-[38px] top-0 flex flex-col justify-between">
                  {[0, 1, 2, 3].map((line) => (
                    <div key={line} className="border-t border-dashed border-slate-100" />
                  ))}
                </div>
                <div className="relative flex h-full items-stretch gap-2 sm:gap-3">
                  {monthSeries.map((month) => {
                    const height = month.revenue > 0 ? Math.max(5, Math.round((month.revenue / chartMax) * 100)) : 2;
                    return (
                      <div key={month.month} className="group flex h-full min-w-0 flex-1 flex-col items-center">
                        <div className="relative flex w-full flex-1 items-end justify-center">
                          <div
                            role="img"
                            tabIndex={0}
                            aria-label={`${monthLabelLong(month.month)}: ${formatCurrency(month.revenue)} from ${month.bookings} bookings`}
                            className={`relative w-full max-w-[54px] rounded-t-lg transition-all duration-300 ${
                              month.revenue > 0
                                ? 'bg-blue-600 group-hover:bg-blue-700'
                                : 'bg-slate-100'
                            }`}
                            style={{ height: `${height}%` }}
                          >
                            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-xs font-bold text-white shadow-lg group-hover:block group-focus-within:block">
                              {formatCurrency(month.revenue, true)} · {month.bookings} booking{month.bookings === 1 ? '' : 's'}
                            </span>
                            <span className="absolute inset-x-0 -top-4 hidden text-center text-xs font-semibold text-slate-500 group-hover:block group-focus-within:block">
                              {month.bookings} bkgs
                            </span>
                          </div>
                        </div>
                        <span className="mt-1.5 block text-xs font-bold text-slate-400">{monthLabel(month.month)}</span>
                        <span className={`mt-0.5 block text-xs font-semibold ${month.revenue > 0 ? 'text-slate-600' : 'text-slate-300'}`}>
                          {month.revenue > 0 ? formatCurrency(month.revenue, true) : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Panel>

        <Panel className="xl:col-span-4">
          <PanelHeader title="Reservation outcomes" subtitle="Status mix for the selected period" icon="fa-chart-pie" />
          <div className="flex flex-col items-center px-5 pb-5 sm:px-6">
            <div
              className="relative grid h-40 w-40 place-items-center rounded-full"
              style={{ background: donutGradient }}
              role="img"
              aria-label={`${filtered.length} bookings in the selected period`}
            >
              <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center shadow-[inset_0_0_0_1px_rgba(226,232,240,0.8)]">
                <div>
                  <span className="block font-heading text-2xl font-semibold leading-none text-slate-900">{formatNumber(filtered.length)}</span>
                  <span className="mt-1 block text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Bookings</span>
                </div>
              </div>
            </div>
            <div className="mt-5 w-full space-y-2.5">
              {statusSplit.length === 0 ? (
                <p className="text-center text-xs text-slate-400">No booking activity in this period.</p>
              ) : (
                statusSplit.map((segment) => (
                  <div key={segment.key} className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: segment.color }} />
                    <span className="flex-1 text-slate-500">{segment.label}</span>
                    <span className="font-semibold text-slate-800">{segment.count}</span>
                    <span className="w-9 text-right text-xs text-slate-400">{percent(segment.count, filtered.length)}%</span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 w-full rounded-lg bg-slate-50 p-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Cancellation rate</span>
                <span className="font-semibold text-rose-600">{summary.cancellationRate.toFixed(1)}%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-rose-400" style={{ width: `${Math.min(100, summary.cancellationRate)}%` }} />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                {summary.cancelled} of {filtered.length} reservations were cancelled or refunded.
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
        <Panel className="xl:col-span-7">
          <PanelHeader
            title="Destination performance"
            subtitle="Revenue contribution by city"
            icon="fa-location-dot"
            action={<span className="text-xs font-bold text-slate-400">{cityStats.length} cities</span>}
          />
          <div className="px-5 pb-5 sm:px-6">
            {topCities.length === 0 ? (
              <EmptyState icon="fa-location-dot" title="No destination data" description="City performance appears once bookings are recorded in the selected period." />
            ) : (
              <div className="space-y-3.5">
                {topCities.map((city, index) => (
                  <div key={city.city}>
                    <div className="mb-1 flex items-center gap-2 text-xs">
                      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md text-xs font-semibold ${index === 0 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-bold text-slate-700">{city.city}</span>
                      <span className="text-xs text-slate-400">{city.bookings} bookings</span>
                      <span className="w-16 text-right font-semibold text-slate-800">{formatCurrency(city.revenue, true)}</span>
                    </div>
                    <div className="ml-7 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(4, Math.round((city.revenue / maxCityRevenue) * 100))}%` }} />
                    </div>
                  </div>
                ))}
                {otherCities.length > 0 && (
                  <div className="flex items-center gap-2 border-t border-slate-100 pt-3 text-xs">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-400">
                      <i className="fa-solid fa-ellipsis text-xs" aria-hidden="true" />
                    </span>
                    <span className="flex-1 font-semibold text-slate-500">{otherCities.length} other cities</span>
                    <span className="text-slate-400">{otherCityStats.bookings} bookings</span>
                    <span className="w-16 text-right font-semibold text-slate-600">{formatCurrency(otherCityStats.revenue, true)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </Panel>

        <Panel className="xl:col-span-5">
          <PanelHeader title="Revenue composition" subtitle="Where every rupee goes" icon="fa-scale-balanced" />
          <div className="px-5 pb-5 sm:px-6">
            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Guest payments</p>
                  <p className="font-heading text-xl font-semibold tracking-tight text-slate-900">{formatCurrency(summary.revenue)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Platform take</p>
                  <p className="font-heading text-lg font-semibold tracking-tight text-slate-900">{takeRate}%</p>
                </div>
              </div>
              <div className="mt-2.5 flex h-2 overflow-hidden rounded-full bg-white">
                <span className="bg-blue-600" style={{ width: `${Math.min(100, takeRate)}%` }} />
                <span className="bg-slate-200" style={{ width: `${Math.min(100, Math.max(0, 100 - takeRate))}%` }} />
              </div>
            </div>
            <div className="space-y-1">
              <ReportRow label="Room tariff" value={summary.roomTariff} />
              <ReportRow label="Coupon discounts" value={-summary.discounts} tone={summary.discounts > 0 ? 'rose' : undefined} />
              <ReportRow label="GST collected" value={summary.tax} />
              <ReportRow label="Convenience fees" value={summary.convenienceFees} />
              <div className="my-2 border-t border-slate-200" />
              <ReportRow label="Platform commission" value={summary.commission} />
              <ReportRow label="Gateway fees" value={-summary.gatewayFees} tone="rose" />
              <ReportRow label="Net platform profit" value={summary.netProfit} strong />
              <div className="mt-3 rounded-lg bg-slate-50 p-3">
                <ReportRow label="Hotel payouts" value={summary.payouts} small />
                <ReportRow label="TDS deducted" value={summary.tds} small />
              </div>
            </div>
            {paymentSplit.length > 0 && (
              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Payment mix</p>
                <div className="space-y-2">
                  {paymentSplit.map((payment) => (
                    <div key={payment.key} className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${PAYMENT_TONES[payment.key] || 'bg-slate-300'}`} />
                      <span className="flex-1 text-xs font-semibold text-slate-500">{payment.label}</span>
                      <span className="text-xs font-semibold text-slate-700">{payment.count}</span>
                      <span className="w-16 text-right text-xs text-slate-400">{formatCurrency(payment.amount, true)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <Panel className="xl:col-span-7">
          <PanelHeader
            title="Property leaderboard"
            subtitle="Top performers by gross booking value"
            icon="fa-trophy"
            action={<button type="button" onClick={() => onNavigate('properties')} className="text-xs font-semibold text-blue-600 transition hover:text-blue-700">Manage →</button>}
          />
          <div className="px-3 pb-3">
            {topProperties.length === 0 ? (
              <div className="px-3 py-5 text-center text-xs text-slate-400">No property performance data in this period.</div>
            ) : (
              topProperties.map((property, index) => (
                <div key={property.id} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 transition hover:bg-slate-50">
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md text-xs font-semibold ${index === 0 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {index + 1}
                  </span>
                  {property.image ? (
                    <img src={property.image} alt="" className="h-9 w-11 shrink-0 rounded-lg object-cover ring-1 ring-slate-200" />
                  ) : (
                    <span className="grid h-9 w-11 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs text-slate-400">
                      <i className="fa-solid fa-hotel" aria-hidden="true" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-slate-800">{property.name}</span>
                    <span className="block text-xs text-slate-400">
                      {property.city || '—'} · {property.bookings} bookings · {property.roomNights} room-nights
                    </span>
                    <span className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-slate-100">
                      <span className="block h-full rounded-full bg-blue-600" style={{ width: `${Math.max(4, Math.round((property.revenue / Math.max(topProperties[0]?.revenue || 1, 1)) * 100))}%` }} />
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-xs font-semibold text-slate-900">{formatCurrency(property.revenue, true)}</span>
                    <span className="block text-xs text-slate-500">{formatCurrency(property.commission, true)} commission</span>
                  </span>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel className="xl:col-span-5">
          <PanelHeader
            title="Top guests"
            subtitle="Highest lifetime value in this period"
            icon="fa-crown"
            action={<button type="button" onClick={() => onNavigate('customers')} className="text-xs font-semibold text-blue-600 transition hover:text-blue-700">View users →</button>}
          />
          <div className="px-3 pb-3">
            {topGuests.length === 0 ? (
              <div className="px-3 py-5 text-center text-xs text-slate-400">No guest activity in this period.</div>
            ) : (
              topGuests.map((guest, index) => (
                <div key={guest.key} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 transition hover:bg-slate-50">
                  <span className="w-4 shrink-0 text-center text-xs font-semibold text-slate-400">{index + 1}</span>
                  <Avatar name={guest.name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-slate-800">{guest.name}</span>
                    <span className="block truncate text-xs text-slate-400">
                      {guest.trips} stay{guest.trips === 1 ? '' : 's'}
                      {guest.lastStay ? ` · last ${formatDate(guest.lastStay, { day: 'numeric', month: 'short' })}` : ''}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-xs font-semibold text-slate-900">{formatCurrency(guest.spend, true)}</span>
                    <span className="block text-xs text-slate-400">lifetime value</span>
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="mx-3 mb-3 mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-500">
            <i className="fa-solid fa-circle-info mr-1" aria-hidden="true" />
            Guest value reflects gross booking value for the selected period and excludes cancelled stays.
          </div>
        </Panel>
      </div>

      <p className="mt-5 text-right text-xs text-slate-400">
        {metrics?.counts?.totalBookings ? `${formatNumber(metrics.counts.totalBookings)} bookings on the platform all-time` : 'Platform analytics'} · Generated {formatDate(reference, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
      </p>
    </div>
  );
}

function ReportRow({ label, value, strong = false, small = false, tone }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${small ? 'py-0.5 text-xs' : 'py-1 text-xs'}`}>
      <span className="text-slate-500">{label}</span>
      <span className={`${strong ? 'font-semibold text-slate-900' : 'font-semibold text-slate-700'} ${tone === 'rose' ? 'text-rose-600' : ''}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}
