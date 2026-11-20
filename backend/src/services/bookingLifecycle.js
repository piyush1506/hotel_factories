const { BOOKING_STATUS } = require('../constants/bookingStatus');

function assertConfirmable(booking, paymentTransactionId) {
  if (booking.status === BOOKING_STATUS.CONFIRMED) {
    if (booking.paymentTransactionId !== paymentTransactionId) {
      const error = new Error('Booking was already confirmed by another payment.');
      error.statusCode = 409;
      throw error;
    }
    return false;
  }
  if (booking.status !== BOOKING_STATUS.HELD || !booking.lockId || booking.lockExpiresAt <= new Date().toISOString()) {
    const error = new Error('This payment hold has expired. Please reserve the room again.');
    error.statusCode = 409;
    throw error;
  }
  return true;
}

function assertCanCheckIn(booking) {
  if (booking.status !== BOOKING_STATUS.CONFIRMED) {
    const error = new Error('Only a confirmed reservation can be checked in.');
    error.statusCode = 409;
    throw error;
  }
}

function assertCanCheckOut(booking) {
  if (booking.status !== BOOKING_STATUS.CHECKED_IN) {
    const error = new Error('Only an in-house checked-in guest can be checked out.');
    error.statusCode = 409;
    throw error;
  }
}

function assertCanMarkNoShow(booking) {
  if (booking.status !== BOOKING_STATUS.CONFIRMED) {
    const error = new Error('Only a confirmed booking where the guest failed to arrive can be marked as No-Show.');
    error.statusCode = 409;
    throw error;
  }
}

module.exports = { assertConfirmable, assertCanCheckIn, assertCanCheckOut, assertCanMarkNoShow };

