'use client';

import React, { useMemo, useState } from 'react';
import {
  Badge,
  ConfirmDialog,
  EmptyState,
  GhostButton,
  LoadingState,
  PageHeader,
  Panel,
  PanelHeader,
  PrimaryButton,
  SearchField,
  SegmentedTabs,
  TableShell
} from './AdminUI';
import {
  PAYOUT_META,
  downloadCsv,
  formatCurrency,
  formatDate,
  formatDateTime,
  percent
} from './adminUtils';

export default function AdminFinance({ overview, metrics, bookings = [], hotels = [], onExecutePayout, showToast }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const summary = overview?.summary || {};
  const financials = metrics?.financials || {};
  const pending = useMemo(() => overview?.pendingBookings || [], [overview]);
  const settled = useMemo(() => overview?.settledPayouts || [], [overview]);
  const pendingTotal = pending.reduce((sum, booking) => sum + (Number(booking.netHotelPayout) || 0), 0);

  const counts = useMemo(
    () => ({
      all: pending.length,
      READY_FOR_PAYOUT: pending.filter((booking) => booking.payoutStatus === 'READY_FOR_PAYOUT').length,
      PENDING_ESCROW: pending.filter((booking) => booking.payoutStatus === 'PENDING_ESCROW').length,
      PROCESSING: pending.filter((booking) => booking.payoutStatus === 'PROCESSING').length
    }),
    [pending]
  );

  const filteredPending = useMemo(() => {
    const query = search.trim().toLowerCase();
    return pending
      .filter((booking) => statusFilter === 'all' || booking.payoutStatus === statusFilter)
      .filter((booking) => !query || [booking.bookingCode, booking.hotelName, booking.guestName].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)))
      .sort((a, b) => {
        const readyA = a.payoutStatus === 'READY_FOR_PAYOUT' ? 0 : 1;
        const readyB = b.payoutStatus === 'READY_FOR_PAYOUT' ? 0 : 1;
        return readyA - readyB || new Date(b.checkedInAt || b.bookedAt || 0) - new Date(a.checkedInAt || a.bookedAt || 0);
      });
  }, [pending, statusFilter, search]);

  const execute = async () => {
    if (!target) return;
    setBusy(true);
    try {
      const ok = await onExecutePayout(target);
      if (ok) setTarget(null);
    } finally {
      setBusy(false);
    }
  };

  const exportPending = () => {
    downloadCsv(
      `hotel-factories-pending-payouts-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { label: 'Booking code', key: 'bookingCode' },
        { label: 'Hotel', key: 'hotelName' },
        { label: 'Guest', key: 'guestName' },
        { label: 'Check-in', key: 'checkInDate' },
        { label: 'Payout amount', key: 'netHotelPayout' },
        { label: 'Payout status', key: 'payoutStatus' },
        { label: 'Booking status', key: 'status' }
      ],
      filteredPending
    );
  };

  const canRelease = (booking) =>
    booking.payoutStatus === 'READY_FOR_PAYOUT' && ['CHECKED_IN', 'COMPLETED'].includes(booking.status);

  const releasedThisPeriod = settled.filter((payout) => {
    if (!payout.requestedAt) return false;
    return new Date(payout.requestedAt).getMonth() === new Date().getMonth();
  }).length;

  return (
    <div className="admin-fade-up">
      <PageHeader
        eyebrow="Commerce"
        title="Finance & payouts"
        description="Track platform earnings, monitor escrowed funds, and release hotel settlements once guests have checked in."
        actions={
          <>
            <GhostButton icon="fa-file-arrow-down" onClick={exportPending}>Export payouts</GhostButton>
            <Badge tone="sky" dot>Finance desk</Badge>
          </>
        }
        meta={<Badge tone="sky">{pendingTotal > 0 ? `${formatCurrency(pendingTotal, true)} outstanding` : 'All settled'}</Badge>}
      />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FinanceStat label="Gross booking value" value={formatCurrency(summary.totalGmv || financials.totalGmv, true)} icon="fa-indian-rupee-sign" tone="sky" hint={`${summary.totalBookingsCount || metrics?.counts?.totalBookings || 0} paid bookings`} />
        <FinanceStat label="Platform commission" value={formatCurrency(summary.totalPlatformCommission || financials.platformCommissionGross, true)} icon="fa-percent" tone="sky" hint="commission + convenience fees" />
        <FinanceStat label="Pending hotel payouts" value={formatCurrency(pendingTotal, true)} icon="fa-hourglass-half" tone="amber" hint={`${counts.READY_FOR_PAYOUT} ready · ${counts.PENDING_ESCROW} in escrow`} />
        <FinanceStat label="Settled to partners" value={formatCurrency(summary.settledHotelPayoutTotal || financials.totalHotelPayouts, true)} icon="fa-building-columns" tone="violet" hint={`${settled.length} payout records`} />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
        <Panel className="xl:col-span-8">
          <PanelHeader
            title="Pending settlements"
            subtitle="Release payouts after guest check-in"
            icon="fa-clock-rotate-left"
            action={<SearchField value={search} onChange={setSearch} placeholder="Search booking or property" className="w-full sm:w-64" />}
          />
          <div className="px-5 pb-3 sm:px-6">
            <SegmentedTabs
              value={statusFilter}
              onChange={setStatusFilter}
              tabs={[
                { value: 'all', label: 'All pending', count: counts.all },
                { value: 'READY_FOR_PAYOUT', label: 'Ready', count: counts.READY_FOR_PAYOUT },
                { value: 'PENDING_ESCROW', label: 'In escrow', count: counts.PENDING_ESCROW },
                { value: 'PROCESSING', label: 'Processing', count: counts.PROCESSING }
              ]}
            />
          </div>
          {!overview ? (
            <div className="px-5 pb-5 sm:px-6"><LoadingState label="Loading payout ledger…" /></div>
          ) : filteredPending.length === 0 ? (
            <div className="px-5 pb-6 sm:px-6">
              <EmptyState
                icon="fa-circle-check"
                title={statusFilter === 'all' ? 'No pending payouts' : 'No payouts in this state'}
                description="Every eligible settlement has been released. New payouts become available after guests check in."
              />
            </div>
          ) : (
            <TableShell>
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead>
                  <tr className="border-y border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3 sm:px-6 whitespace-nowrap">Booking</th>
                    <th className="px-3 py-3">Property</th>
                    <th className="px-3 py-3">Guest</th>
                    <th className="px-3 py-3 whitespace-nowrap">Status</th>
                    <th className="px-3 py-3 text-right whitespace-nowrap">Payout</th>
                    <th className="px-5 py-3 text-right sm:px-6 whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPending.map((booking) => {
                    const payout = PAYOUT_META[booking.payoutStatus] || { label: booking.payoutStatus, tone: 'slate' };
                    return (
                      <tr key={booking.id} className="transition hover:bg-slate-50/70">
                        <td className="px-5 py-3.5 sm:px-6 whitespace-nowrap">
                          <span className="block font-mono text-sm font-semibold text-slate-900 whitespace-nowrap">{booking.bookingCode}</span>
                          <span className="block text-xs text-slate-500 whitespace-nowrap">{formatDateTime(booking.checkedInAt || booking.bookedAt)}</span>
                        </td>
                        <td className="px-3 py-3.5">
                          <span className="block max-w-[200px] truncate text-sm font-semibold text-slate-700">{booking.hotelName}</span>
                          <span className="block text-xs text-slate-500">{booking.hotelCity}</span>
                        </td>
                        <td className="px-3 py-3.5">
                          <span className="block max-w-[160px] truncate text-sm font-semibold text-slate-800">{booking.guestName}</span>
                          <span className="block text-xs text-slate-500">{booking.status.replaceAll('_', ' ').toLowerCase()}</span>
                        </td>
                        <td className="px-3 py-3.5 whitespace-nowrap"><Badge tone={payout.tone}>{payout.label}</Badge></td>
                        <td className="px-3 py-3.5 text-right whitespace-nowrap">
                          <span className="block text-sm font-bold text-slate-900 whitespace-nowrap">{formatCurrency(booking.netHotelPayout)}</span>
                          <span className="block text-xs text-slate-500 whitespace-nowrap">TDS {formatCurrency(booking.tdsDeduction)}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right sm:px-6 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              if (canRelease(booking)) setTarget(booking);
                              else showToast('Payout is available only after the guest checks in.');
                            }}
                            disabled={!canRelease(booking)}
                            className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${
                              canRelease(booking)
                                ? 'bg-slate-900 text-white hover:bg-slate-800'
                                : 'cursor-not-allowed bg-slate-100 text-slate-400'
                            }`}
                            title={canRelease(booking) ? 'Queue payout' : 'Available after check-in'}
                          >
                            <i className="fa-solid fa-paper-plane text-xs" aria-hidden="true" />
                            {canRelease(booking) ? 'Release' : 'Locked'}
                          </button>
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
            <PanelHeader title="Platform economics" subtitle="All-time revenue composition" icon="fa-scale-balanced" />
            <div className="px-5 pb-5 sm:px-6">
              <div className="mb-4 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
                <span className="bg-blue-600" style={{ width: `${Math.min(100, percent(financials.platformCommissionGross, financials.totalGmv || 1) * 4)}%` }} title="Commission" />
                <span className="bg-slate-300" style={{ width: `${Math.min(100, percent(financials.convenienceFees, financials.totalGmv || 1) * 4)}%` }} title="Convenience fees" />
              </div>
              <FinanceRow label="Platform commission" value={financials.platformCommissionGross} />
              <FinanceRow label="Convenience fees" value={financials.convenienceFees} />
              <FinanceRow label="Gateway fees" value={-Math.abs(financials.gatewayFees || 0)} tone="rose" />
              <div className="my-2 border-t border-slate-200" />
              <FinanceRow label="Net platform profit" value={financials.netPlatformProfit} strong />
              <div className="mt-3 rounded-lg bg-slate-50 p-3">
                <FinanceRow label="GST collected" value={financials.totalTaxCollected} small />
                <FinanceRow label="Hotel payouts" value={financials.totalHotelPayouts} small />
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Settlement health" subtitle="Payout pipeline" icon="fa-heart-pulse" />
            <div className="space-y-3 px-5 pb-5 sm:px-6">
              <HealthBar label="Ready for payout" value={counts.READY_FOR_PAYOUT} total={counts.all} tone="bg-blue-600" />
              <HealthBar label="In escrow" value={counts.PENDING_ESCROW} total={counts.all} tone="bg-slate-400" />
              <HealthBar label="Processing" value={counts.PROCESSING} total={counts.all} tone="bg-slate-300" />
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs leading-relaxed text-slate-600">
                <i className="fa-solid fa-circle-info mr-1.5 text-slate-500" aria-hidden="true" />
                {releasedThisPeriod} payout{releasedThisPeriod === 1 ? '' : 's'} released this month. Payouts are queued to the hotel&apos;s verified bank account.
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <Panel>
        <PanelHeader
          title="Settlement history"
          subtitle="Completed payout records"
          icon="fa-receipt"
          action={<span className="text-xs font-semibold text-slate-500">{settled.length} records</span>}
        />
        {settled.length === 0 ? (
          <div className="px-5 pb-6 sm:px-6">
            <EmptyState icon="fa-receipt" title="No settlements yet" description="Once you release a payout, the transfer record will appear here with its bank reference." />
          </div>
        ) : (
          <TableShell>
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3 sm:px-6 whitespace-nowrap">Payout</th>
                  <th className="px-3 py-3">Property</th>
                  <th className="px-3 py-3">Bank account</th>
                  <th className="px-3 py-3 whitespace-nowrap">Requested</th>
                  <th className="px-3 py-3 whitespace-nowrap">Status</th>
                  <th className="px-5 py-3 text-right sm:px-6 whitespace-nowrap">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {settled.map((payout) => (
                  <tr key={payout.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 sm:px-6 whitespace-nowrap">
                      <span className="block font-mono text-sm font-semibold text-slate-900 whitespace-nowrap">{payout.id}</span>
                      <span className="block text-xs text-slate-500 whitespace-nowrap">{payout.bookingCode || '—'}</span>
                    </td>
                    <td className="px-3 py-3.5 text-sm font-semibold text-slate-700">{payout.hotelName}</td>
                    <td className="px-3 py-3.5">
                      <span className="block text-sm text-slate-700">{payout.bankAccount?.bankName || '—'}</span>
                      <span className="block font-mono text-xs text-slate-500">{payout.bankAccount?.accountNumberMasked || '—'}</span>
                    </td>
                    <td className="px-3 py-3.5 text-xs text-slate-500 whitespace-nowrap">{formatDate(payout.requestedAt)}</td>
                    <td className="px-3 py-3.5 whitespace-nowrap"><Badge tone={PAYOUT_META[payout.status]?.tone || 'slate'}>{PAYOUT_META[payout.status]?.label || payout.status}</Badge></td>
                    <td className="px-5 py-3.5 text-right text-sm font-bold text-slate-900 sm:px-6 whitespace-nowrap">{formatCurrency(payout.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        )}
      </Panel>

      <ConfirmDialog
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        onConfirm={execute}
        title="Release hotel payout?"
        message={
          target
            ? `Queue ${formatCurrency(target.netHotelPayout)} to ${target.hotelName} for booking ${target.bookingCode}. The hotel's verified bank account will receive the transfer.`
            : ''
        }
        confirmLabel="Release payout"
        busy={busy}
        tone="slate"
      />
    </div>
  );
}

function FinanceStat({ label, value, icon, hint }) {
  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 truncate font-heading text-xl font-semibold tracking-tight text-slate-900">{value}</p>
        </div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-400 ring-1 ring-inset ring-slate-200">
          <i className={`fa-solid ${icon} text-xs`} aria-hidden="true" />
        </span>
      </div>
      {hint && <p className="mt-2 truncate text-xs text-slate-400">{hint}</p>}
    </Panel>
  );
}

function FinanceRow({ label, value, strong = false, small = false, tone }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${small ? 'py-0.5 text-xs' : 'py-1.5 text-xs'}`}>
      <span className="text-slate-500">{label}</span>
      <span className={`${strong ? 'font-semibold text-slate-900' : 'font-semibold text-slate-700'} ${tone === 'rose' ? 'text-rose-600' : ''}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function HealthBar({ label, value, total, tone }) {
  const width = total ? Math.max(3, Math.round((value / total) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-500">{label}</span>
        <span className="font-semibold text-slate-800">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
