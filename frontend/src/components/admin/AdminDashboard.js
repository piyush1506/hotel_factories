'use client';

import React, { useMemo } from 'react';
import { getStatusMeta } from '../../utils/helpers';
import {
  Badge,
  EmptyState,
  GhostButton,
  PageHeader,
  Panel,
  PanelHeader,
  PrimaryButton,
  StatCard,
  TableShell
} from './AdminUI';
import {
  downloadCsv,
  formatCurrency,
  formatDate,
  formatNumber,
  formatShortDate,
  monthLabel,
  monthLabelLong,
  percent
} from './adminUtils';

const STATUS_COLORS = {
  confirmed: '#2563eb',
  stay: '#94a3b8',
  cancelled: '#dc2626',
  other: '#e2e8f0'
};

function monthTrend(trends, key) {
  if (!Array.isArray(trends) || trends.length < 2) return null;
  const sorted = [...trends].sort((a, b) => String(a.month).localeCompare(String(b.month)));
  const current = Number(sorted[sorted.length - 1]?.[key]) || 0;
  const previous = Number(sorted[sorted.length - 2]?.[key]) || 0;
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export default function AdminDashboard({ metrics, hotels = [], bookings = [], users = [], payoutOverview, coupons = [], reviews = [], asOf, onNavigate, onQuickAction }) {
  const financials = metrics?.financials || {};
  const counts = metrics?.counts || {};
  const trends = useMemo(() => metrics?.monthlyTrends || [], [metrics]);

  const sortedBookings = useMemo(
    () => [...bookings].sort((a, b) => new Date(b.bookedAt || 0) - new Date(a.bookedAt || 0)),
    [bookings]
  );

  const recentBookings = sortedBookings.slice(0, 6);

  const topProperties = useMemo(() => {
    const byHotel = new Map();
    bookings.forEach((booking) => {
      if (booking.status === 'CANCELLED' || booking.status === 'EXPIRED') return;
      const entry = byHotel.get(booking.hotelId) || { revenue: 0, bookings: 0 };
      entry.revenue += Number(booking.totalAmount) || 0;
      entry.bookings += 1;
      byHotel.set(booking.hotelId, entry);
    });
    return hotels
      .map((hotel) => ({
        ...hotel,
        revenue: byHotel.get(hotel.id)?.revenue || 0,
        bookingCount: byHotel.get(hotel.id)?.bookings || 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [hotels, bookings]);

  const statusBreakdown = useMemo(() => {
    const confirmed = bookings.filter((booking) => booking.status === 'CONFIRMED').length;
    const stay = bookings.filter((booking) => ['CHECKED_IN', 'COMPLETED'].includes(booking.status)).length;
    const cancelled = bookings.filter((booking) => ['CANCELLED', 'REFUNDED'].includes(booking.status)).length;
    const other = Math.max(0, bookings.length - confirmed - stay - cancelled);
    const segments = [
      { key: 'confirmed', label: 'Confirmed', count: confirmed, color: STATUS_COLORS.confirmed },
      { key: 'stay', label: 'In stay / completed', count: stay, color: STATUS_COLORS.stay },
      { key: 'cancelled', label: 'Cancelled', count: cancelled, color: STATUS_COLORS.cancelled },
      { key: 'other', label: 'Held / expired', count: other, color: STATUS_COLORS.other }
    ].filter((segment) => segment.count > 0);
    return { segments, total: bookings.length };
  }, [bookings]);

  const chartData = useMemo(() => {
    return [...trends]
      .sort((a, b) => String(a.month).localeCompare(String(b.month)))
      .slice(-6);
  }, [trends]);

  const chartMax = Math.max(...chartData.map((item) => Number(item.gmv) || 0), 1);
  const chartTotal = chartData.reduce((sum, item) => sum + (Number(item.gmv) || 0), 0);

  const pendingProperties = hotels.filter((hotel) => !hotel.isVerified || hotel.verificationStatus === 'PENDING').length;
  const pendingPayouts = (payoutOverview?.pendingBookings || []).filter((booking) => booking.payoutStatus === 'READY_FOR_PAYOUT').length;
  const pendingRefunds = bookings.filter((booking) => booking.refundStatus === 'PENDING_PROVIDER').length;
  const unansweredReviews = reviews.filter((review) => !review.hotelResponse).length;
  const referenceTime = asOf ? new Date(asOf).getTime() : null;
  const expiringCoupons = referenceTime === null ? 0 : coupons.filter((coupon) => {
    if (!coupon.isActive || !coupon.expiresAt) return false;
    const days = (new Date(coupon.expiresAt).getTime() - referenceTime) / 86400000;
    return days >= 0 && days <= 30;
  }).length;

  const alerts = [
    pendingProperties && {
      id: 'properties',
      icon: 'fa-hotel',
      tone: 'amber',
      label: 'Properties awaiting verification',
      detail: 'Review and approve new hotel partners',
      count: pendingProperties,
      tab: 'properties'
    },
    pendingPayouts && {
      id: 'payouts',
      icon: 'fa-building-columns',
      tone: 'sky',
      label: 'Payouts ready to release',
      detail: 'Guest check-in completed',
      count: pendingPayouts,
      tab: 'finance'
    },
    pendingRefunds && {
      id: 'refunds',
      icon: 'fa-rotate-left',
      tone: 'rose',
      label: 'Refunds pending provider',
      detail: 'Cancelled bookings awaiting refund',
      count: pendingRefunds,
      tab: 'bookings'
    },
    unansweredReviews && {
      id: 'reviews',
      icon: 'fa-comment-dots',
      tone: 'sky',
      label: 'Reviews without a reply',
      detail: 'Respond on behalf of hotel partners',
      count: unansweredReviews,
      tab: 'reviews'
    },
    expiringCoupons && {
      id: 'coupons',
      icon: 'fa-ticket',
      tone: 'amber',
      label: 'Coupons expiring this month',
      detail: 'Review promotions before they lapse',
      count: expiringCoupons,
      tab: 'coupons'
    }
  ].filter(Boolean);

  const donutGradient = (() => {
    if (!statusBreakdown.total) return 'conic-gradient(#e2e8f0 0% 100%)';
    let cursor = 0;
    const stops = statusBreakdown.segments.map((segment) => {
      const start = cursor;
      cursor += (segment.count / statusBreakdown.total) * 100;
      return `${segment.color} ${start}% ${cursor}%`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  })();

  const exportReport = () => {
    downloadCsv(
      `hotel-factories-platform-report-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { label: 'Month', key: 'month' },
        { label: 'Gross booking value', key: 'gmv' },
        { label: 'Commission', key: 'commission' },
        { label: 'Bookings', key: 'bookings' }
      ],
      chartData
    );
  };

  return (
    <div className="admin-fade-up">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Here is how Hotel Factories is performing across properties, bookings and settlements."
        actions={
          <>
            <GhostButton icon="fa-chart-line" onClick={() => onNavigate('reports')}>View reports</GhostButton>
            <GhostButton icon="fa-file-arrow-down" onClick={exportReport}>Export report</GhostButton>
            <PrimaryButton icon="fa-plus" onClick={() => onQuickAction('property')}>Add property</PrimaryButton>
          </>
        }
        meta={
          <Badge tone="sky" dot>
            Live platform data
          </Badge>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Gross booking value"
          value={formatCurrency(financials.totalGmv, true)}
          icon="fa-indian-rupee-sign"
          tone="sky"
          hint="excluding cancelled stays"
          trend={monthTrend(trends, 'gmv')}
        />
        <StatCard
          label="Platform net profit"
          value={formatCurrency(financials.netPlatformProfit, true)}
          icon="fa-chart-line"
          tone="sky"
          hint="commission + fees − gateway"
          trend={monthTrend(trends, 'commission')}
        />
        <StatCard
          label="Total bookings"
          value={formatNumber(counts.totalBookings)}
          icon="fa-calendar-check"
          tone="violet"
          hint={`${formatNumber(counts.confirmedBookings)} confirmed`}
          trend={monthTrend(trends, 'bookings')}
        />
        <StatCard
          label="Active properties"
          value={formatNumber(counts.totalHotels)}
          icon="fa-hotel"
          tone="amber"
          hint={`${formatNumber(counts.verifiedHotels)} verified · ${formatNumber(counts.totalRooms)} room types`}
        />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
        <Panel className="xl:col-span-8">
          <PanelHeader
            title="Revenue performance"
            subtitle="Gross booking value across the last six months"
            icon="fa-chart-column"
            action={
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-blue-600" /> GMV</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-slate-300" /> Previous</span>
              </div>
            }
          />
          <div className="px-5 pb-5 sm:px-6">
            <div className="mb-4 flex flex-wrap items-end gap-x-8 gap-y-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">Selected period</p>
                <p className="font-heading text-xl font-semibold tracking-tight text-slate-900">{formatCurrency(chartTotal)}</p>
              </div>
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-900">{formatCurrency(financials.platformCommissionGross, true)}</span> commission earned
              </div>
            </div>
            {chartData.length === 0 ? (
              <EmptyState icon="fa-chart-column" title="No revenue data yet" description="Revenue will appear here as soon as the first booking is confirmed." />
            ) : (
              <div className="relative h-[220px] w-full">
                <div className="absolute inset-0 flex flex-col justify-between pb-6">
                  {[0, 1, 2, 3].map((line) => (
                    <div key={line} className="border-t border-dashed border-slate-100" />
                  ))}
                </div>
                <div className="relative flex h-full items-end justify-between gap-3 pb-6 pt-2">
                  {chartData.map((item, index) => {
                    const height = Math.max(4, Math.round(((Number(item.gmv) || 0) / chartMax) * 100));
                    const previous = chartData[index - 1];
                    const previousHeight = previous ? Math.max(4, Math.round(((Number(previous.gmv) || 0) / chartMax) * 100)) : height;
                    return (
                      <div key={item.month} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
                        <div className="relative flex h-full w-full max-w-[58px] items-end justify-center gap-1">
                          {index > 0 && (
                            <div
                              className="w-2 rounded-t-sm bg-slate-200 transition-all duration-500"
                              style={{ height: `${previousHeight}%` }}
                              title={`Previous month: ${formatCurrency(previous.gmv)}`}
                              aria-hidden="true"
                            />
                          )}
                          <div
                            className="w-4 rounded-t-sm bg-blue-600 transition-all duration-500 group-hover:bg-blue-700"
                            style={{ height: `${height}%` }}
                            title={`${monthLabelLong(item.month)}: ${formatCurrency(item.gmv)} · ${item.bookings} bookings`}
                          />
                          <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-xs font-bold text-white shadow-lg group-hover:block">
                            {formatCurrency(item.gmv, true)}
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-400">{monthLabel(item.month)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Panel>

        <Panel className="xl:col-span-4">
          <PanelHeader title="Booking mix" subtitle="Current reservation status" icon="fa-chart-pie" />
          <div className="flex flex-col items-center px-5 pb-5 sm:px-6">
            <div
              className="relative grid h-40 w-40 place-items-center rounded-full"
              style={{ background: donutGradient }}
              role="img"
              aria-label={`${statusBreakdown.total} total bookings`}
            >
              <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center shadow-[inset_0_0_0_1px_rgba(226,232,240,0.8)]">
                <div>
                  <span className="block font-heading text-2xl font-semibold leading-none text-slate-900">{formatNumber(statusBreakdown.total)}</span>
                  <span className="mt-1 block text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Bookings</span>
                </div>
              </div>
            </div>
            <div className="mt-5 w-full space-y-2.5">
              {statusBreakdown.segments.length === 0 ? (
                <p className="text-center text-xs text-slate-400">No booking activity yet.</p>
              ) : (
                statusBreakdown.segments.map((segment) => (
                  <div key={segment.key} className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: segment.color }} />
                    <span className="flex-1 text-slate-600">{segment.label}</span>
                    <span className="font-semibold text-slate-800">{segment.count}</span>
                    <span className="w-10 text-right text-xs text-slate-500">{percent(segment.count, statusBreakdown.total)}%</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <Panel className="xl:col-span-8">
          <PanelHeader
            title="Recent bookings"
            subtitle="Latest reservations across all properties"
            icon="fa-clock-rotate-left"
            action={<button type="button" onClick={() => onNavigate('bookings')} className="text-xs font-semibold text-blue-600 transition hover:text-blue-700">View all →</button>}
          />
          {recentBookings.length === 0 ? (
            <div className="px-5 pb-5 sm:px-6">
              <EmptyState icon="fa-calendar-xmark" title="No bookings yet" description="New reservations will appear here in real time." />
            </div>
          ) : (
            <TableShell>
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead>
                  <tr className="border-y border-slate-100 bg-slate-50/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="w-[180px] min-w-[180px] px-5 py-3 sm:px-6 whitespace-nowrap">Booking</th>
                    <th className="w-[200px] min-w-[200px] px-4 py-3 whitespace-nowrap">Guest</th>
                    <th className="min-w-[240px] px-4 py-3">Property</th>
                    <th className="w-[160px] min-w-[160px] px-4 py-3 whitespace-nowrap">Stay</th>
                    <th className="w-[120px] min-w-[120px] px-4 py-3 text-right whitespace-nowrap">Amount</th>
                    <th className="w-[120px] min-w-[120px] px-5 py-3 text-right sm:px-6 whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentBookings.map((booking) => {
                    const meta = getStatusMeta(booking.status);
                    return (
                      <tr key={booking.id} className="group transition hover:bg-slate-50/70">
                        <td className="w-[180px] min-w-[180px] px-5 py-3.5 sm:px-6 whitespace-nowrap">
                          <span className="block font-mono text-sm font-semibold text-slate-900 whitespace-nowrap tracking-tight select-all">{booking.bookingCode}</span>
                          <span className="block text-xs text-slate-500 whitespace-nowrap">{formatDate(booking.bookedAt)}</span>
                        </td>
                        <td className="w-[200px] min-w-[200px] px-4 py-3.5 whitespace-nowrap">
                          <span className="block max-w-[190px] truncate text-sm font-semibold text-slate-800" title={booking.guestName}>{booking.guestName}</span>
                          <span className="block max-w-[190px] truncate text-xs text-slate-500" title={booking.guestEmail}>{booking.guestEmail}</span>
                        </td>
                        <td className="min-w-[240px] px-4 py-3.5">
                          <span className="block max-w-[260px] truncate text-sm font-semibold text-slate-700" title={booking.hotelName}>{booking.hotelName}</span>
                          <span className="block max-w-[260px] truncate text-xs text-slate-500" title={booking.roomName}>{booking.roomName}</span>
                        </td>
                        <td className="w-[160px] min-w-[160px] px-4 py-3.5 text-sm font-semibold text-slate-700 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                            <span className="whitespace-nowrap">{formatShortDate(booking.checkInDate)}</span>
                            <i className="fa-solid fa-arrow-right text-xs text-slate-400 shrink-0" aria-hidden="true" />
                            <span className="whitespace-nowrap">{formatShortDate(booking.checkOutDate)}</span>
                          </span>
                        </td>
                        <td className="w-[120px] min-w-[120px] px-4 py-3.5 text-right text-sm font-bold text-slate-900 whitespace-nowrap">
                          {formatCurrency(booking.totalAmount)}
                        </td>
                        <td className="w-[120px] min-w-[120px] px-5 py-3.5 text-right sm:px-6 whitespace-nowrap">
                          <span className={`inline-flex whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${meta.tone}`}>
                            {meta.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableShell>
          )}
        </Panel>

        <div className="space-y-5 xl:col-span-4">
          <Panel>
            <PanelHeader
              title="Needs attention"
              subtitle="Operational items to review"
              icon="fa-bolt"
              action={<span className="grid h-6 min-w-6 place-items-center rounded-md bg-slate-100 px-1.5 text-xs font-semibold text-slate-600">{alerts.reduce((sum, alert) => sum + alert.count, 0)}</span>}
            />
            <div className="px-5 pb-5 sm:px-6">
              {alerts.length === 0 ? (
                <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-inset ring-slate-200">
                  <i className="fa-solid fa-circle-check text-slate-400" aria-hidden="true" />
                  Everything is reviewed. No pending items.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {alerts.slice(0, 4).map((alert) => (
                    <button
                      key={alert.id}
                      type="button"
                      onClick={() => onNavigate(alert.tab)}
                      className="group flex w-full items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 text-left transition hover:border-slate-200 hover:bg-slate-50"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs text-slate-500">
                        <i className={`fa-solid ${alert.icon}`} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-bold text-slate-800">{alert.label}</span>
                        <span className="block truncate text-xs text-slate-400">{alert.detail}</span>
                      </span>
                      <span className="text-xs font-semibold text-slate-600">{alert.count}</span>
                      <i className="fa-solid fa-chevron-right text-xs text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                <button type="button" onClick={() => onQuickAction('room')} className="rounded-lg bg-slate-50 px-2.5 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
                  <i className="fa-solid fa-bed mr-1.5 text-xs text-slate-400" aria-hidden="true" /> Add room
                </button>
                <button type="button" onClick={() => onQuickAction('coupon')} className="rounded-lg bg-slate-50 px-2.5 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
                  <i className="fa-solid fa-ticket mr-1.5 text-xs text-slate-400" aria-hidden="true" /> New coupon
                </button>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Top properties"
              subtitle="By gross booking value"
              icon="fa-trophy"
              action={<button type="button" onClick={() => onNavigate('properties')} className="text-xs font-semibold text-blue-600 transition hover:text-blue-700">Manage →</button>}
            />
            <div className="px-3 pb-3">
              {topProperties.length === 0 ? (
                <p className="px-3 py-5 text-center text-xs text-slate-400">No property performance data yet.</p>
              ) : (
                topProperties.map((hotel, index) => (
                  <button
                    key={hotel.id}
                    type="button"
                    onClick={() => onNavigate('properties')}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-slate-50"
                  >
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded text-xs font-semibold ${index === 0 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {index + 1}
                    </span>
                    <img src={hotel.images?.[0]} alt="" className="h-8 w-10 shrink-0 rounded-lg object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold text-slate-800">{hotel.name}</span>
                      <span className="block text-xs text-slate-400">{hotel.city} · {hotel.bookingCount} bookings</span>
                    </span>
                    <span className="text-xs font-semibold text-slate-800">{formatCurrency(hotel.revenue, true)}</span>
                  </button>
                ))
              )}
            </div>
          </Panel>
        </div>
      </div>

      <p className="mt-5 text-right text-xs text-slate-400">
        Signed in as {users.find((account) => account.role === 'admin')?.name || 'Platform Administrator'} · Data refreshed {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  );
}
