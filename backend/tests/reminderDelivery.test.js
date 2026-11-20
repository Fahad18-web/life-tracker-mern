
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const ReminderDelivery = require('../models/ReminderDelivery');

function createValidDelivery(overrides = {}) {
  return new ReminderDelivery({
    userId: new mongoose.Types.ObjectId(),
    localDate: '2026-11-19',
    timezone: 'Asia/Karachi',
    preferredHour: 20,
    ...overrides
  });
}

test('ReminderDelivery accepts a valid document', () => {
  const doc = createValidDelivery();

  assert.equal(doc.validateSync(), undefined);
});

test('email and push default to pending with zero attempts', () => {
  const doc = createValidDelivery();

  assert.equal(doc.email.status, 'pending');
  assert.equal(doc.email.attempts, 0);

  assert.equal(doc.push.status, 'pending');
  assert.equal(doc.push.attempts, 0);
});

test('email accepts uncertain delivery status', () => {
  const doc = createValidDelivery();

  doc.email.status = 'uncertain';

  assert.equal(doc.validateSync(), undefined);
});

test('push accepts uncertain delivery status', () => {
  const doc = createValidDelivery();

  doc.push.status = 'uncertain';

  assert.equal(doc.validateSync(), undefined);
});

test('rejects an unsupported delivery status', () => {
  const doc = createValidDelivery();

  doc.email.status = 'unknown';

  const error = doc.validateSync();

  assert.ok(error);
  assert.ok(error.errors['email.status']);
});

test('rejects negative attempts', () => {
  const doc = createValidDelivery();

  doc.email.attempts = -1;

  const error = doc.validateSync();

  assert.ok(error);
  assert.ok(error.errors['email.attempts']);
});

test('rejects fractional attempts', () => {
  const doc = createValidDelivery();

  doc.push.attempts = 1.5;

  const error = doc.validateSync();

  assert.ok(error);
  assert.ok(error.errors['push.attempts']);
});

test('rejects invalid calendar dates', () => {
  const doc = createValidDelivery({
    localDate: '2026-02-31'
  });

  const error = doc.validateSync();

  assert.ok(error);
  assert.ok(error.errors.localDate);
});

test('rejects malformed date strings', () => {
  const doc = createValidDelivery({
    localDate: '19-11-2026'
  });

  const error = doc.validateSync();

  assert.ok(error);
  assert.ok(error.errors.localDate);
});

test('accepts valid leap day', () => {
  const doc = createValidDelivery({
    localDate: '2028-02-29'
  });

  assert.equal(doc.validateSync(), undefined);
});

test('rejects an invalid timezone', () => {
  const doc = createValidDelivery({
    timezone: 'Invalid/Timezone'
  });

  const error = doc.validateSync();

  assert.ok(error);
  assert.ok(error.errors.timezone);
});

test('accepts valid IANA timezone', () => {
  const doc = createValidDelivery({
    timezone: 'Asia/Karachi'
  });

  assert.equal(doc.validateSync(), undefined);
});

test('rejects preferredHour outside the allowed range', () => {
  const doc = createValidDelivery({
    preferredHour: 24
  });

  const error = doc.validateSync();

  assert.ok(error);
  assert.ok(error.errors.preferredHour);
});

test('rejects fractional preferredHour', () => {
  const doc = createValidDelivery({
    preferredHour: 20.5
  });

  const error = doc.validateSync();

  assert.ok(error);
  assert.ok(error.errors.preferredHour);
});

test('requires userId', () => {
  const doc = createValidDelivery({
    userId: undefined
  });

  const error = doc.validateSync();

  assert.ok(error);
  assert.ok(error.errors.userId);
});

test('requires timezone', () => {
  const doc = createValidDelivery({
    timezone: undefined
  });

  const error = doc.validateSync();

  assert.ok(error);
  assert.ok(error.errors.timezone);
});

test('preserves the unique user and local date index', () => {
  const indexes = ReminderDelivery.schema.indexes();

  const reminderIndex = indexes.find(([fields, options]) =>
    fields.userId === 1 &&
    fields.localDate === 1 &&
    options.unique === true
  );

  assert.ok(reminderIndex);
  assert.equal(
    reminderIndex[1].name,
    'uniq_user_local_reminder_date'
  );
});
