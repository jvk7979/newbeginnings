import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeName, buildNameIndex, resolveDistrict } from './normalizeDistrict.mjs';

test('normalizeName lowercases and strips punctuation', () => {
  assert.equal(normalizeName('East Godavari'), 'east godavari');
  assert.equal(normalizeName('Y.S.R. Kadapa'), 'y s r kadapa');
});

test('normalizeName drops a trailing "district" word', () => {
  assert.equal(normalizeName('Guntur District'), 'guntur');
});

test('resolveDistrict matches on the normalized name', () => {
  const idx = buildNameIndex(['East Godavari', 'Guntur']);
  assert.equal(resolveDistrict('EAST GODAVARI', idx), 'East Godavari');
});

test('resolveDistrict uses an alias before a normalized match', () => {
  const idx = buildNameIndex(['Kadapa']);
  assert.equal(resolveDistrict('Cuddapah', idx, { cuddapah: 'Kadapa' }), 'Kadapa');
});

test('resolveDistrict returns null when nothing matches', () => {
  const idx = buildNameIndex(['Guntur']);
  assert.equal(resolveDistrict('Nonexistent', idx), null);
});
