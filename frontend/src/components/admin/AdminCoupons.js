'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge,
  ConfirmDialog,
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
  SelectInput,
  TableShell,
  TextArea,
  TextInput
} from './AdminUI';
import { downloadCsv, formatCurrency, formatDate, formatNumber } from './adminUtils';

function couponStatus(coupon) {
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
    return { key: 'expired', label: 'Expired', tone: 'rose' };
  }
  if (!coupon.isActive) return { key: 'paused', label: 'Paused', tone: 'slate' };
  return { key: 'active', label: 'Active', tone: 'sky' };
}

function daysUntil(value) {
  if (!value) return null;
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86400000);
}

function dateInputValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function defaultExpiry(days = 90) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

function emptyForm() {
  return {
    code: '',
    description: '',
    discountType: 'PERCENT',
    discountValue: '15',
    minBookingAmount: '1000',
    maxDiscountCap: '2000',
    expiresAt: defaultExpiry(),
    isActive: true
  };
}

function formFromCoupon(coupon) {
  return {
    code: coupon.code || '',
    description: coupon.description || '',
    discountType: coupon.discountType || 'PERCENT',
    discountValue: String(coupon.discountValue ?? ''),
    minBookingAmount: String(coupon.minBookingAmount ?? ''),
    maxDiscountCap: String(coupon.maxDiscountCap ?? ''),
    expiresAt: dateInputValue(coupon.expiresAt),
    isActive: Boolean(coupon.isActive)
  };
}

function offerSummary(coupon) {
  if (coupon.discountType === 'FLAT') return `${formatCurrency(coupon.discountValue)} off`;
  return `${Number(coupon.discountValue) || 0}% off`;
}

export default function AdminCoupons({ coupons = [], onCreate, onUpdate, onDelete, createSignal = 0, focusRequest }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [formOpen, setFormOpen] = useState(createSignal > 0);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const handledFocus = useRef(null);

  const decorated = useMemo(
    () => coupons.map((coupon) => ({ ...coupon, statusMeta: couponStatus(coupon) })),
    [coupons]
  );

  const counts = useMemo(() => {
    return {
      all: decorated.length,
      active: decorated.filter((coupon) => coupon.statusMeta.key === 'active').length,
      expired: decorated.filter((coupon) => coupon.statusMeta.key === 'expired').length,
      paused: decorated.filter((coupon) => coupon.statusMeta.key === 'paused').length
    };
  }, [decorated]);

  const stats = useMemo(() => {
    const redemptions = coupons.reduce((sum, coupon) => sum + (Number(coupon.usageCount) || 0), 0);
    const expiring = decorated.filter((coupon) => {
      if (coupon.statusMeta.key !== 'active') return false;
      const days = daysUntil(coupon.expiresAt);
      return days !== null && days >= 0 && days <= 30;
    }).length;
    const flat = coupons.filter((coupon) => coupon.discountType === 'FLAT').length;
    return { redemptions, expiring, flat, percent: coupons.length - flat };
  }, [coupons, decorated]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return decorated
      .filter((coupon) => {
        const matchesQuery =
          !query ||
          [coupon.code, coupon.description, coupon.discountType]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));
        const matchesStatus = statusFilter === 'all' || coupon.statusMeta.key === statusFilter;
        return matchesQuery && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'expiry') return new Date(a.expiresAt || 0) - new Date(b.expiresAt || 0);
        if (sortBy === 'usage') return (Number(b.usageCount) || 0) - (Number(a.usageCount) || 0);
        if (sortBy === 'value') return (Number(b.discountValue) || 0) - (Number(a.discountValue) || 0);
        return new Date(b.createdAt || b.expiresAt || 0) - new Date(a.createdAt || a.expiresAt || 0);
      });
  }, [decorated, search, statusFilter, sortBy]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = useCallback((coupon) => {
    setEditing(coupon);
    setForm(formFromCoupon(coupon));
    setFormError('');
    setFormOpen(true);
  }, []);

  useEffect(() => {
    if (!focusRequest || focusRequest.type !== 'coupon' || handledFocus.current === focusRequest.nonce) return undefined;
    const frame = window.requestAnimationFrame(() => {
      handledFocus.current = focusRequest.nonce;
      const coupon = coupons.find((item) => item.id === focusRequest.id);
      if (coupon) openEdit(coupon);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusRequest, coupons, openEdit]);

  const update = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setFormError('');

    const code = form.code.trim().toUpperCase();
    const discountValue = Number(form.discountValue);
    const minBookingAmount = Number(form.minBookingAmount);
    const maxDiscountCap = Number(form.maxDiscountCap);

    if (!editing && !/^[A-Z0-9_-]{3,24}$/.test(code)) {
      setFormError('Coupon code must be 3–24 characters using letters, numbers, hyphens or underscores.');
      return;
    }
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      setFormError('Discount value must be greater than zero.');
      return;
    }
    if (form.discountType === 'PERCENT' && discountValue > 100) {
      setFormError('A percentage discount cannot exceed 100%.');
      return;
    }
    if (!Number.isFinite(minBookingAmount) || minBookingAmount < 0) {
      setFormError('Minimum booking amount cannot be negative.');
      return;
    }
    if (!Number.isFinite(maxDiscountCap) || maxDiscountCap <= 0) {
      setFormError('Maximum discount cap must be greater than zero.');
      return;
    }
    if (!form.expiresAt || Number.isNaN(new Date(`${form.expiresAt}T23:59:59`).getTime())) {
      setFormError('Select a valid expiry date.');
      return;
    }

    const payload = {
      code,
      description: form.description.trim(),
      discountType: form.discountType,
      discountValue,
      minBookingAmount,
      maxDiscountCap,
      expiresAt: new Date(`${form.expiresAt}T23:59:59`).toISOString(),
      isActive: form.isActive
    };

    setSaving(true);
    try {
      const ok = editing ? await onUpdate(editing, payload) : await onCreate(payload);
      if (ok) {
        setFormOpen(false);
        setEditing(null);
        setForm(emptyForm());
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon) => {
    setPending(coupon.id);
    try {
      await onUpdate(coupon, { isActive: !coupon.isActive });
    } finally {
      setPending('');
    }
  };

  const removeCoupon = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      const ok = await onDelete(deleteTarget);
      if (ok) setDeleteTarget(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  const exportCoupons = () => {
    downloadCsv(
      `hotel-factories-coupons-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { label: 'Code', key: 'code' },
        { label: 'Description', key: 'description' },
        { label: 'Type', key: 'discountType' },
        { label: 'Value', key: 'discountValue' },
        { label: 'Min booking', key: 'minBookingAmount' },
        { label: 'Max discount', key: 'maxDiscountCap' },
        { label: 'Expires', key: 'expiresAt' },
        { label: 'Active', value: (row) => (row.isActive ? 'Yes' : 'No') },
        { label: 'Redemptions', key: 'usageCount' }
      ],
      filtered
    );
  };

  return (
    <div className="admin-fade-up">
      <PageHeader
        eyebrow="Commerce"
        title="Coupons"
        description="Design promotional offers, control redemption caps and keep an eye on campaigns that are about to expire."
        actions={
          <>
            <GhostButton icon="fa-file-arrow-down" onClick={exportCoupons}>Export CSV</GhostButton>
            <PrimaryButton icon="fa-plus" onClick={openCreate}>Create coupon</PrimaryButton>
          </>
        }
        meta={<Badge tone="sky" dot>{counts.active} live campaigns</Badge>}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CouponStat label="Total campaigns" value={formatNumber(counts.all)} icon="fa-ticket" tone="sky" hint={`${stats.flat} flat · ${stats.percent} percent`} />
        <CouponStat label="Live coupons" value={formatNumber(counts.active)} icon="fa-circle-check" tone="sky" hint={`${counts.paused} paused`} />
        <CouponStat label="Expiring in 30 days" value={formatNumber(stats.expiring)} icon="fa-hourglass-half" tone="amber" hint={`${counts.expired} already expired`} />
        <CouponStat label="Total redemptions" value={formatNumber(stats.redemptions)} icon="fa-receipt" tone="violet" hint="across all campaigns" />
      </div>

      <Panel>
        <PanelHeader
          title="Campaign library"
          subtitle={`${filtered.length} of ${coupons.length} coupons`}
          icon="fa-tags"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <SearchField value={search} onChange={setSearch} placeholder="Search code or description" className="w-full sm:w-64" />
              <FilterSelect
                value={sortBy}
                onChange={setSortBy}
                ariaLabel="Sort coupons"
                options={[
                  { value: 'newest', label: 'Newest first' },
                  { value: 'expiry', label: 'Expiring soonest' },
                  { value: 'usage', label: 'Most redeemed' },
                  { value: 'value', label: 'Highest value' }
                ]}
              />
            </div>
          }
        />
        <div className="px-5 pb-3 sm:px-6">
          <SegmentedTabs
            value={statusFilter}
            onChange={setStatusFilter}
            tabs={[
              { value: 'all', label: 'All coupons', count: counts.all },
              { value: 'active', label: 'Active', count: counts.active },
              { value: 'paused', label: 'Paused', count: counts.paused },
              { value: 'expired', label: 'Expired', count: counts.expired }
            ]}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 pb-6 sm:px-6">
            <EmptyState
              icon="fa-ticket"
              title="No coupons found"
              description="Adjust the filters or create a new campaign to drive more direct bookings."
              action={<PrimaryButton icon="fa-plus" onClick={openCreate}>Create coupon</PrimaryButton>}
            />
          </div>
        ) : (
          <TableShell>
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3 sm:px-6 whitespace-nowrap">Coupon</th>
                  <th className="px-3 py-3">Offer</th>
                  <th className="px-3 py-3">Conditions</th>
                  <th className="px-3 py-3 whitespace-nowrap">Validity</th>
                  <th className="px-3 py-3 whitespace-nowrap">Redemptions</th>
                  <th className="px-3 py-3 whitespace-nowrap">Status</th>
                  <th className="px-5 py-3 text-right sm:px-6 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((coupon) => {
                  const days = daysUntil(coupon.expiresAt);
                  return (
                    <tr key={coupon.id} className="group transition hover:bg-slate-50">
                      <td className="px-5 py-3.5 sm:px-6 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1 font-mono text-sm font-semibold tracking-wide text-white whitespace-nowrap">
                          <i className="fa-solid fa-ticket text-xs text-blue-300" aria-hidden="true" />
                          {coupon.code}
                        </span>
                        <p className="mt-1 max-w-[240px] truncate text-xs text-slate-500">{coupon.description || 'No description'}</p>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="block text-sm font-bold text-slate-900">{offerSummary(coupon)}</span>
                        <span className="block text-xs uppercase tracking-wide text-slate-500">{coupon.discountType === 'FLAT' ? 'Flat discount' : 'Percentage discount'}</span>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="block text-sm font-semibold text-slate-700">Min. {formatCurrency(coupon.minBookingAmount)}</span>
                        <span className="block text-xs text-slate-500">Cap {formatCurrency(coupon.maxDiscountCap)}</span>
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span className="block text-sm font-semibold text-slate-700 whitespace-nowrap">{formatDate(coupon.expiresAt)}</span>
                        <span className={`block text-xs whitespace-nowrap ${coupon.statusMeta.key === 'expired' ? 'text-rose-500' : days !== null && days <= 30 ? 'text-amber-600' : 'text-slate-500'}`}>
                          {coupon.statusMeta.key === 'expired' ? 'Ended' : days === null ? 'No expiry' : days === 0 ? 'Ends today' : `${days} day${days === 1 ? '' : 's'} left`}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span className="block text-sm font-bold text-slate-900 whitespace-nowrap">{formatNumber(coupon.usageCount)}</span>
                        <span className="block text-xs text-slate-500 whitespace-nowrap">redemptions</span>
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <Badge tone={coupon.statusMeta.tone} dot>{coupon.statusMeta.label}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right sm:px-6 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleActive(coupon)}
                            disabled={pending === coupon.id || coupon.statusMeta.key === 'expired'}
                            title={coupon.isActive ? 'Pause coupon' : 'Activate coupon'}
                            aria-label={coupon.isActive ? `Pause ${coupon.code}` : `Activate ${coupon.code}`}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <i className={`fa-solid ${pending === coupon.id ? 'fa-circle-notch fa-spin' : coupon.isActive ? 'fa-pause' : 'fa-play'} text-xs`} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(coupon)}
                            title="Edit coupon"
                            aria-label={`Edit ${coupon.code}`}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-300 hover:text-blue-600"
                          >
                            <i className="fa-solid fa-pen text-xs" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(coupon)}
                            title="Delete coupon"
                            aria-label={`Delete ${coupon.code}`}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <i className="fa-solid fa-trash-can text-xs" aria-hidden="true" />
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

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit ${editing.code}` : 'Create a coupon'}
        subtitle={editing ? 'Update the offer terms. The coupon code cannot be changed.' : 'Set the discount, redemption limits and validity window.'}
        size="max-w-2xl"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-600">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={update('isActive')}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              {form.isActive ? 'Live — customers can apply this coupon' : 'Paused — hidden from checkout'}
            </label>
            <div className="flex gap-2">
              <GhostButton onClick={() => setFormOpen(false)} disabled={saving}>Cancel</GhostButton>
              <PrimaryButton type="submit" form="admin-coupon-form" icon="fa-floppy-disk" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Create coupon'}
              </PrimaryButton>
            </div>
          </div>
        }
      >
        <form id="admin-coupon-form" onSubmit={submit} className="space-y-4">
          {formError && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">
              <i className="fa-solid fa-triangle-exclamation mt-0.5" aria-hidden="true" />
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Coupon code" htmlFor="coupon-code" hint={editing ? 'Codes are permanent once created.' : 'Letters, numbers, hyphens and underscores.'}>
              <TextInput
                id="coupon-code"
                value={form.code}
                onChange={update('code')}
                placeholder="e.g. SUMMER25"
                disabled={Boolean(editing)}
                required
                className="font-mono uppercase tracking-wide"
              />
            </Field>
            <Field label="Expiry date" htmlFor="coupon-expiry">
              <TextInput id="coupon-expiry" type="date" value={form.expiresAt} onChange={update('expiresAt')} required />
            </Field>
            <Field label="Description" htmlFor="coupon-description" className="sm:col-span-2">
              <TextArea
                id="coupon-description"
                rows={2}
                value={form.description}
                onChange={update('description')}
                placeholder="Customer-facing offer description shown at checkout"
              />
            </Field>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
              <i className="fa-solid fa-percent text-blue-500" aria-hidden="true" /> Discount rules
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Discount type" htmlFor="coupon-type">
                <SelectInput id="coupon-type" value={form.discountType} onChange={update('discountType')}>
                  <option value="PERCENT">Percentage off</option>
                  <option value="FLAT">Flat amount off</option>
                </SelectInput>
              </Field>
              <Field
                label={form.discountType === 'PERCENT' ? 'Discount percentage' : 'Discount amount (₹)'}
                htmlFor="coupon-value"
                hint={form.discountType === 'PERCENT' ? 'Applied to the room tariff before taxes.' : 'Capped by the maximum discount below.'}
              >
                <TextInput
                  id="coupon-value"
                  type="number"
                  min="1"
                  max={form.discountType === 'PERCENT' ? 100 : undefined}
                  value={form.discountValue}
                  onChange={update('discountValue')}
                  required
                />
              </Field>
              <Field label="Minimum booking amount (₹)" htmlFor="coupon-min">
                <TextInput id="coupon-min" type="number" min="0" value={form.minBookingAmount} onChange={update('minBookingAmount')} />
              </Field>
              <Field label="Maximum discount cap (₹)" htmlFor="coupon-cap">
                <TextInput id="coupon-cap" type="number" min="1" value={form.maxDiscountCap} onChange={update('maxDiscountCap')} required />
              </Field>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs leading-relaxed text-slate-600">
            <i className="fa-solid fa-circle-info mr-1 text-slate-500" aria-hidden="true" />
            Customers see {form.discountType === 'FLAT'
              ? `${formatCurrency(Number(form.discountValue) || 0)} off`
              : `${Number(form.discountValue) || 0}% off`} on bookings above {formatCurrency(Number(form.minBookingAmount) || 0)}, capped at {formatCurrency(Number(form.maxDiscountCap) || 0)}.
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={removeCoupon}
        title="Delete coupon?"
        message={
          deleteTarget
            ? `"${deleteTarget.code}" will be removed permanently. Existing bookings keep the discount they already received, but the code can no longer be redeemed.`
            : ''
        }
        confirmLabel="Delete coupon"
        busy={deleteBusy}
      />
    </div>
  );
}

function CouponStat({ label, value, icon, hint }) {
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
