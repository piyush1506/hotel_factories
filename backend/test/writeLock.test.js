const test = require('node:test');
const assert = require('node:assert/strict');
const WriteLock = require('../src/utils/writeLock');

test('serializes overlapping writes', async () => {
  const lock = new WriteLock();
  const events = [];
  const first = lock.run(async () => {
    events.push('first:start');
    await new Promise((resolve) => setTimeout(resolve, 20));
    events.push('first:end');
  });
  const second = lock.run(async () => {
    events.push('second:start');
    events.push('second:end');
  });
  await Promise.all([first, second]);
  assert.deepEqual(events, ['first:start', 'first:end', 'second:start', 'second:end']);
});

test('releases the queue after a failed write', async () => {
  const lock = new WriteLock();
  await assert.rejects(lock.run(async () => { throw new Error('failed'); }), /failed/);
  assert.equal(await lock.run(async () => 'continued'), 'continued');
});

