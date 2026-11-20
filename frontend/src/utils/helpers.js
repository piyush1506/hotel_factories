export const PRESET_IMAGES = {
  palace: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
  beach: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80",
  mountain: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
  city: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
  suite: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
  villa: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80",
  balcony: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80"
};

export function formatPrice(amountInInr, currency = "INR") {
  const amount = Number(amountInInr) || 0;
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

/** YYYY-MM-DD in local time (toISOString would shift dates for IST users). */
export function toDateInput(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(dateStr, days) {
  const d = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
  d.setDate(d.getDate() + days);
  return toDateInput(d);
}

export function getDefaultDates() {
  return { checkIn: addDays(null, 1), checkOut: addDays(null, 4) };
}

export function nightsBetween(checkIn, checkOut) {
  const a = new Date(`${checkIn}T00:00:00`);
  const b = new Date(`${checkOut}T00:00:00`);
  if (isNaN(a) || isNaN(b)) return 0;
  return Math.max(0, Math.round((b - a) / 86400000));
}

export function formatDate(dateStr, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!dateStr) return '—';
  const d = new Date(dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-IN', opts);
}

/* ---------- Backend model normalizers ---------- */

export function getRoomPrice(room = {}) {
  return Number(room.basePrice ?? room.pricePerNight ?? room.price ?? 0);
}

export function getRoomCapacity(room = {}) {
  if (room.capacityAdults) {
    const kids = Number(room.capacityChildren || 0);
    return `${room.capacityAdults} ${room.capacityAdults === 1 ? 'Adult' : 'Adults'}${kids ? `, ${kids} ${kids === 1 ? 'Child' : 'Children'}` : ''}`;
  }
  return room.capacity || room.sleeps || '';
}

export function getRoomSize(room = {}) {
  if (room.sizeSqFt) return `${room.sizeSqFt} sq ft`;
  return room.size || null;
}

export function getBookingRef(b = {}) {
  return b.bookingCode || b.id || b._id || '—';
}

export function getCheckIn(b = {}) {
  return b.checkInDate || b.checkIn;
}

export function getCheckOut(b = {}) {
  return b.checkOutDate || b.checkOut;
}

export const BOOKING_STATUS_META = {
  HELD: { label: 'Payment pending', tone: 'bg-amber-50 text-amber-700 ring-amber-200', icon: 'fa-hourglass-half' },
  PENDING_PAYMENT: { label: 'Payment pending', tone: 'bg-amber-50 text-amber-700 ring-amber-200', icon: 'fa-hourglass-half' },
  CONFIRMED: { label: 'Confirmed', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: 'fa-circle-check' },
  CHECKED_IN: { label: 'Checked in', tone: 'bg-sky-50 text-sky-700 ring-sky-200', icon: 'fa-door-open' },
  COMPLETED: { label: 'Completed', tone: 'bg-slate-100 text-slate-700 ring-slate-200', icon: 'fa-flag-checkered' },
  NO_SHOW: { label: 'No-show', tone: 'bg-rose-50 text-rose-700 ring-rose-200', icon: 'fa-user-slash' },
  CANCELLED: { label: 'Cancelled', tone: 'bg-rose-50 text-rose-700 ring-rose-200', icon: 'fa-ban' },
  EXPIRED: { label: 'Expired', tone: 'bg-rose-50 text-rose-700 ring-rose-200', icon: 'fa-clock' },
  REFUNDED: { label: 'Refunded', tone: 'bg-slate-100 text-slate-700 ring-slate-200', icon: 'fa-rotate-left' }
};

export function getStatusMeta(status) {
  return BOOKING_STATUS_META[String(status || '').toUpperCase()] || BOOKING_STATUS_META.CONFIRMED;
}

/** Classifies a booking into upcoming / past / cancelled for the My Trips tabs. */
export function getTripBucket(b = {}) {
  const status = String(b.status || '').toUpperCase();
  if (status === 'CANCELLED' || status === 'REFUNDED' || status === 'EXPIRED' || status === 'NO_SHOW') return 'cancelled';
  if (status === 'COMPLETED') return 'past';
  const out = getCheckOut(b);
  if (out && new Date(`${out}T23:59:59`) < new Date()) return 'past';
  return 'upcoming';
}

export function couponLabel(c = {}) {
  if (c.discountType === 'FLAT') return `Flat ₹${Number(c.discountValue).toLocaleString('en-IN')} off`;
  if (c.discountType === 'PERCENT') return `${c.discountValue}% off`;
  return c.description || c.code;
}

export const MMT_COUPONS = [
  { code: "REDHOTEL", discount: 0.20, title: "Flat 20% OFF", subtitle: "On Luxury Stays & Resorts with Instant Bank Offer" },
  { code: "PRIMOSTAY", discount: 0.25, title: "Special 25% OFF", subtitle: "Valid on Oberoi, Azure Bay and Villas" },
  { code: "FIRSTSTAY", discount: 0.15, title: "15% Extra Savings", subtitle: "First time mobile app booking voucher" }
];

export const ROLE_LABELS = {
  customer: 'Traveller',
  hotel_owner: 'Hotel Partner',
  admin: 'Platform Admin'
};

export function getAmenityIcon(amenity = '') {
  const lower = String(amenity).toLowerCase();
  if (lower.includes('wifi') || lower.includes('internet')) return 'fa-wifi';
  if (lower.includes('pool') || lower.includes('swim')) return 'fa-water-ladder';
  if (lower.includes('spa') || lower.includes('massage')) return 'fa-spa';
  if (lower.includes('dining') || lower.includes('restaurant') || lower.includes('food')) return 'fa-utensils';
  if (lower.includes('ac') || lower.includes('air')) return 'fa-snowflake';
  if (lower.includes('park')) return 'fa-square-parking';
  if (lower.includes('bar') || lower.includes('drink')) return 'fa-martini-glass';
  if (lower.includes('gym') || lower.includes('fitness')) return 'fa-dumbbell';
  if (lower.includes('tv')) return 'fa-tv';
  if (lower.includes('breakfast') || lower.includes('coffee')) return 'fa-mug-hot';
  if (lower.includes('beach')) return 'fa-umbrella-beach';
  if (lower.includes('shuttle') || lower.includes('airport')) return 'fa-van-shuttle';
  if (lower.includes('service') || lower.includes('butler')) return 'fa-bell-concierge';
  return 'fa-circle-check';
}
