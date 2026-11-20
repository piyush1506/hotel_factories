export const ADMIN_NAV = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
      { id: 'reports', label: 'Reports & insights', icon: 'fa-chart-line' }
    ]
  },
  {
    label: 'Operations',
    items: [
      { id: 'properties', label: 'Properties', icon: 'fa-hotel', badgeKey: 'properties' },
      { id: 'bookings', label: 'Bookings', icon: 'fa-calendar-check', badgeKey: 'bookings' },
      { id: 'customers', label: 'Guests & Users', icon: 'fa-users' }
    ]
  },
  {
    label: 'Commerce',
    items: [
      { id: 'finance', label: 'Finance & Payouts', icon: 'fa-building-columns', badgeKey: 'finance' },
      { id: 'refunds', label: 'Refunds', icon: 'fa-rotate-left', badgeKey: 'refunds' },
      { id: 'coupons', label: 'Coupons', icon: 'fa-ticket' }
    ]
  },
  {
    label: 'Engagement',
    items: [{ id: 'reviews', label: 'Reviews', icon: 'fa-star', badgeKey: 'reviews' }]
  },
  {
    label: 'System',
    items: [{ id: 'settings', label: 'Settings', icon: 'fa-gear' }]
  }
];

export const ADMIN_PAGE_META = {
  dashboard: { title: 'Dashboard', description: 'Platform performance at a glance' },
  reports: { title: 'Reports & insights', description: 'Revenue trends, destinations and guest analytics' },
  properties: { title: 'Properties', description: 'Listings, approvals and room inventory' },
  bookings: { title: 'Bookings', description: 'Reservations, guests and payment state' },
  customers: { title: 'Guests & Users', description: 'Accounts and access roles' },
  finance: { title: 'Finance & Payouts', description: 'Settlements and platform revenue' },
  refunds: { title: 'Refunds & Returns', description: 'Cancellation claims, customer refunds and settlement adjustments' },
  coupons: { title: 'Coupons', description: 'Promotions and redemption performance' },
  reviews: { title: 'Reviews', description: 'Guest feedback and hotel responses' },
  settings: { title: 'Settings', description: 'Workspace and platform controls' }
};
