export function formatCurrency(value, compact = false) {
  const amount = Number(value) || 0;
  if (compact) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  }
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-IN');
}

export function formatDate(value, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!value) return '—';
  const raw = String(value);
  const date = new Date(raw.length === 10 ? `${raw}T00:00:00` : raw);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', options);
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function formatShortDate(value) {
  return formatDate(value, { day: '2-digit', month: 'short' });
}

export function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function monthLabel(value) {
  if (!value) return '';
  const [year, month] = String(value).split('-').map(Number);
  if (!year || !month) return value;
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'short' });
}

export function monthLabelLong(value) {
  if (!value) return '';
  const [year, month] = String(value).split('-').map(Number);
  if (!year || !month) return value;
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function percent(part, total) {
  if (!total) return 0;
  return Math.round((Number(part) / Number(total)) * 1000) / 10;
}

export const PAYOUT_META = {
  PENDING_ESCROW: { label: 'In escrow', tone: 'amber' },
  READY_FOR_PAYOUT: { label: 'Ready for payout', tone: 'sky' },
  PROCESSING: { label: 'Processing', tone: 'violet' },
  SETTLED: { label: 'Settled', tone: 'sky' },
  FAILED: { label: 'Failed', tone: 'rose' }
};

export const PAYMENT_META = {
  PAID: { label: 'Paid', tone: 'sky' },
  PENDING: { label: 'Pending', tone: 'amber' },
  FAILED: { label: 'Failed', tone: 'rose' },
  REFUNDED: { label: 'Refunded', tone: 'slate' },
  PARTIALLY_REFUNDED: { label: 'Partially refunded', tone: 'slate' }
};

export const VERIFICATION_META = {
  APPROVED: { label: 'Verified', tone: 'sky' },
  PENDING: { label: 'Pending review', tone: 'amber' },
  REJECTED: { label: 'Rejected', tone: 'rose' }
};

export const PROPERTY_STATUS_META = {
  ACTIVE: { label: 'Active', tone: 'sky' },
  SUSPENDED: { label: 'Suspended', tone: 'rose' },
  INACTIVE: { label: 'Inactive', tone: 'slate' }
};

export const ROOM_STATUS_META = {
  AVAILABLE: { label: 'Available', tone: 'sky' },
  SOLD_OUT: { label: 'Sold out', tone: 'rose' },
  MAINTENANCE: { label: 'Maintenance', tone: 'amber' }
};

export const REFUND_STATUS_META = {
  PENDING_PROVIDER: { label: 'Pending review', tone: 'amber' },
  REFUNDED: { label: 'Refunded', tone: 'sky' },
  PROCESSED: { label: 'Processed', tone: 'sky' },
  REJECTED: { label: 'Rejected', tone: 'rose' },
  NOT_REQUIRED: { label: 'Not required', tone: 'slate' }
};

export function toCsvValue(value) {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function downloadCsv(filename, headers, rows) {
  const lines = [
    headers.map((header) => toCsvValue(header.label ?? header)).join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const key = header.key ?? header;
          return toCsvValue(typeof key === 'function' ? key(row) : row[key]);
        })
        .join(',')
    )
  ];
  const blob = new Blob([`\ufeff${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function getHotelRevenue(hotelId, bookings = []) {
  return bookings
    .filter((booking) => booking.hotelId === hotelId && booking.status !== 'CANCELLED')
    .reduce((total, booking) => total + (Number(booking.totalAmount) || 0), 0);
}

export function hotelOwner(hotel, users = []) {
  return users.find((account) => account.id === hotel?.ownerId) || null;
}

export function userDisplayBookings(user, bookings = []) {
  return bookings.filter(
    (booking) =>
      booking.userId === user.id ||
      (user.email && booking.guestEmail && booking.guestEmail.toLowerCase() === user.email.toLowerCase())
  );
}

export function sortByDateDesc(list, key) {
  return [...list].sort((a, b) => new Date(b[key] || 0).getTime() - new Date(a[key] || 0).getTime());
}

export function statusToneClasses(tone = 'slate') {
  const map = {
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    rose: 'bg-rose-50 text-rose-700 ring-rose-200',
    sky: 'bg-blue-50 text-blue-700 ring-blue-200',
    violet: 'bg-slate-50 text-slate-700 ring-slate-200',
    indigo: 'bg-slate-50 text-slate-700 ring-slate-200'
  };
  return map[tone] || map.slate;
}
