'use client';

import React, { useMemo, useState } from 'react';
import {
  Badge,
  ConfirmDialog,
  Drawer,
  EmptyState,
  FilterSelect,
  GhostButton,
  Modal,
  PageHeader,
  Panel,
  PanelHeader,
  PrimaryButton,
  SearchField,
  SegmentedTabs,
  StatCard,
  TableShell,
  TextArea
} from './AdminUI';
import {
  REFUND_STATUS_META,
  downloadCsv,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  percent
} from './adminUtils';

const TAB_OPTIONS = [
  { value: 'all', label: 'All records' },
  { value: 'pending', label: 'Awaiting review' },
  { value: 'refunded', label: 'Settled' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'not_required', label: 'Not required' }
];

export default function AdminRefunds({ bookings = [], onProcessRefund, onNavigate, focusRequest }) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedId, setSelectedId] = useState(focusRequest?.id || null);
  const [busyId, setBusyId] = useState(null);

  // Modal states for refund action
  const [confirmModal, setConfirmModal] = useState({ open: false, booking: null, action: 'APPROVE', note: '' });

  // Filter only bookings that have been cancelled or have a refund record
  const refundBookings = useMemo(() => {
    return bookings.filter((b) => {
      const isCancelled = b.status === 'CANCELLED' || b.status === 'REFUNDED';
      const hasRefund = Boolean(b.refundStatus) || Number(b.refundAmount) > 0;
      return isCancelled || hasRefund;
    }).sort((a, b) => new Date(b.cancelledAt || b.bookedAt || 0) - new Date(a.cancelledAt || a.bookedAt || 0));
  }, [bookings]);

  const counts = useMemo(() => {
    let pending = 0;
    let refunded = 0;
    let rejected = 0;
    let notRequired = 0;
    let totalPendingAmount = 0;
    let totalRefundedAmount = 0;
    let totalRetainedFee = 0;

    refundBookings.forEach((b) => {
      const status = b.refundStatus || (b.status === 'REFUNDED' ? 'REFUNDED' : 'PENDING_PROVIDER');
      const amount = Number(b.refundAmount) || 0;
      const fee = Number(b.cancellationFee) || 0;

      if (status === 'PENDING_PROVIDER') {
        pending += 1;
        totalPendingAmount += amount;
      } else if (status === 'REFUNDED' || status === 'PROCESSED') {
        refunded += 1;
        totalRefundedAmount += amount;
      } else if (status === 'REJECTED') {
        rejected += 1;
      } else {
        notRequired += 1;
      }
      totalRetainedFee += fee;
    });

    return {
      all: refundBookings.length,
      pending,
      refunded,
      rejected,
      notRequired,
      totalPendingAmount,
      totalRefundedAmount,
      totalRetainedFee,
      totalClaimValue: totalPendingAmount + totalRefundedAmount
    };
  }, [refundBookings]);

  const filtered = useMemo(() => {
    return refundBookings.filter((b) => {
      const status = b.refundStatus || (b.status === 'REFUNDED' ? 'REFUNDED' : 'PENDING_PROVIDER');

      if (activeTab === 'pending' && status !== 'PENDING_PROVIDER') return false;
      if (activeTab === 'refunded' && status !== 'REFUNDED' && status !== 'PROCESSED') return false;
      if (activeTab === 'rejected' && status !== 'REJECTED') return false;
      if (activeTab === 'not_required' && status !== 'NOT_REQUIRED') return false;

      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const matchesCode = b.bookingCode?.toLowerCase().includes(query);
        const matchesGuest = b.guestName?.toLowerCase().includes(query) || b.guestEmail?.toLowerCase().includes(query);
        const matchesHotel = b.hotelName?.toLowerCase().includes(query) || b.hotelCity?.toLowerCase().includes(query);
        const matchesReason = b.cancellationReason?.toLowerCase().includes(query);
        if (!matchesCode && !matchesGuest && !matchesHotel && !matchesReason) return false;
      }

      return true;
    });
  }, [refundBookings, activeTab, search]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return refundBookings.find((b) => b.id === selectedId) || null;
  }, [selectedId, refundBookings]);

  const handleAction = async (booking, action, note = '') => {
    setBusyId(booking.id);
    try {
      if (onProcessRefund) {
        await onProcessRefund(booking, action, note);
      }
      setConfirmModal({ open: false, booking: null, action: 'APPROVE', note: '' });
      if (selectedId === booking.id) {
        setSelectedId(null);
      }
    } finally {
      setBusyId(null);
    }
  };

  const exportCsv = () => {
    downloadCsv(
      `hotel-factories-refunds-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { label: 'Booking Code', key: 'bookingCode' },
        { label: 'Guest Name', key: 'guestName' },
        { label: 'Guest Email', key: 'guestEmail' },
        { label: 'Hotel Name', key: 'hotelName' },
        { label: 'Total Paid', key: 'totalAmount' },
        { label: 'Refund Amount', key: 'refundAmount' },
        { label: 'Cancellation Fee', key: 'cancellationFee' },
        { label: 'Refund Status', key: 'refundStatus' },
        { label: 'Payment Method', key: 'paymentMethod' },
        { label: 'Cancelled At', key: 'cancelledAt' },
        { label: 'Cancellation Reason', key: 'cancellationReason' },
        { label: 'Refund Transaction ID', key: 'refundTxnId' }
      ],
      refundBookings
    );
  };

  const tabsWithCounts = TAB_OPTIONS.map((t) => ({
    ...t,
    count:
      t.value === 'all'
        ? counts.all
        : t.value === 'pending'
        ? counts.pending
        : t.value === 'refunded'
        ? counts.refunded
        : t.value === 'rejected'
        ? counts.rejected
        : counts.notRequired
  }));

  return (
    <div className="admin-fade-up">
      <PageHeader
        eyebrow="Commerce"
        title="Refunds & returns"
        description="Review customer cancellation claims, calculate policy deductions, and disburse refunds directly to original payment methods."
        actions={
          <>
            <GhostButton icon="fa-file-arrow-down" onClick={exportCsv}>
              Export refunds
            </GhostButton>
            <GhostButton icon="fa-calendar-check" onClick={() => onNavigate?.('bookings')}>
              All bookings
            </GhostButton>
          </>
        }
        meta={
          counts.pending > 0 ? (
            <Badge tone="amber" dot>
              {counts.pending} refund{counts.pending === 1 ? '' : 's'} awaiting review
            </Badge>
          ) : (
            <Badge tone="sky" dot>
              All refunds settled
            </Badge>
          )
        }
      />

      {/* Metrics Row */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total claims value"
          value={formatCurrency(counts.totalClaimValue, true)}
          icon="fa-rotate-left"
          tone="sky"
          hint={`${counts.all} cancelled stays`}
        />
        <StatCard
          label="Awaiting payout"
          value={formatCurrency(counts.totalPendingAmount, true)}
          icon="fa-hourglass-half"
          tone="amber"
          hint={`${counts.pending} pending claims`}
        />
        <StatCard
          label="Settled & refunded"
          value={formatCurrency(counts.totalRefundedAmount, true)}
          icon="fa-circle-check"
          tone="sky"
          hint={`${counts.refunded} customer accounts credited`}
        />
        <StatCard
          label="Retained fees"
          value={formatCurrency(counts.totalRetainedFee, true)}
          icon="fa-receipt"
          tone="violet"
          hint="policy cancellation charges"
        />
      </div>

      {/* Main Table Shell */}
      <Panel>
        <PanelHeader
          title="Cancellation & refund ledger"
          subtitle={`${filtered.length} of ${refundBookings.length} records`}
          icon="fa-rotate-left"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <SearchField
                value={search}
                onChange={setSearch}
                placeholder="Search guest, code, hotel…"
                className="w-full sm:w-64"
              />
            </div>
          }
        />

        <div className="border-b border-slate-200/80 px-5 py-2.5 sm:px-6 bg-slate-50/50">
          <SegmentedTabs tabs={tabsWithCounts} value={activeTab} onChange={setActiveTab} />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon="fa-rotate-left"
            title="No refund records match"
            description={
              search
                ? `No cancelled bookings match "${search}". Clear the search query to show all records.`
                : activeTab === 'pending'
                ? 'Great news! There are no customer cancellation refunds currently awaiting review.'
                : 'No cancellation records found in this category.'
            }
            action={
              search ? (
                <GhostButton onClick={() => setSearch('')}>Clear search</GhostButton>
              ) : activeTab !== 'all' ? (
                <GhostButton onClick={() => setActiveTab('all')}>Show all records</GhostButton>
              ) : null
            }
          />
        ) : (
          <TableShell>
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3 sm:px-6 whitespace-nowrap">Booking & Guest</th>
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3 whitespace-nowrap">Cancelled Date</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Paid Amount</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Retained Fee</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Refund Value</th>
                  <th className="px-4 py-3 whitespace-nowrap">Status</th>
                  <th className="px-5 py-3 text-right sm:px-6 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((b) => {
                  const statusKey = b.refundStatus || (b.status === 'REFUNDED' ? 'REFUNDED' : 'PENDING_PROVIDER');
                  const meta = REFUND_STATUS_META[statusKey] || REFUND_STATUS_META.NOT_REQUIRED;
                  const refundAmt = Number(b.refundAmount) || 0;
                  const isPending = statusKey === 'PENDING_PROVIDER';

                  return (
                    <tr key={b.id} className="transition hover:bg-slate-50/70">
                      <td className="px-5 py-3.5 sm:px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                            <i className="fa-solid fa-rotate-left" aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setSelectedId(b.id)}
                              className="font-mono text-sm font-semibold tracking-tight text-slate-900 hover:text-blue-600 hover:underline text-left block whitespace-nowrap"
                            >
                              {b.bookingCode || b.id}
                            </button>
                            <p className="truncate text-xs text-slate-500 max-w-[160px]">{b.guestName || 'Guest'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="max-w-[240px] truncate text-sm font-semibold text-slate-900">{b.hotelName || 'Hotel'}</p>
                        <p className="text-xs text-slate-500">{b.hotelCity || b.hotelLocality || '—'}</p>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="text-sm font-semibold text-slate-700 whitespace-nowrap">{formatDate(b.cancelledAt || b.bookedAt)}</p>
                        <p className="truncate text-xs text-slate-500 max-w-[160px]" title={b.cancellationReason}>
                          {b.cancellationReason || 'User request'}
                        </p>
                      </td>

                      <td className="px-4 py-3.5 text-right text-sm font-semibold text-slate-700 whitespace-nowrap">
                        {formatCurrency(b.totalAmount || 0)}
                      </td>

                      <td className="px-4 py-3.5 text-right text-sm font-semibold text-slate-500 whitespace-nowrap">
                        {Number(b.cancellationFee) > 0 ? formatCurrency(b.cancellationFee) : '₹0'}
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <span className="font-heading text-sm font-bold tracking-tight text-slate-900">
                          {formatCurrency(refundAmt)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Badge tone={meta.tone} dot={isPending}>
                          {meta.label}
                        </Badge>
                      </td>

                      <td className="px-5 py-3.5 text-right sm:px-6 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <button
                                type="button"
                                disabled={busyId === b.id}
                                onClick={() => setConfirmModal({ open: true, booking: b, action: 'APPROVE', note: '' })}
                                className="inline-flex h-7 items-center gap-1 rounded-md bg-slate-900 px-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
                              >
                                {busyId === b.id ? (
                                  <i className="fa-solid fa-circle-notch fa-spin text-xs" aria-hidden="true" />
                                ) : (
                                  <i className="fa-solid fa-check text-xs" aria-hidden="true" />
                                )}
                                Refund
                              </button>
                              <button
                                type="button"
                                disabled={busyId === b.id}
                                onClick={() => setConfirmModal({ open: true, booking: b, action: 'REJECT', note: '' })}
                                className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-rose-600 disabled:opacity-50"
                                title="Reject refund claim"
                              >
                                <i className="fa-solid fa-xmark text-xs" aria-hidden="true" />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedId(b.id)}
                            className="inline-grid h-7 w-7 place-items-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                            title="View claim breakdown"
                          >
                            <i className="fa-solid fa-arrow-right text-xs" aria-hidden="true" />
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

      {/* Details Drawer */}
      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title="Refund claim details"
        subtitle={selected ? `${selected.bookingCode || selected.id} · ${selected.hotelName}` : ''}
        width="max-w-xl"
        footer={
          selected && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Payment method: <strong className="font-semibold text-slate-700">{selected.paymentMethod || 'Online'}</strong>
              </span>
              <div className="flex items-center gap-2">
                <GhostButton onClick={() => setSelectedId(null)}>Close</GhostButton>
                {(selected.refundStatus === 'PENDING_PROVIDER' || (!selected.refundStatus && selected.status === 'CANCELLED')) && (
                  <PrimaryButton
                    icon="fa-check"
                    onClick={() => setConfirmModal({ open: true, booking: selected, action: 'APPROVE', note: '' })}
                  >
                    Disburse refund
                  </PrimaryButton>
                )}
              </div>
            </div>
          )
        }
      >
        {selected && (
          <div className="space-y-4">
            {/* Status Highlight Banner */}
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Claim status</p>
                  <p className="mt-1 font-heading text-xl font-bold text-slate-900">
                    {formatCurrency(Number(selected.refundAmount) || 0)}
                  </p>
                </div>
                <Badge
                  tone={
                    (REFUND_STATUS_META[selected.refundStatus] || REFUND_STATUS_META.NOT_REQUIRED).tone
                  }
                  dot
                >
                  {(REFUND_STATUS_META[selected.refundStatus] || REFUND_STATUS_META.NOT_REQUIRED).label}
                </Badge>
              </div>

              {selected.refundTxnId && (
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                  <span className="text-slate-400">Settlement reference:</span>
                  <span className="font-mono font-bold text-slate-800">{selected.refundTxnId}</span>
                </div>
              )}
            </div>

            {/* Financial Breakdown */}
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Financial breakdown</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Gross reservation tariff</span>
                  <span className="font-medium text-slate-800">{formatCurrency(selected.totalAmount || 0)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Cancellation fee retained</span>
                  <span className="font-medium text-slate-800">
                    {Number(selected.cancellationFee) > 0 ? `− ${formatCurrency(selected.cancellationFee)}` : '₹0 (Free cancel)'}
                  </span>
                </div>
                <div className="flex justify-between py-1 font-semibold text-slate-900">
                  <span>Net amount to customer</span>
                  <span className="font-heading text-sm text-slate-900">{formatCurrency(selected.refundAmount || 0)}</span>
                </div>
              </div>
            </div>

            {/* Guest & Reservation Metadata */}
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Reservation context</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Guest name</span>
                  <span className="font-medium text-slate-800">{selected.guestName || '—'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Guest email</span>
                  <span className="font-medium text-slate-800">{selected.guestEmail || '—'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Stay dates</span>
                  <span className="font-medium text-slate-800">
                    {formatDate(selected.checkInDate)} → {formatDate(selected.checkOutDate)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Cancellation reason</span>
                  <span className="font-medium text-slate-800 text-right max-w-[240px]">
                    {selected.cancellationReason || 'Customer requested online'}
                  </span>
                </div>
                {selected.refundNotes && (
                  <div className="flex justify-between py-1 border-t border-slate-100 pt-2">
                    <span className="text-slate-400">Administrator notes</span>
                    <span className="font-medium text-slate-700 text-right max-w-[240px]">{selected.refundNotes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Confirmation Modal */}
      <Modal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, booking: null, action: 'APPROVE', note: '' })}
        title={confirmModal.action === 'APPROVE' ? 'Confirm refund disbursement' : 'Reject refund claim'}
        subtitle={confirmModal.booking ? `${confirmModal.booking.bookingCode} · ${confirmModal.booking.guestName}` : ''}
        size="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <GhostButton onClick={() => setConfirmModal({ open: false, booking: null, action: 'APPROVE', note: '' })}>
              Cancel
            </GhostButton>
            <button
              type="button"
              disabled={busyId === confirmModal.booking?.id}
              onClick={() => handleAction(confirmModal.booking, confirmModal.action, confirmModal.note)}
              className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg px-4 text-xs font-semibold text-white shadow-sm transition disabled:opacity-50 ${
                confirmModal.action === 'APPROVE' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {busyId === confirmModal.booking?.id && <i className="fa-solid fa-circle-notch fa-spin text-xs" />}
              {confirmModal.action === 'APPROVE' ? 'Disburse refund' : 'Reject claim'}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-xs leading-relaxed text-slate-600">
            {confirmModal.action === 'APPROVE'
              ? `You are about to issue a refund of ${formatCurrency(Number(confirmModal.booking?.refundAmount) || 0)} to ${confirmModal.booking?.guestName}. The transaction will be settled to their original payment method.`
              : `You are rejecting the refund claim for ${confirmModal.booking?.guestName}. The booking will remain in CANCELLED status without a refund credit.`}
          </p>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Administrator memo (optional)
            </label>
            <TextArea
              rows={2}
              value={confirmModal.note}
              onChange={(e) => setConfirmModal((prev) => ({ ...prev, note: e.target.value }))}
              placeholder={
                confirmModal.action === 'APPROVE'
                  ? 'e.g., Refund approved per hotel 48-hour policy'
                  : 'e.g., Non-refundable rate policy confirmed with hotel desk'
              }
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

