import { describe, it, expect } from 'vitest';
import { parseHashString } from './hashRoute.js';

describe('parseHashString — string commodity ids', () => {
  it('keeps a seeded commodity slug id instead of bouncing to Markets', () => {
    expect(parseHashString('#/commodity-detail/seed-coconut-husk'))
      .toEqual({ page: 'commodity-detail', itemId: 'seed-coconut-husk' });
  });

  it('keeps numeric commodity ids as numbers', () => {
    expect(parseHashString('#/commodity-detail/1699999999999'))
      .toEqual({ page: 'commodity-detail', itemId: 1699999999999 });
  });

  it('falls back to Markets for an undecodable commodity id', () => {
    expect(parseHashString('#/commodity-detail/%E0%A4%A'))
      .toEqual({ page: 'markets', itemId: null });
  });
});

describe('parseHashString — existing behaviour is unchanged', () => {
  it('parses numeric ids on idea and project pages', () => {
    expect(parseHashString('#/idea-detail/42')).toEqual({ page: 'idea-detail', itemId: 42 });
    expect(parseHashString('#/project-detail/7')).toEqual({ page: 'project-detail', itemId: 7 });
    expect(parseHashString('#/research/9')).toEqual({ page: 'research', itemId: 9 });
  });

  it('routes a non-numeric id on a numeric route to the parent list', () => {
    expect(parseHashString('#/idea-detail/abc')).toEqual({ page: 'ideas', itemId: null });
    expect(parseHashString('#/project-detail/abc')).toEqual({ page: 'projects', itemId: null });
    expect(parseHashString('#/research/abc')).toEqual({ page: 'projects', itemId: null });
  });

  it('keeps a detail route with no id on its own page', () => {
    expect(parseHashString('#/new-idea')).toEqual({ page: 'new-idea', itemId: null });
    expect(parseHashString('#/commodity-detail')).toEqual({ page: 'commodity-detail', itemId: null });
  });

  it('ignores ids on plain pages and defaults unknown routes to the dashboard', () => {
    expect(parseHashString('#/ideas')).toEqual({ page: 'ideas', itemId: null });
    expect(parseHashString('#/ideas/5')).toEqual({ page: 'ideas', itemId: null });
    expect(parseHashString('#/nope')).toEqual({ page: 'dashboard', itemId: null });
    expect(parseHashString('')).toEqual({ page: 'dashboard', itemId: null });
    expect(parseHashString(undefined)).toEqual({ page: 'dashboard', itemId: null });
  });
});
