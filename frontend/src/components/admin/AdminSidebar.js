'use client';

import React from 'react';
import { ADMIN_NAV } from './adminNav';
import { Avatar } from './AdminUI';

export default function AdminSidebar({ activeTab, onSelect, mobileOpen, onClose, user, onLogout, onExit, badges = {}, onSearch }) {
  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-[70] bg-slate-950/50 backdrop-blur-[2px] lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-[80] flex w-[262px] flex-col border-r border-slate-200 bg-white text-slate-900 transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Admin navigation"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5">
          <button type="button" onClick={onExit} className="group flex items-center gap-2.5 text-left" aria-label="Go to hotel website">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-xs text-white transition group-hover:bg-slate-700">
              <i className="fa-solid fa-hotel" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-[14px] font-semibold leading-tight tracking-tight text-slate-900">Hotel Factories</span>
              <span className="block text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Control Center</span>
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <div className="px-3.5 pb-1 pt-3.5">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Platform live
            </span>
            <span className="text-xs font-medium text-slate-400">v1.1</span>
          </div>
          <button
            type="button"
            onClick={onSearch}
            className="mt-2 flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-400 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600"
          >
            <i className="fa-solid fa-magnifying-glass w-3.5 text-center text-xs text-slate-400" aria-hidden="true" />
            <span className="flex-1 text-left">Search anything…</span>
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Ctrl K</kbd>
          </button>
        </div>

        <nav className="admin-sidebar-scroll flex-1 overflow-y-auto px-3 pb-4 pt-3" aria-label="Administration sections">
          {ADMIN_NAV.map((group) => (
            <div key={group.label} className="mb-4 last:mb-0">
              <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = activeTab === item.id;
                  const badge = item.badgeKey ? badges[item.badgeKey] : 0;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelect(item.id);
                        onClose();
                      }}
                      aria-current={active ? 'page' : undefined}
                      className={`group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition ${
                        active
                          ? 'bg-slate-100 font-semibold text-slate-900'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {active && <span className="absolute -left-3 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full bg-blue-600" />}
                      <i className={`fa-solid ${item.icon} w-4 text-center text-[13px] ${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} aria-hidden="true" />
                      <span className="flex-1">{item.label}</span>
                      {badge > 0 && (
                        <span
                          className={`grid h-4 min-w-4 place-items-center rounded px-1.5 text-xs font-bold ${
                            active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-slate-200 p-3">
          <button
            type="button"
            onClick={onExit}
            className="mb-2 flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <i className="fa-solid fa-arrow-up-right-from-square w-3.5 text-center text-xs" aria-hidden="true" />
            Back to hotel website
          </button>
          <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-2">
            <Avatar name={user?.name} src={user?.avatar} size="sm" className="ring-white" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-900">{user?.name || 'Administrator'}</p>
              <p className="truncate text-xs font-medium text-slate-500">{user?.email || 'admin@hotelfactories.com'}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Sign out"
              title="Sign out"
              className="grid h-7 w-7 place-items-center rounded text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
            >
              <i className="fa-solid fa-arrow-right-from-bracket text-xs" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
