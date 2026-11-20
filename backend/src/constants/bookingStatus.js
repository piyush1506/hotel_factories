const BOOKING_STATUS = {
  HELD: 'HELD',                     // Temporary 10-minute hold while paying
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  CONFIRMED: 'CONFIRMED',           // Successfully paid and verified
  CHECKED_IN: 'CHECKED_IN',         // Guest has checked in at the hotel
  COMPLETED: 'COMPLETED',           // Stay completed & checked out
  NO_SHOW: 'NO_SHOW',               // Guest failed to arrive
  CANCELLED: 'CANCELLED',           // Cancelled by guest or hotel
  EXPIRED: 'EXPIRED',               // Payment hold expired before confirmation
  REFUNDED: 'REFUNDED'              // Money refunded to customer
};

const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED'
};

const PAYOUT_STATUS = {
  PENDING_ESCROW: 'PENDING_ESCROW', // Held until guest check-in
  READY_FOR_PAYOUT: 'READY_FOR_PAYOUT',
  PROCESSING: 'PROCESSING',
  SETTLED: 'SETTLED',
  FAILED: 'FAILED'
};

module.exports = {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  PAYOUT_STATUS
};
