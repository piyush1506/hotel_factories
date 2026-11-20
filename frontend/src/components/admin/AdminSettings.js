'use client';

import React, { useState } from 'react';
import {
  Avatar,
  Badge,
  ConfirmDialog,
  DetailRow,
  GhostButton,
  PageHeader,
  Panel,
  PanelHeader,
  PrimaryButton
} from './AdminUI';
import { downloadJson, formatNumber } from './adminUtils';
import { ROLE_LABELS } from '../../utils/helpers';

const PLATFORM_VERSION = 'v1.0.0';

const QUICK_LINKS = [
  { tab: 'properties', label: 'Properties', description: 'Approvals, commissions and room inventory', icon: 'fa-hotel', tone: 'bg-slate-50 text-slate-500' },
  { tab: 'bookings', label: 'Bookings', description: 'Reservations, check-ins and cancellations', icon: 'fa-calendar-check', tone: 'bg-slate-50 text-slate-500' },
  { tab: 'finance', label: 'Finance', description: 'Escrow health and hotel settlements', icon: 'fa-building-columns', tone: 'bg-slate-50 text-slate-500' },
  { tab: 'reviews', label: 'Reviews', description: 'Guest sentiment and public responses', icon: 'fa-star', tone: 'bg-slate-50 text-slate-500' }
];

export default function AdminSettings({
  user,
  metrics,
  hotels = [],
  bookings = [],
  users = [],
  coupons = [],
  reviews = [],
  payoutOverview,
  loading = false,
  onRefresh,
  onResetSeed,
  onNavigate,
  onLogout,
  onExit,
  showToast
}) {
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  const pendingPayouts = (payoutOverview?.pendingBookings || []).filter((booking) => booking.payoutStatus === 'READY_FOR_PAYOUT').length;

  const dataRows = [
    { label: 'Properties', value: hotels.length, tab: 'properties', icon: 'fa-hotel' },
    { label: 'Room types', value: hotels.reduce((sum, hotel) => sum + (Number(hotel.roomsCount) || 0), 0), tab: 'properties', icon: 'fa-bed' },
    { label: 'Bookings', value: bookings.length, tab: 'bookings', icon: 'fa-calendar-check' },
    { label: 'User accounts', value: users.length, tab: 'customers', icon: 'fa-users' },
    { label: 'Coupons', value: coupons.length, tab: 'coupons', icon: 'fa-ticket' },
    { label: 'Guest reviews', value: reviews.length, tab: 'reviews', icon: 'fa-star' }
  ];
  const recordTotal = dataRows.reduce((sum, row) => sum + row.value, 0);

  const exportSnapshot = () => {
    const generatedAt = new Date().toISOString();
    downloadJson(`hotel-factories-workspace-${generatedAt.slice(0, 10)}.json`, {
      platform: 'Hotel Factories',
      version: PLATFORM_VERSION,
      generatedAt,
      generatedBy: user ? { id: user.id, name: user.name, email: user.email, role: user.role } : null,
      metrics,
      hotels,
      bookings,
      users: users.map((account) => {
        const safe = { ...account };
        delete safe.password;
        return safe;
      }),
      coupons,
      reviews,
      payouts: payoutOverview
    });
    showToast('Workspace snapshot downloaded');
  };

  const reset = async () => {
    setResetting(true);
    try {
      const ok = await onResetSeed();
      if (ok) setResetOpen(false);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="admin-fade-up">
      <PageHeader
        eyebrow="System"
        title="Settings"
        description="Inspect the workspace, manage platform data and perform controlled maintenance on the Hotel Factories control center."
        actions={
          <>
            <GhostButton icon="fa-rotate" onClick={onRefresh} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh data'}
            </GhostButton>
            <PrimaryButton icon="fa-file-export" onClick={exportSnapshot}>Export snapshot</PrimaryButton>
          </>
        }
        meta={<Badge tone="sky" dot>All systems operational</Badge>}
      />

      <div className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
        <Panel className="xl:col-span-7">
          <PanelHeader title="Platform profile" subtitle="Runtime and workspace configuration" icon="fa-hotel" />
          <div className="px-5 pb-5 sm:px-6">
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-slate-900 text-lg text-slate-400">
                <i className="fa-solid fa-hotel" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-heading text-[15px] font-semibold tracking-tight text-slate-900">Hotel Factories</p>
                <p className="text-xs font-semibold text-slate-500">Hospitality marketplace · Admin control center</p>
              </div>
              <Badge tone="sky" className="ml-auto">{PLATFORM_VERSION}</Badge>
            </div>
            <div className="space-y-0.5">
              <DetailRow label="Environment" value={process.env.NODE_ENV || 'development'} />
              <DetailRow label="API base URL" value={<span className="font-mono text-xs">{apiBase}</span>} />
              <DetailRow label="Workspace timezone" value={timezone} />
              <DetailRow label="Presentation currency" value="Indian Rupee (INR)" />
              <DetailRow label="Active properties" value={formatNumber((metrics?.counts?.verifiedHotels ?? hotels.filter((hotel) => hotel.isVerified).length))} />
              <DetailRow label="Pending settlements" value={formatNumber(pendingPayouts)} />
              <DetailRow label="Last data refresh" value={new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })} />
            </div>
          </div>
        </Panel>

        <Panel className="xl:col-span-5">
          <PanelHeader title="Workspace records" subtitle="Live footprint of the platform database" icon="fa-database" />
          <div className="px-5 pb-5 sm:px-6">
            <div className="mb-4 flex items-end justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Total records</p>
                <p className="font-heading text-3xl font-semibold leading-tight tracking-tight text-slate-900">{formatNumber(recordTotal)}</p>
              </div>
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200">
                <i className="fa-solid fa-database" aria-hidden="true" />
              </span>
            </div>
            <div className="space-y-2.5">
              {dataRows.slice(0, 4).map((row) => (
                <div key={row.label} className="flex items-center gap-2.5">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-xs text-slate-500">
                    <i className={`fa-solid ${row.icon}`} aria-hidden="true" />
                  </span>
                  <span className="flex-1 text-xs font-semibold text-slate-600">{row.label}</span>
                  <span className="text-xs font-semibold text-slate-900">{formatNumber(row.value)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => onNavigate('bookings')} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900">
                <i className="fa-solid fa-calendar-check mr-1.5 text-xs text-slate-400" aria-hidden="true" /> Bookings
              </button>
              <button type="button" onClick={() => onNavigate('customers')} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900">
                <i className="fa-solid fa-users mr-1.5 text-xs text-slate-400" aria-hidden="true" /> Users
              </button>
            </div>
          </div>
        </Panel>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
        <Panel className="xl:col-span-7">
          <PanelHeader title="Data directory" subtitle="Jump directly into any dataset" icon="fa-folder-tree" />
          <div className="divide-y divide-slate-100">
            {dataRows.map((row) => (
              <div key={row.label} className="flex flex-wrap items-center gap-3 px-5 py-3 sm:px-6">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs text-slate-500">
                  <i className={`fa-solid ${row.icon}`} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold text-slate-800">{row.label}</span>
                  <span className="block text-xs text-slate-400">{formatNumber(row.value)} records available</span>
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate(row.tab)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                >
                  Manage <i className="fa-solid fa-arrow-right text-xs" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-5 xl:col-span-5">
          <Panel>
            <PanelHeader title="Administrator session" subtitle="Current access and identity" icon="fa-user-shield" />
            <div className="px-5 pb-5 sm:px-6">
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
                <Avatar name={user?.name} src={user?.avatar} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-900">{user?.name || 'Administrator'}</p>
                  <p className="truncate text-xs text-slate-400">{user?.email || '—'}</p>
                  <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{ROLE_LABELS[user?.role] || 'Platform Admin'}</p>
                </div>
              </div>
              <div className="mt-3 space-y-0.5">
                <DetailRow label="User ID" value={<span className="font-mono text-xs">{user?.id || '—'}</span>} />
                <DetailRow label="Access level" value="Full platform control" />
                <DetailRow label="Authentication" value="JWT bearer session" />
              </div>
              <div className="mt-4 flex gap-2">
                <GhostButton icon="fa-globe" onClick={onExit} className="flex-1">View website</GhostButton>
                <GhostButton icon="fa-arrow-right-from-bracket" onClick={onLogout} className="flex-1 text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                  Sign out
                </GhostButton>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Quick links" subtitle="Common administration tasks" icon="fa-bolt" />
            <div className="grid grid-cols-1 gap-2 px-5 pb-5 sm:grid-cols-2 sm:px-6">
              {QUICK_LINKS.map((link) => (
                <button
                  key={link.tab}
                  type="button"
                  onClick={() => onNavigate(link.tab)}
                  className="group flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs ${link.tone}`}>
                    <i className={`fa-solid ${link.icon}`} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-slate-800">{link.label}</span>
                    <span className="block text-xs leading-snug text-slate-400">{link.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <Panel className="border-rose-200/80">
        <PanelHeader
          title="Data maintenance"
          subtitle="Controlled operations that affect the entire workspace"
          icon="fa-triangle-exclamation"
          action={<Badge tone="rose">Restricted</Badge>}
        />
        <div className="px-5 pb-5 sm:px-6">
          <div className="flex flex-col gap-4 rounded-lg border border-rose-100 bg-rose-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <h3 className="text-sm font-semibold text-rose-900">Reset workspace to seed data</h3>
              <p className="mt-1 text-xs leading-relaxed text-rose-700/80">
                Deletes all properties, rooms, bookings, payouts, coupons, reviews and non-seed accounts, then restores the original demo catalogue and administrator login. This action cannot be undone.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700"
            >
              <i className="fa-solid fa-rotate-left text-xs" aria-hidden="true" />
              Reset workspace
            </button>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 py-3">
              <p className="text-xs font-semibold text-slate-700">Download a backup first</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">Export a JSON snapshot of every dataset before performing destructive maintenance.</p>
              <button type="button" onClick={exportSnapshot} className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700">
                Export snapshot →
              </button>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3.5 py-3">
              <p className="text-xs font-semibold text-slate-700">Need to refresh instead?</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">Reload all admin datasets without changing any records. Safe to use at any time.</p>
              <button type="button" onClick={onRefresh} disabled={loading} className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50">
                {loading ? 'Refreshing…' : 'Refresh data →'}
              </button>
            </div>
          </div>
        </div>
      </Panel>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={reset}
        title="Reset the entire workspace?"
        message="Every property, room, booking, payout, coupon, review and non-seed account will be deleted. The platform will return to its original demo dataset. This cannot be undone."
        confirmLabel="Yes, reset everything"
        busy={resetting}
      />
    </div>
  );
}
