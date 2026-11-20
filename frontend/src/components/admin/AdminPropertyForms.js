'use client';

import React, { useState } from 'react';
import { PRESET_IMAGES } from '../../utils/helpers';
import { Field, GhostButton, Modal, PrimaryButton, SelectInput, TextArea, TextInput } from './AdminUI';

const emptyProperty = {
  name: '',
  category: 'Hotels',
  starRating: '4',
  city: '',
  state: 'Rajasthan',
  address: '',
  startingPrice: '2500',
  commissionRate: '15',
  description: '',
  image: PRESET_IMAGES.palace,
  amenities: 'Free WiFi, Air Conditioning, Room Service, Breakfast',
  refundType: 'NON_REFUNDABLE',
  windowHours: '24',
  roomName: 'Standard AC Room',
  roomPrice: '2500',
  roomInventory: '5',
  roomBedType: '1 King Bed',
  autoVerify: true
};

export function PropertyForm({ open, onClose, onSubmit, busy }) {
  const [form, setForm] = useState(emptyProperty);
  const [error, setError] = useState('');
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm(emptyProperty);
      setError('');
    }
  }

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const refundBadge = (() => {
    if (form.refundType === 'NON_REFUNDABLE') return { label: 'Non-refundable', classes: 'bg-amber-50 text-amber-700 ring-amber-200' };
    if (form.refundType === 'AFTER_BOOKING') return { label: `Refundable within ${form.windowHours || 0}h`, classes: 'bg-slate-50 text-slate-600 ring-slate-200' };
    return { label: `Refundable before ${form.windowHours || 0}h`, classes: 'bg-slate-50 text-slate-600 ring-slate-200' };
  })();

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.name.trim() || !form.city.trim() || !form.address.trim()) {
      setError('Property name, city and address are required.');
      return;
    }
    if (Number(form.startingPrice) <= 0 || Number(form.roomPrice) <= 0) {
      setError('Nightly rates must be greater than zero.');
      return;
    }

    const isRefundable = form.refundType !== 'NON_REFUNDABLE';
    const windowHours = Number(form.windowHours) || 24;
    let summary = 'Non-refundable: No refund upon cancellation or no-show.';
    if (form.refundType === 'AFTER_BOOKING') summary = `Free cancellation within ${windowHours} hours of booking. Non-refundable thereafter.`;
    if (form.refundType === 'BEFORE_CHECKIN') summary = `Free cancellation up to ${windowHours} hours before check-in.`;

    const payload = {
      name: form.name.trim(),
      category: form.category,
      starRating: Number(form.starRating),
      city: form.city.trim(),
      state: form.state.trim() || 'India',
      address: form.address.trim(),
      startingPrice: Number(form.startingPrice),
      commissionRate: Number(form.commissionRate),
      description: form.description.trim(),
      images: [form.image.trim() || PRESET_IMAGES.palace],
      amenities: form.amenities.split(',').map((amenity) => amenity.trim()).filter(Boolean),
      cancellationPolicy: {
        refundable: isRefundable,
        type: form.refundType,
        windowHours,
        summary,
        badgeText: refundBadge.label
      },
      policies: {
        checkIn: '12:00',
        checkOut: '11:00',
        cancellation: summary
      },
      initialRoom: {
        name: form.roomName.trim(),
        price: Number(form.roomPrice),
        totalInventory: Number(form.roomInventory),
        bedType: form.roomBedType.trim(),
        image: form.image.trim() || PRESET_IMAGES.palace
      },
      autoVerify: form.autoVerify
    };

    const ok = await onSubmit(payload);
    if (!ok) setError('The property could not be created. Please review the details and try again.');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a new property"
      subtitle="Publish a listing with its first room category"
      size="max-w-3xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-600">
            <input type="checkbox" checked={form.autoVerify} onChange={(event) => setForm((current) => ({ ...current, autoVerify: event.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            Approve immediately and publish
          </label>
          <div className="flex gap-2">
            <GhostButton onClick={onClose} disabled={busy}>Cancel</GhostButton>
            <PrimaryButton type="submit" form="admin-property-form" icon="fa-cloud-arrow-up" disabled={busy}>
              {busy ? 'Publishing…' : 'Publish property'}
            </PrimaryButton>
          </div>
        </div>
      }
    >
      <form id="admin-property-form" onSubmit={submit} className="space-y-5">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">
            <i className="fa-solid fa-triangle-exclamation mt-0.5" aria-hidden="true" />
            {error}
          </div>
        )}

        <section>
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
            <i className="fa-solid fa-circle-info text-blue-500" aria-hidden="true" /> Basic information
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Property name" htmlFor="property-name" className="sm:col-span-2">
              <TextInput id="property-name" value={form.name} onChange={update('name')} placeholder="e.g. The Oberoi Grand Palace" required />
            </Field>
            <Field label="Category" htmlFor="property-category">
              <SelectInput id="property-category" value={form.category} onChange={update('category')}>
                <option>Hotels</option>
                <option>Resorts</option>
                <option>Beach Villas</option>
                <option>Apartments</option>
                <option>Heritage</option>
                <option>Glamping</option>
                <option>Cottages</option>
                <option>Budget</option>
              </SelectInput>
            </Field>
            <Field label="Star rating" htmlFor="property-stars">
              <SelectInput id="property-stars" value={form.starRating} onChange={update('starRating')}>
                <option value="5">5 star</option>
                <option value="4">4 star</option>
                <option value="3">3 star</option>
                <option value="2">2 star</option>
                <option value="1">1 star</option>
              </SelectInput>
            </Field>
            <Field label="City" htmlFor="property-city">
              <TextInput id="property-city" value={form.city} onChange={update('city')} placeholder="Udaipur" required />
            </Field>
            <Field label="State / region" htmlFor="property-state">
              <TextInput id="property-state" value={form.state} onChange={update('state')} placeholder="Rajasthan" />
            </Field>
            <Field label="Full address" htmlFor="property-address" className="sm:col-span-2">
              <TextInput id="property-address" value={form.address} onChange={update('address')} placeholder="Street, locality, city, PIN" required />
            </Field>
            <Field label="Description" htmlFor="property-description" className="sm:col-span-2">
              <TextArea id="property-description" value={form.description} onChange={update('description')} rows={3} placeholder="What makes this property special?" />
            </Field>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
            <i className="fa-solid fa-indian-rupee-sign text-blue-500" aria-hidden="true" /> Commercials & media
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Starting rate / night" htmlFor="property-starting-price" hint="Lowest listed room rate">
              <TextInput id="property-starting-price" type="number" min="1" value={form.startingPrice} onChange={update('startingPrice')} required />
            </Field>
            <Field label="Platform commission %" htmlFor="property-commission" hint="0 to 40%">
              <TextInput id="property-commission" type="number" min="0" max="40" step="0.5" value={form.commissionRate} onChange={update('commissionRate')} />
            </Field>
            <Field label="Cover image URL" htmlFor="property-image">
              <TextInput id="property-image" type="url" value={form.image} onChange={update('image')} placeholder="https://…" />
            </Field>
            <Field label="Amenities" htmlFor="property-amenities" className="sm:col-span-3" hint="Comma-separated, e.g. Free WiFi, Pool, Breakfast">
              <TextInput id="property-amenities" value={form.amenities} onChange={update('amenities')} />
            </Field>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-bold text-slate-500">Presets:</span>
            {Object.entries(PRESET_IMAGES).slice(0, 6).map(([key, url]) => (
              <button
                key={key}
                type="button"
                onClick={() => setForm((current) => ({ ...current, image: url }))}
                className={`h-9 w-12 overflow-hidden rounded-lg border-2 transition ${form.image === url ? 'border-blue-500 ring-2 ring-blue-100' : 'border-transparent hover:border-slate-300'}`}
                title={`Use ${key} image`}
              >
                <img src={url} alt={key} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
            <i className="fa-solid fa-bed text-blue-500" aria-hidden="true" /> First room category
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Room name" htmlFor="property-room-name">
              <TextInput id="property-room-name" value={form.roomName} onChange={update('roomName')} required />
            </Field>
            <Field label="Bed type" htmlFor="property-room-bed">
              <TextInput id="property-room-bed" value={form.roomBedType} onChange={update('roomBedType')} />
            </Field>
            <Field label="Nightly rate" htmlFor="property-room-price">
              <TextInput id="property-room-price" type="number" min="1" value={form.roomPrice} onChange={update('roomPrice')} required />
            </Field>
            <Field label="Inventory" htmlFor="property-room-inventory">
              <TextInput id="property-room-inventory" type="number" min="1" max="1000" value={form.roomInventory} onChange={update('roomInventory')} />
            </Field>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
            <i className="fa-solid fa-hand-holding-dollar text-blue-500" aria-hidden="true" /> Cancellation policy
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Policy rule" htmlFor="property-refund-type">
              <SelectInput id="property-refund-type" value={form.refundType} onChange={update('refundType')}>
                <option value="NON_REFUNDABLE">Non-refundable</option>
                <option value="AFTER_BOOKING">Refund window after booking</option>
                <option value="BEFORE_CHECKIN">Refund window before check-in</option>
              </SelectInput>
            </Field>
            {form.refundType !== 'NON_REFUNDABLE' && (
              <Field label={form.refundType === 'AFTER_BOOKING' ? 'Hours after booking' : 'Hours before check-in'} htmlFor="property-window-hours">
                <TextInput id="property-window-hours" type="number" min="1" max="168" value={form.windowHours} onChange={update('windowHours')} />
              </Field>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
            <span className="font-bold text-slate-700">Guest badge:</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${refundBadge.classes}`}>{refundBadge.label}</span>
          </div>
        </section>
      </form>
    </Modal>
  );
}

const emptyRoom = {
  name: '',
  type: 'Deluxe',
  bedType: '1 King Bed',
  basePrice: '3500',
  originalPrice: '',
  totalInventory: '5',
  sizeSqFt: '400',
  capacityAdults: '2',
  capacityChildren: '1',
  image: '',
  status: 'AVAILABLE'
};

function roomFormValues(room, hotel) {
  if (!room) return { ...emptyRoom, image: hotel?.images?.[0] || '' };
  return {
    name: room.name || '',
    type: room.type || 'Deluxe',
    bedType: room.bedType || '1 King Bed',
    basePrice: String(room.basePrice ?? ''),
    originalPrice: String(room.originalPrice ?? ''),
    totalInventory: String(room.totalInventory ?? ''),
    sizeSqFt: String(room.sizeSqFt ?? ''),
    capacityAdults: String(room.capacityAdults ?? 2),
    capacityChildren: String(room.capacityChildren ?? 1),
    image: room.image || '',
    status: room.status || 'AVAILABLE'
  };
}

export function RoomForm({ open, onClose, onSubmit, room, hotel, busy }) {
  const [form, setForm] = useState(emptyRoom);
  const [error, setError] = useState('');
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setError('');
      setForm(roomFormValues(room, hotel));
    }
  }

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError('Room name is required.');
      return;
    }
    if (Number(form.basePrice) <= 0) {
      setError('Nightly rate must be greater than zero.');
      return;
    }

    const payload = {
      hotelId: hotel?.id,
      name: form.name.trim(),
      type: form.type,
      bedType: form.bedType.trim(),
      basePrice: Number(form.basePrice),
      originalPrice: Number(form.originalPrice) || Math.round(Number(form.basePrice) * 1.2),
      totalInventory: Number(form.totalInventory) || 1,
      sizeSqFt: Number(form.sizeSqFt) || 400,
      capacityAdults: Number(form.capacityAdults) || 2,
      capacityChildren: Number(form.capacityChildren) || 0,
      image: form.image.trim() || hotel?.images?.[0] || '',
      status: form.status
    };

    const ok = await onSubmit(payload);
    if (!ok) setError('The room could not be saved. Please review the details and try again.');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={room ? 'Edit room category' : 'Add room category'}
      subtitle={hotel ? `${hotel.name} · ${hotel.city}` : 'Select a property'}
      size="max-w-2xl"
      footer={
        <div className="flex justify-end gap-2">
          <GhostButton onClick={onClose} disabled={busy}>Cancel</GhostButton>
          <PrimaryButton type="submit" form="admin-room-form" icon="fa-floppy-disk" disabled={busy}>
            {busy ? 'Saving…' : room ? 'Save changes' : 'Add room'}
          </PrimaryButton>
        </div>
      }
    >
      <form id="admin-room-form" onSubmit={submit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">
            <i className="fa-solid fa-triangle-exclamation mt-0.5" aria-hidden="true" />
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Room name" htmlFor="room-name" className="sm:col-span-2">
            <TextInput id="room-name" value={form.name} onChange={update('name')} placeholder="e.g. Premier Lake View Suite" required />
          </Field>
          <Field label="Room type" htmlFor="room-type">
            <SelectInput id="room-type" value={form.type} onChange={update('type')}>
              <option>Standard</option>
              <option>Deluxe</option>
              <option>Executive</option>
              <option>Suite</option>
              <option>Villa</option>
              <option>Chalet</option>
              <option>Cottage</option>
              <option>Studio</option>
            </SelectInput>
          </Field>
          <Field label="Bed type" htmlFor="room-bed">
            <TextInput id="room-bed" value={form.bedType} onChange={update('bedType')} />
          </Field>
          <Field label="Nightly rate" htmlFor="room-price">
            <TextInput id="room-price" type="number" min="1" value={form.basePrice} onChange={update('basePrice')} required />
          </Field>
          <Field label="Original / struck-through rate" htmlFor="room-original-price" hint="Optional. Defaults to 1.2× rate.">
            <TextInput id="room-original-price" type="number" min="0" value={form.originalPrice} onChange={update('originalPrice')} />
          </Field>
          <Field label="Inventory" htmlFor="room-inventory">
            <TextInput id="room-inventory" type="number" min="0" max="1000" value={form.totalInventory} onChange={update('totalInventory')} />
          </Field>
          <Field label="Room size (sq ft)" htmlFor="room-size">
            <TextInput id="room-size" type="number" min="0" value={form.sizeSqFt} onChange={update('sizeSqFt')} />
          </Field>
          <Field label="Adults" htmlFor="room-adults">
            <TextInput id="room-adults" type="number" min="1" max="20" value={form.capacityAdults} onChange={update('capacityAdults')} />
          </Field>
          <Field label="Children" htmlFor="room-children">
            <TextInput id="room-children" type="number" min="0" max="20" value={form.capacityChildren} onChange={update('capacityChildren')} />
          </Field>
          {room && (
            <Field label="Availability status" htmlFor="room-status">
              <SelectInput id="room-status" value={form.status} onChange={update('status')}>
                <option value="AVAILABLE">Available</option>
                <option value="SOLD_OUT">Sold out</option>
                <option value="MAINTENANCE">Maintenance</option>
              </SelectInput>
            </Field>
          )}
          <Field label="Room image URL" htmlFor="room-image" className="sm:col-span-2">
            <TextInput id="room-image" type="url" value={form.image} onChange={update('image')} placeholder="https://…" />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
