const test = require('node:test');
const assert = require('node:assert/strict');
const { assertConfirmable, assertCanCheckIn } = require('../src/services/bookingLifecycle');

test('confirmation is idempotent only for the same payment', () => {
  const booking = { status: 'CONFIRMED', paymentTransactionId: 'pay_1' };
  assert.equal(assertConfirmable(booking, 'pay_1'), false);
  assert.throws(() => assertConfirmable(booking, 'pay_2'), /another payment/);
});

test('expired holds cannot be confirmed', () => {
  const booking = { status: 'HELD', lockId: 'lock_1', lockExpiresAt: '2000-01-01T00:00:00.000Z' };
  assert.throws(() => assertConfirmable(booking, 'pay_1'), /expired/);
});

test('only confirmed bookings can check in', () => {
  assert.doesNotThrow(() => assertCanCheckIn({ status: 'CONFIRMED' }));
  assert.throws(() => assertCanCheckIn({ status: 'HELD' }), /Only a confirmed/);
  assert.throws(() => assertCanCheckIn({ status: 'CANCELLED' }), /Only a confirmed/);
});
