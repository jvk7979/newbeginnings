import { describe, it, expect } from 'vitest';
import {
  feedUrl, parseArrivalDate, latestPrice, lastFeedPoint, isStale, appendFeedPoint, freshnessLabel, PUBLIC_SAMPLE_KEY,
} from './agmarknetFeed.js';

describe('feedUrl', () => {
  it('builds an official data.gov.in request filtered by commodity and state', () => {
    const u = new URL(feedUrl('Coconut', 'Andhra Pradesh'));
    expect(u.hostname).toBe('api.data.gov.in');
    expect(u.searchParams.get('api-key')).toBe(PUBLIC_SAMPLE_KEY);
    expect(u.searchParams.get('filters[commodity]')).toBe('Coconut');
    expect(u.searchParams.get('filters[state]')).toBe('Andhra Pradesh');
    expect(u.searchParams.get('format')).toBe('json');
  });
});

describe('parseArrivalDate', () => {
  it('reads Agmarknet dd/mm/yyyy dates', () => {
    expect(parseArrivalDate('22/11/2026').iso).toBe('2026-11-22');
    expect(parseArrivalDate('3/7/2026').iso).toBe('2026-07-03');
  });
  it('rejects anything else', () => {
    expect(parseArrivalDate('2026-11-22')).toBeNull();
    expect(parseArrivalDate('31/13/2026')).toBeNull();
    expect(parseArrivalDate('')).toBeNull();
    expect(parseArrivalDate(undefined)).toBeNull();
  });
});

describe('latestPrice', () => {
  const rec = (market, date, modal) => ({ market, arrival_date: date, modal_price: String(modal) });

  it('averages only the markets that reported on the latest day', () => {
    const r = latestPrice([
      rec('Rajahmundry', '22/11/2026', 11800),
      rec('Amalapuram', '22/11/2026', 12000),
      rec('Kakinada', '18/11/2026', 9000), // stale — must be ignored
    ]);
    expect(r.price).toBe(11900);
    expect(r.arrivalISO).toBe('2026-11-22');
    expect(r.markets).toBe(2);
    expect(r.marketNames).toEqual(['Rajahmundry', 'Amalapuram']);
  });

  it('ignores invalid or zero prices and returns null when nothing is usable', () => {
    expect(latestPrice([rec('A', '22/11/2026', 0), rec('B', 'bad', 100), { market: 'C' }])).toBeNull();
    expect(latestPrice([])).toBeNull();
    expect(latestPrice(undefined)).toBeNull();
  });
});

describe('isStale', () => {
  const now = Date.parse('2026-11-22T12:00:00Z');
  it('is stale when never fetched or fetched over 3 hours ago', () => {
    expect(isStale({}, now)).toBe(true);
    expect(isStale({ feed: { fetchedAt: now - 4 * 3600e3 } }, now)).toBe(true);
  });
  it('is fresh within 3 hours', () => {
    expect(isStale({ feed: { fetchedAt: now - 3600e3 } }, now)).toBe(false);
  });
});

describe('appendFeedPoint / lastFeedPoint', () => {
  const point = { ts: 3, price: 11900, source: 'agmarknet', arrivalISO: '2026-11-22' };

  it('adds a new mandi day and keeps history sorted', () => {
    const { next, added } = appendFeedPoint([{ ts: 5, price: 1 }, { ts: 1, price: 2 }], point);
    expect(added).toBe(true);
    expect(next.map(p => p.ts)).toEqual([1, 3, 5]);
  });

  it('skips the same mandi day at the same price', () => {
    const { next, added } = appendFeedPoint([point], { ...point, ts: 9 });
    expect(added).toBe(false);
    expect(next).toHaveLength(1);
  });

  it('records a revised price for the same day', () => {
    expect(appendFeedPoint([point], { ...point, ts: 9, price: 12100 }).added).toBe(true);
  });

  it('trims to the newest entries and never mutates its input', () => {
    const history = [{ ts: 1 }, { ts: 2 }];
    const { next } = appendFeedPoint(history, { ...point, ts: 4 }, 2);
    expect(next.map(p => p.ts)).toEqual([2, 4]);
    expect(history).toHaveLength(2);
  });

  it('finds the newest feed point, ignoring manual ones', () => {
    expect(lastFeedPoint([{ ts: 9, source: 'manual' }, point, { ...point, ts: 1 }]).ts).toBe(3);
    expect(lastFeedPoint([{ ts: 1 }])).toBeNull();
  });
});

describe('freshnessLabel', () => {
  const now = Date.parse('2026-11-22T15:00:00Z');
  it('describes a fresh mandi price', () => {
    const l = freshnessLabel([{ ts: 1, source: 'agmarknet', arrivalISO: '2026-11-22', state: 'Andhra Pradesh' }], now);
    expect(l).toEqual({ text: 'Mandi price reported today, Andhra Pradesh average', fresh: true });
  });
  it('flags older and hand-entered prices', () => {
    expect(freshnessLabel([{ ts: 1, source: 'agmarknet', arrivalISO: '2026-11-21' }], now).text).toContain('yesterday');
    const old = freshnessLabel([{ ts: Date.parse('2026-11-10T12:00:00Z'), price: 1 }], now);
    expect(old.text.startsWith('Entered by hand')).toBe(true);
    expect(old.fresh).toBe(false);
  });
  it('returns null for an empty history', () => {
    expect(freshnessLabel([], now)).toBeNull();
  });
});
