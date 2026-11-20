'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar,
  Badge,
  Drawer,
  EmptyState,
  Field,
  FilterSelect,
  GhostButton,
  PageHeader,
  Panel,
  PanelHeader,
  PrimaryButton,
  SearchField,
  SegmentedTabs,
  TableShell,
  TextArea
} from './AdminUI';
import { downloadCsv, formatDate, formatDateTime, percent } from './adminUtils';
import { PRESET_IMAGES } from '../../utils/helpers';

const RATING_KEYS = [
  { key: 'cleanlinessRating', summaryKey: 'cleanliness', label: 'Cleanliness', icon: 'fa-brush' },
  { key: 'serviceRating', summaryKey: 'service', label: 'Service', icon: 'fa-concierge-bell' },
  { key: 'locationRating', summaryKey: 'location', label: 'Location', icon: 'fa-location-dot' },
  { key: 'valueRating', summaryKey: 'value', label: 'Value', icon: 'fa-tag' }
];

function ratingTone(rating) {
  if (rating >= 4.5) return 'sky';
  if (rating >= 3.5) return 'sky';
  if (rating >= 2.5) return 'amber';
  return 'rose';
}

function average(list, key) {
  if (!list.length) return 0;
  const total = list.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);
  return Math.round((total / list.length) * 10) / 10;
}

export default function AdminReviews({ reviews = [], onReply, onNavigate, focusRequest }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedId, setSelectedId] = useState(null);
  const [reply, setReply] = useState('');
  const [replyError, setReplyError] = useState('');
  const [sending, setSending] = useState(false);
  const handledFocus = useRef(null);

  const selected = reviews.find((review) => review.id === selectedId) || null;

  const counts = useMemo(() => {
    const answered = reviews.filter((review) => Boolean(review.hotelResponse)).length;
    return {
      all: reviews.length,
      answered,
      unanswered: reviews.length - answered
    };
  }, [reviews]);

  const summary = useMemo(() => {
    const rated = reviews.filter((review) => Number(review.rating));
    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: rated.filter((review) => Math.round(Number(review.rating)) === star).length
    }));
    return {
      average: rated.length ? Math.round((rated.reduce((sum, review) => sum + Number(review.rating), 0) / rated.length) * 10) / 10 : 0,
      distribution,
      cleanliness: average(rated, 'cleanlinessRating'),
      service: average(rated, 'serviceRating'),
      location: average(rated, 'locationRating'),
      value: average(rated, 'valueRating')
    };
  }, [reviews]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reviews
      .filter((review) => {
        const matchesQuery =
          !query ||
          [review.userName, review.title, review.comment, review.hotelName, review.hotelCity]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'answered' && review.hotelResponse) ||
          (statusFilter === 'unanswered' && !review.hotelResponse);
        const matchesRating = ratingFilter === 'all' || Math.round(Number(review.rating)) === Number(ratingFilter);
        return matchesQuery && matchesStatus && matchesRating;
      })
      .sort((a, b) => {
        if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        if (sortBy === 'highest') return (Number(b.rating) || 0) - (Number(a.rating) || 0);
        if (sortBy === 'lowest') return (Number(a.rating) || 0) - (Number(b.rating) || 0);
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
  }, [reviews, search, statusFilter, ratingFilter, sortBy]);

  const openReview = useCallback((review) => {
    setSelectedId(review.id);
    setReply(review.hotelResponse || '');
    setReplyError('');
  }, []);

  useEffect(() => {
    if (!focusRequest || focusRequest.type !== 'review' || handledFocus.current === focusRequest.nonce) return undefined;
    const frame = window.requestAnimationFrame(() => {
      handledFocus.current = focusRequest.nonce;
      const review = reviews.find((item) => item.id === focusRequest.id);
      if (review) openReview(review);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusRequest, reviews, openReview]);

  const submitReply = async () => {
    if (!selected) return;
    setReplyError('');
    const text = reply.trim();
    if (text.length < 3) {
      setReplyError('Write at least a short sentence before posting the response.');
      return;
    }
    setSending(true);
    try {
      const ok = await onReply(selected, text);
      if (ok) setReply(text);
    } finally {
      setSending(false);
    }
  };

  const exportReviews = () => {
    downloadCsv(
      `hotel-factories-reviews-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { label: 'Review ID', key: 'id' },
        { label: 'Guest', key: 'userName' },
        { label: 'Property', key: 'hotelName' },
        { label: 'Rating', key: 'rating' },
        { label: 'Title', key: 'title' },
        { label: 'Comment', key: 'comment' },
        { label: 'Stay date', key: 'stayDate' },
        { label: 'Created', key: 'createdAt' },
        { label: 'Hotel response', key: 'hotelResponse' },
        { label: 'Responded at', key: 'respondedAt' }
      ],
      filtered
    );
  };

  const answeredPct = percent(counts.answered, counts.all);

  return (
    <div className="admin-fade-up">
      <PageHeader
        eyebrow="Engagement"
        title="Reviews"
        description="Listen to guest feedback across every property, spot service issues early and publish thoughtful hotel responses."
        actions={
          <>
            <GhostButton icon="fa-file-arrow-down" onClick={exportReviews}>Export CSV</GhostButton>
            <Badge tone={counts.unanswered ? 'amber' : 'sky'} dot>
              {counts.unanswered ? `${counts.unanswered} awaiting reply` : 'All reviews answered'}
            </Badge>
          </>
        }
        meta={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
            <i className="fa-solid fa-star text-xs" aria-hidden="true" />
            {summary.average || '—'} / 5
          </span>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ReviewStat label="Total reviews" value={counts.all} icon="fa-comments" tone="sky" hint={`${summary.distribution[0].count} five-star stays`} />
        <ReviewStat label="Average rating" value={`${summary.average || 0} / 5`} icon="fa-star" tone="amber" hint={`${summary.distribution[0].count} five-star stays`} />
        <ReviewStat label="Awaiting response" value={counts.unanswered} icon="fa-comment-dots" tone="rose" hint={`${counts.answered} already answered`} />
        <ReviewStat label="Response rate" value={`${answeredPct}%`} icon="fa-reply-all" tone="sky" hint="across all properties" />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
        <Panel className="xl:col-span-5">
          <PanelHeader title="Rating distribution" subtitle="How guests scored their stays" icon="fa-chart-simple" />
          <div className="px-5 pb-5 sm:px-6">
            <div className="mb-4 flex items-end gap-3">
              <span className="font-heading text-4xl font-semibold leading-none tracking-tight text-slate-900">{summary.average || '0.0'}</span>
              <div className="pb-0.5">
                <Stars rating={summary.average} />
                <p className="mt-1 text-xs font-semibold text-slate-400">Based on {counts.all} verified reviews</p>
              </div>
            </div>
            <div className="space-y-2">
              {summary.distribution.map((row) => (
                <div key={row.star} className="flex items-center gap-2">
                  <span className="w-7 text-xs font-bold text-slate-500">{row.star}★</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${row.star >= 4 ? 'bg-blue-600' : row.star === 3 ? 'bg-slate-400' : 'bg-rose-400'}`}
                      style={{ width: `${counts.all ? Math.max(row.count ? 3 : 0, Math.round((row.count / counts.all) * 100)) : 0}%` }}
                    />
                  </div>
                  <span className="w-7 text-right text-xs font-semibold text-slate-700">{row.count}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel className="xl:col-span-7">
          <PanelHeader title="Experience breakdown" subtitle="Average score by review category" icon="fa-list-check" />
          <div className="grid grid-cols-1 gap-4 px-5 pb-5 sm:grid-cols-2 sm:px-6">
            {RATING_KEYS.map((category) => {
              const value = summary[category.summaryKey];
              return (
                <div key={category.key} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
                      <i className={`fa-solid ${category.icon} text-xs text-blue-500`} aria-hidden="true" /> {category.label}
                    </span>
                    <span className="text-[12px] font-semibold text-slate-900">{value || '—'}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200/70">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${(Number(value) / 5) * 100}%` }} />
                  </div>
                </div>
              );
            })}
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs leading-relaxed text-slate-600">
                <i className="fa-solid fa-circle-info text-slate-500" aria-hidden="true" />
                Respond within 48 hours to protect the property&apos;s service score. Admin responses are published under the hotel&apos;s name.
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="Guest feedback"
          subtitle={`${filtered.length} of ${reviews.length} reviews`}
          icon="fa-comment-dots"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <SearchField value={search} onChange={setSearch} placeholder="Search guest, property or text" className="w-full sm:w-64" />
              <FilterSelect
                value={ratingFilter}
                onChange={setRatingFilter}
                ariaLabel="Filter by rating"
                options={[
                  { value: 'all', label: 'All ratings' },
                  { value: '5', label: '5 stars' },
                  { value: '4', label: '4 stars' },
                  { value: '3', label: '3 stars' },
                  { value: '2', label: '2 stars' },
                  { value: '1', label: '1 star' }
                ]}
              />
              <FilterSelect
                value={sortBy}
                onChange={setSortBy}
                ariaLabel="Sort reviews"
                options={[
                  { value: 'newest', label: 'Newest first' },
                  { value: 'oldest', label: 'Oldest first' },
                  { value: 'highest', label: 'Highest rated' },
                  { value: 'lowest', label: 'Lowest rated' }
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
              { value: 'all', label: 'All reviews', count: counts.all },
              { value: 'unanswered', label: 'Needs reply', count: counts.unanswered },
              { value: 'answered', label: 'Answered', count: counts.answered }
            ]}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 pb-6 sm:px-6">
            <EmptyState
              icon="fa-comment-slash"
              title="No reviews found"
              description="Try a different search, rating or response filter. Reviews appear after guests complete a verified stay."
            />
          </div>
        ) : (
          <TableShell>
            <table className="w-full min-w-[1020px] text-left text-sm">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3 sm:px-6 whitespace-nowrap">Guest</th>
                  <th className="px-3 py-3">Review</th>
                  <th className="px-3 py-3">Property</th>
                  <th className="px-3 py-3 whitespace-nowrap">Rating</th>
                  <th className="px-3 py-3 whitespace-nowrap">Response</th>
                  <th className="px-5 py-3 text-right sm:px-6 whitespace-nowrap">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((review) => {
                  const rating = Number(review.rating) || 0;
                  return (
                    <tr key={review.id} onClick={() => openReview(review)} className="group cursor-pointer transition hover:bg-slate-50">
                      <td className="px-5 py-3.5 sm:px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={review.userName} src={review.userAvatar} size="sm" />
                          <div className="min-w-0">
                            <p className="max-w-[160px] truncate text-sm font-semibold text-slate-900">{review.userName}</p>
                            <p className="text-xs text-slate-500 whitespace-nowrap">{formatDate(review.createdAt)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <p className="max-w-[320px] truncate text-sm font-bold text-slate-800">{review.title || 'Guest review'}</p>
                        <p className="max-w-[320px] truncate text-xs text-slate-500">{review.comment}</p>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="block max-w-[180px] truncate text-sm font-semibold text-slate-700">{review.hotelName}</span>
                        <span className="block text-xs text-slate-500">{review.hotelCity || '—'}</span>
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <Stars rating={rating} />
                          <span className="text-sm font-bold text-slate-800">{rating.toFixed(1)}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 whitespace-nowrap">stay {formatDate(review.stayDate)}</p>
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        {review.hotelResponse ? (
                          <Badge tone="sky" dot>Answered</Badge>
                        ) : (
                          <Badge tone="amber">Needs reply</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right sm:px-6 whitespace-nowrap">
                        <span className="inline-grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition group-hover:bg-white group-hover:text-slate-700">
                          <i className="fa-solid fa-chevron-right text-xs" aria-hidden="true" />
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

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title="Guest review"
        subtitle={selected ? `${selected.hotelName} · ${formatDate(selected.stayDate)}` : ''}
        width="max-w-2xl"
        footer={
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-500">Responses publish publicly under the property name.</span>
            <GhostButton onClick={() => setSelectedId(null)}>Close</GhostButton>
          </div>
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={selected.userName} src={selected.userAvatar} size="md" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{selected.userName}</p>
                    <p className="text-xs text-slate-500">Reviewed {formatDateTime(selected.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Stars rating={selected.rating} size="md" />
                  </div>
                  <p className="mt-1 text-xs font-bold text-slate-600">{Number(selected.rating).toFixed(1)} out of 5</p>
                </div>
              </div>
              <h3 className="mt-4 font-heading text-lg font-semibold leading-snug text-slate-900">{selected.title || 'Guest review'}</h3>
              <p className="mt-1.5 rounded-lg bg-slate-50 px-3.5 py-3 text-sm leading-relaxed text-slate-700">{selected.comment}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {RATING_KEYS.map((category) => (
                <div key={category.key} className="rounded-lg border border-slate-200 bg-white p-3 text-center">
                  <i className={`fa-solid ${category.icon} text-xs text-blue-500`} aria-hidden="true" />
                  <p className="mt-1 font-heading text-base font-semibold text-slate-900">{Number(selected[category.key]) || '—'}</p>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{category.label}</p>
                </div>
              ))}
            </div>

            <Panel className="overflow-hidden">
              <div className="flex items-center gap-3 p-3.5">
                <img src={selected.hotelImage || PRESET_IMAGES.palace} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover ring-1 ring-slate-200" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-900">{selected.hotelName}</p>
                  <p className="text-xs text-slate-400">{selected.hotelCity || 'Property'} · stay {formatDate(selected.stayDate)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(null);
                    onNavigate('properties');
                  }}
                  className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                >
                  <i className="fa-solid fa-hotel text-xs" aria-hidden="true" /> Property
                </button>
              </div>
            </Panel>

            <Panel className="p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                  {selected.hotelResponse ? 'Published response' : 'Respond to this review'}
                </h3>
                {selected.respondedAt && <span className="text-xs text-slate-400">Published {formatDateTime(selected.respondedAt)}</span>}
              </div>
              {selected.hotelResponse && (
                <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs leading-relaxed text-slate-500">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Hotel response</p>
                  {selected.hotelResponse}
                </div>
              )}
              <Field label={selected.hotelResponse ? 'Update response' : 'Your response'} htmlFor="review-reply" error={replyError}>
                <TextArea
                  id="review-reply"
                  rows={4}
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Thank the guest, address any concerns and invite them back…"
                />
              </Field>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-slate-400">{reply.trim().length} characters · publicly visible</span>
                <PrimaryButton icon="fa-reply" onClick={submitReply} disabled={sending || !reply.trim()}>
                  {sending ? 'Publishing…' : selected.hotelResponse ? 'Update response' : 'Publish response'}
                </PrimaryButton>
              </div>
            </Panel>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function ReviewStat({ label, value, icon, hint }) {
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

function Stars({ rating, size = 'sm' }) {
  const value = Number(rating) || 0;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <i
          key={star}
          className={`fa-solid fa-star ${value >= star ? 'text-amber-400' : value >= star - 0.5 ? 'text-amber-300' : 'text-slate-200'} ${size === 'md' ? 'text-sm' : 'text-xs'}`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}
