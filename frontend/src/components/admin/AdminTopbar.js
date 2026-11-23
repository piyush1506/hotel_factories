'use client';

import React, { useState } from 'react';
import { Avatar } from './AdminUI';

const alertTone = {
  amber: 'bg-slate-100 text-slate-500',
  sky: 'bg-slate-100 text-slate-500',
  rose: 'bg-slate-100 text-slate-500',
  emerald: 'bg-slate-100 text-slate-500'
};

export default function AdminTopbar({ title, description, user, onMenu, onRefresh, loading, onExit, onLogout, alerts = [], onNavigate, onSearch, onOpenScanner }) {
  const [panel, setPanel] = useState(null);
  const alertCount = alerts.reduce((total, alert) => total + (Number(alert.count) || 0), 0);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenu}
            aria-label="Open navigation"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 lg:hidden"
          >
            <i className="fa-solid fa-bars-staggered text-sm" aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
              <span className="hidden sm:inline">Control Center</span>
              <i className="fa-solid fa-chevron-right hidden text-xs sm:inline" aria-hidden="true" />
              <span className="text-slate-500">Admin</span>
            </div>
            <h1 className="truncate font-heading text-sm font-semibold tracking-tight text-slate-900 sm:text-base">{title}</h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-500 xl:flex">
            <i className="fa-regular fa-calendar text-slate-400" aria-hidden="true" />
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </div>

          <button
            type="button"
            onClick={onOpenScanner}
            title="Scan Guest Pass with Camera"
            aria-label="Scan Guest Pass with Camera"
            className="flex h-9 items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 text-xs font-semibold text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-100 active:scale-[0.98]"
          >
            <i className="fa-solid fa-camera text-sky-600" aria-hidden="true" />
            <span className="hidden sm:inline">Scan QR</span>
          </button>

          <button
            type="button"
            onClick={onSearch}
            className="hidden h-9 w-48 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-400 transition hover:border-slate-300 hover:bg-white hover:text-slate-600 xl:flex xl:w-60"
            aria-label="Search admin data"
          >
            <i className="fa-solid fa-magnifying-glass text-xs text-slate-400" aria-hidden="true" />
            <span className="flex-1 text-left">Search anything…</span>
            <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Ctrl K</kbd>
          </button>

          <button
            type="button"
            onClick={onSearch}
            title="Search anything (Ctrl + K)"
            aria-label="Search admin data"
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 xl:hidden"
          >
            <i className="fa-solid fa-magnifying-glass text-xs" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh data"
            aria-label="Refresh data"
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50"
          >
            <i className={`fa-solid fa-rotate text-xs ${loading ? 'fa-spin text-slate-500' : ''}`} aria-hidden="true" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setPanel(panel === 'alerts' ? null : 'alerts')}
              aria-label={`Alerts${alertCount ? ` (${alertCount} pending)` : ''}`}
              aria-expanded={panel === 'alerts'}
              className={`relative grid h-9 w-9 place-items-center rounded-lg border bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 ${
                panel === 'alerts' ? 'border-slate-300 ring-2 ring-slate-100' : 'border-slate-200'
              }`}
            >
              <i className="fa-regular fa-bell text-sm" aria-hidden="true" />
              {alertCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-xs font-semibold text-white ring-2 ring-white">
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
            </button>
            {panel === 'alerts' && (
              <>
                <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="Close alerts" onClick={() => setPanel(null)} />
                <div className="absolute right-0 top-11 z-50 w-[300px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg shadow-slate-900/10">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Needs attention</p>
                      <p className="text-xs text-slate-500">{alertCount} pending platform items</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">LIVE</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto p-2">
                    {alerts.length === 0 ? (
                      <div className="px-3 py-8 text-center">
                        <i className="fa-solid fa-circle-check text-xl text-slate-400" aria-hidden="true" />
                        <p className="mt-2 text-xs font-bold text-slate-700">All caught up</p>
                        <p className="text-xs text-slate-400">No pending approvals or settlements.</p>
                      </div>
                    ) : (
                      alerts.map((alert) => (
                        <button
                          key={alert.id}
                          type="button"
                          onClick={() => {
                            onNavigate(alert.tab);
                            setPanel(null);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition hover:bg-slate-50"
                        >
                          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs ${alertTone[alert.tone] || alertTone.amber}`}>
                            <i className={`fa-solid ${alert.icon}`} aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-bold text-slate-800">{alert.label}</span>
                            <span className="block truncate text-xs text-slate-400">{alert.detail}</span>
                          </span>
                          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-slate-100 px-1 text-xs font-semibold text-slate-600">
                            {alert.count}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mx-0.5 hidden h-6 w-px bg-slate-200 sm:block" />

          <div className="relative">
            <button
              type="button"
              onClick={() => setPanel(panel === 'profile' ? null : 'profile')}
              aria-expanded={panel === 'profile'}
              aria-label="Open administrator menu"
              className="flex items-center gap-2 rounded-lg p-1 pr-2 transition hover:bg-slate-50"
            >
              <Avatar name={user?.name} src={user?.avatar} size="sm" />
              <span className="hidden text-left md:block">
                <span className="block max-w-[170px] truncate text-xs font-semibold leading-tight text-slate-800">{user?.name || 'Administrator'}</span>
                <span className="block text-xs font-medium text-slate-500">Platform admin</span>
              </span>
              <i className="fa-solid fa-chevron-down hidden text-xs text-slate-400 md:inline" aria-hidden="true" />
            </button>
            {panel === 'profile' && (
              <>
                <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="Close profile menu" onClick={() => setPanel(null)} />
                <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/10">
                  <div className="border-b border-slate-100 px-3 py-2.5">
                    <p className="truncate text-xs font-semibold text-slate-900">{user?.name || 'Administrator'}</p>
                    <p className="truncate text-xs text-slate-400">{user?.email || '—'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPanel(null);
                      onExit();
                    }}
                    className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    <i className="fa-solid fa-globe w-3.5 text-center text-xs text-slate-400" aria-hidden="true" />
                    View hotel website
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPanel(null);
                      onLogout();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    <i className="fa-solid fa-arrow-right-from-bracket w-3.5 text-center text-xs" aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {description && <div className="sr-only">{description}</div>}
    </header>
  );
}
