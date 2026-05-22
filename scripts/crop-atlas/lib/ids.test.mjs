import test from 'node:test';
import assert from 'node:assert/strict';
import { slugify, makeDistrictId } from './ids.mjs';

test('slugify lowercases and hyphenates spaces', () => {
  assert.equal(slugify('East Godavari'), 'east-godavari');
});

test('slugify collapses punctuation and ampersands', () => {
  assert.equal(slugify('Andaman & Nicobar Islands'), 'andaman-nicobar-islands');
});

test('slugify trims leading and trailing separators', () => {
  assert.equal(slugify('  (Hyderabad)  '), 'hyderabad');
});

test('makeDistrictId joins state and district with a double underscore', () => {
  assert.equal(makeDistrictId('Andhra Pradesh', 'East Godavari'), 'andhra-pradesh__east-godavari');
});
