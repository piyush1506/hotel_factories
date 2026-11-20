'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getStatusMeta, ROLE_LABELS } from '../../utils/helpers';
import { ADMIN_NAV, ADMIN_PAGE_META } from './adminNav';
import { formatShortDate } from './adminUtils';

const RECENTS_KEY = 'hf-admin-recent-searches';
const MAX_RESULTS_PER_GROUP = 5;
const MAX_RECENTS = 6;

const TYPE_TONES = {
  nav: 'bg-slate-50 text-slate-500',
  property: 'bg-slate-50 text-slate-500',
  booking: 'bg-slate-50 text-slate-500',
  user: 'bg-slate-50 text-slate-500',
  coupon: 'bg-slate-50 text-slate-500',
  review: 'bg-slate-50 text-slate-500'
};

function matches(fields, query) {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = fields.filter(Boolean).join(' ').toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

function readRecents() {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENTS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((item) => item && item.focusId && item.tab) : [];
  } catch {
    return [];
  }
}

function buildResults({ query, hotels, bookings, users, coupons, reviews, recents }) {
  const groups = [];
  const cleanQuery = query.trim();

  const navResults = ADMIN_NAV.flatMap((group) =>
    group.items.map((item) => ({
      key: `nav-${item.id}`,
      group: 'Navigate',
      type: 'nav',
      icon: item.icon,
      title: ADMIN_PAGE_META[item.id]?.title || item.label,
      subtitle: ADMIN_PAGE_META[item.id]?.description || group.label,
      meta: group.label,
      tab: item.id,
      focusId: null
    }))
  ).filter((item) => matches([item.title, item.subtitle, item.meta], cleanQuery));

  if (!cleanQuery && recents.length > 0) {
    groups.push({ label: 'Recent', items: recents.slice(0, MAX_RECENTS) });
  }

  if (navResults.length > 0) {
    groups.push({ label: cleanQuery ? 'Navigate' : 'Quick navigation', items: navResults.slice(0, 6) });
  }

  if (cleanQuery) {
    const ownerById = new Map((users || []).map((account) => [account.id, account]));

    const propertyItems = (hotels || [])
      .filter((hotel) => matches([
        hotel.name,
        hotel.city,
        hotel.state,
        hotel.category,
        hotel.address,
        ownerById.get(hotel.ownerId)?.name
      ], cleanQuery))
      .slice(0, MAX_RESULTS_PER_GROUP)
      .map((hotel) => ({
        key: `property-${hotel.id}`,
        group: 'Properties',
        type: 'property',
        icon: 'fa-hotel',
        title: hotel.name,
        subtitle: [hotel.city, hotel.state, hotel.category].filter(Boolean).join(' · '),
        meta: hotel.isVerified ? 'Verified' : 'Pending review',
        tab: 'properties',
        focusId: hotel.id
      }));

    const bookingItems = (bookings || [])
      .filter((booking) => matches([
        booking.bookingCode,
        booking.guestName,
        booking.guestEmail,
        booking.hotelName,
        booking.roomName,
        booking.status
      ], cleanQuery))
      .slice(0, MAX_RESULTS_PER_GROUP)
      .map((booking) => ({
        key: `booking-${booking.id}`,
        group: 'Bookings',
        type: 'booking',
        icon: 'fa-calendar-check',
        title: `${booking.bookingCode} · ${booking.guestName}`,
        subtitle: [booking.hotelName, booking.roomName, formatShortDate(booking.checkInDate)].filter(Boolean).join(' · '),
        meta: getStatusMeta(booking.status).label,
        tab: 'bookings',
        focusId: booking.id
      }));

    const userItems = (users || [])
      .filter((account) => matches([account.name, account.email, account.phone, account.id, ROLE_LABELS[account.role]], cleanQuery))
      .slice(0, MAX_RESULTS_PER_GROUP)
      .map((account) => ({
        key: `user-${account.id}`,
        group: 'Guests & users',
        type: 'user',
        icon: 'fa-user',
        title: account.name,
        subtitle: [account.email, account.phone].filter(Boolean).join(' · '),
        meta: ROLE_LABELS[account.role] || account.role,
        tab: 'customers',
        focusId: account.id
      }));

    const couponItems = (coupons || [])
      .filter((coupon) => matches([coupon.code, coupon.description, coupon.discountType], cleanQuery))
      .slice(0, MAX_RESULTS_PER_GROUP)
      .map((coupon) => ({
        key: `coupon-${coupon.id}`,
        group: 'Coupons',
        type: 'coupon',
        icon: 'fa-ticket',
        title: coupon.code,
        subtitle: coupon.description || 'Promotional campaign',
        meta: coupon.isActive ? 'Active' : 'Paused',
        tab: 'coupons',
        focusId: coupon.id
      }));

    const reviewItems = (reviews || [])
      .filter((review) => matches([review.userName, review.title, review.comment, review.hotelName, review.hotelCity], cleanQuery))
      .slice(0, MAX_RESULTS_PER_GROUP)
      .map((review) => ({
        key: `review-${review.id}`,
        group: 'Reviews',
        type: 'review',
        icon: 'fa-star',
        title: review.title || `${review.userName || 'Guest'} review`,
        subtitle: [review.hotelName, review.userName].filter(Boolean).join(' · '),
        meta: `${review.rating || '—'}★`,
        tab: 'reviews',
        focusId: review.id
      }));

    [
      ['Properties', propertyItems],
      ['Bookings', bookingItems],
      ['Guests & users', userItems],
      ['Coupons', couponItems],
      ['Reviews', reviewItems]
    ].forEach(([label, items]) => {
      if (items.length > 0) groups.push({ label, items });
    });
  }

  return groups.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })));
}

export default function AdminCommandPalette({ onClose, onSelect, data = {}, activeTab }) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const [recents, setRecents] = useState(readRecents);
  const inputRef = useRef(null);
  const itemRefs = useRef({});

  const { hotels = [], bookings = [], users = [], coupons = [], reviews = [] } = data;

  const results = useMemo(
    () => buildResults({ query, hotels, bookings, users, coupons, reviews, recents }),
    [query, hotels, bookings, users, coupons, reviews, recents]
  );

  const activeIndex = results.length === 0 ? -1 : Math.min(cursor, results.length - 1);

  const choose = useCallback(
    (result) => {
      if (!result) return;
      if (result.focusId) {
        setRecents((current) => {
          const next = [result, ...current.filter((item) => !(item.type === result.type && item.focusId === result.focusId))].slice(0, MAX_RECENTS);
          try {
            window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
          } catch {
            /* storage may be unavailable in private browsing */
          }
          return next;
        });
      }
      onSelect(result);
    },
    [onSelect]
  );

  useEffect(() => {
    const selected = results[activeIndex];
    if (selected) itemRefs.current[selected.key]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, results]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        setCursor((current) => {
          if (results.length === 0) return 0;
          return (Math.min(current, results.length - 1) + 1) % results.length;
        });
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setCursor((current) => {
          if (results.length === 0) return 0;
          const clamped = Math.min(current, results.length - 1);
          return (clamped - 1 + results.length) % results.length;
        });
      } else if (event.key === 'Enter') {
        const selected = results[activeIndex];
        if (selected) {
          event.preventDefault();
          choose(selected);
        }
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [results, activeIndex, choose, onClose]);

  const activeDescendant = activeIndex >= 0 ? `admin-command-item-${activeIndex}` : undefined;

  return (
    <div
      className="fixed inset-0 z-[1400] flex items-start justify-center px-3 pt-[7vh] sm:px-4 sm:pt-[11vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Admin command palette"
    >
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-slate-950/55 backdrop-blur-[3px]"
      />
      <div className="admin-command-panel relative flex max-h-[78vh] w-full max-w-[680px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg shadow-slate-900/15">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5">
          <i className="fa-solid fa-magnifying-glass text-[13px] text-slate-400" aria-hidden="true" />
          <input
            ref={inputRef}
            autoFocus
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCursor(0);
            }}
            role="combobox"
            aria-expanded="true"
            aria-controls="admin-command-results"
            aria-activedescendant={activeDescendant}
            aria-autocomplete="list"
            placeholder="Search properties, bookings, guests, coupons…"
            className="h-8 flex-1 bg-transparent text-[14px] font-semibold text-slate-800 outline-none placeholder:font-medium placeholder:text-slate-400"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setCursor(0);
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <i className="fa-solid fa-xmark text-xs" aria-hidden="true" />
            </button>
          ) : (
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs font-semibold text-slate-400">ESC</kbd>
          )}
        </div>

        <div id="admin-command-results" role="listbox" aria-label="Search results" className="admin-scrollbar flex-1 overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-slate-100 text-lg text-slate-400">
                <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm font-semibold text-slate-800">No matches for “{query.trim()}”</p>
              <p className="mt-1 text-xs text-slate-500">Try a booking code, guest email, property name, city or coupon code.</p>
            </div>
          ) : (
            results.map((result, index) => {
              const showGroup = index === 0 || results[index - 1].group !== result.group;
              const active = index === activeIndex;
              return (
                <React.Fragment key={result.key}>
                  {showGroup && (
                    <p className="px-3 pb-1.5 pt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400" role="presentation">
                      {result.group}
                    </p>
                  )}
                  <button
                    ref={(node) => {
                      if (node) itemRefs.current[result.key] = node;
                      else delete itemRefs.current[result.key];
                    }}
                    id={`admin-command-item-${index}`}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setCursor(index)}
                    onClick={() => choose(result)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                      active ? 'bg-slate-100 ring-1 ring-inset ring-slate-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs ${TYPE_TONES[result.type] || TYPE_TONES.nav}`}>
                      <i className={`fa-solid ${result.icon}`} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900">{result.title}</span>
                        {result.tab === activeTab && index > 0 && result.type === 'nav' && (
                          <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Current
                          </span>
                        )}
                      </span>
                      {result.subtitle && <span className="mt-0.5 block truncate text-xs text-slate-500">{result.subtitle}</span>}
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block max-w-[140px] truncate text-xs font-bold uppercase tracking-wide text-slate-400">{result.meta}</span>
                      <span className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${active ? 'text-slate-500' : 'text-transparent'}`}>
                        Open <i className="fa-solid fa-arrow-turn-down rotate-[-90deg] text-xs" aria-hidden="true" />
                      </span>
                    </span>
                  </button>
                </React.Fragment>
              );
            })
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1"><kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 font-semibold">↑</kbd><kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 font-semibold">↓</kbd> navigate</span>
            <span className="inline-flex items-center gap-1"><kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 font-semibold">↵</kbd> open</span>
            <span className="inline-flex items-center gap-1"><kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 font-semibold">esc</kbd> close</span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-slate-400">
            <i className="fa-solid fa-bolt text-xs text-slate-300" aria-hidden="true" />
            Searches {hotels.length} properties · {bookings.length} bookings · {users.length} users
          </span>
        </div>
      </div>
    </div>
  );
}
