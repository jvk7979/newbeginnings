import { describe, it, expect } from 'vitest';
import { buildStream, buildAttention, strongestCase, ideaStage, planStage, greetingFor } from './dashboardModel.js';

const ids = (stage) => stage.entries.map(e => e.item.id);

describe('stages', () => {
  it('places ideas by status and drops archived or promoted ones', () => {
    const promoted = new Set(['3']);
    expect(ideaStage({ id: 1, status: 'draft' }, promoted)).toBe('ideas');
    expect(ideaStage({ id: 1 }, promoted)).toBe('ideas');
    expect(ideaStage({ id: 2, status: 'validating' }, promoted)).toBe('shortlisted');
    expect(ideaStage({ id: 2, status: 'active' }, promoted)).toBe('shortlisted');
    expect(ideaStage({ id: 3, status: 'draft' }, promoted)).toBeNull();
    expect(ideaStage({ id: 4, status: 'archived' }, promoted)).toBeNull();
  });

  it('places projects by status, then by calc eligibility', () => {
    expect(planStage({ status: 'active' })).toBe('underway');
    expect(planStage({ status: 'completed' })).toBe('underway');
    expect(planStage({})).toBe('underway'); // no status reads as Active across the app
    expect(planStage({ status: 'draft', eligibleForCalc: true })).toBe('numbers');
    expect(planStage({ status: 'in-review', eligibleForCalc: true })).toBe('numbers');
    expect(planStage({ status: 'draft' })).toBe('planning');
    expect(planStage({ status: 'archived', eligibleForCalc: true })).toBeNull();
  });

  it('builds all five stages in order with counts and a total', () => {
    const { stages, total } = buildStream(
      [{ id: 1, status: 'draft' }, { id: 2, status: 'validating' }, { id: 9, status: 'draft' }],
      [{ id: 10, status: 'draft' }, { id: 11, status: 'draft', eligibleForCalc: true }, { id: 12, status: 'active', linkedIdeaId: 9 }],
    );
    expect(stages.map(s => s.id)).toEqual(['ideas', 'shortlisted', 'planning', 'numbers', 'underway']);
    expect(ids(stages[0])).toEqual([1]);          // idea 9 was promoted to project 12
    expect(ids(stages[1])).toEqual([2]);
    expect(ids(stages[2])).toEqual([10]);
    expect(ids(stages[3])).toEqual([11]);
    expect(ids(stages[4])).toEqual([12]);
    expect(total).toBe(5);
  });

  it('handles an empty workspace', () => {
    const { stages, total } = buildStream([], []);
    expect(total).toBe(0);
    expect(stages.every(s => s.count === 0)).toBe(true);
  });
});

describe('buildAttention', () => {
  const plans = [
    { id: 1, title: 'A', status: 'draft', eligibleForCalc: true },
    { id: 2, title: 'B', status: 'draft', eligibleForCalc: true },
    { id: 3, title: 'C', status: 'active', eligibleForCalc: true },
    { id: 4, title: 'D', status: 'draft', eligibleForCalc: true },
    { id: 5, title: 'E', status: 'draft', sections: [] },
    { id: 6, title: 'F', status: 'draft', sections: [{ title: 'x' }] },
    { id: 7, title: 'G', status: 'archived', eligibleForCalc: true },
  ];
  const rows = {
    1: { verdict: 'No data' }, 2: { verdict: 'No data' },
    3: { verdict: 'Below hurdle', npv: -24300000 }, 4: { verdict: 'Viable' },
    7: { verdict: 'Below hurdle' },
  };

  it('lists below-hurdle first, then grouped missing numbers, then unwritten plans', () => {
    const items = buildAttention(plans, rows);
    expect(items.map(i => i.key)).toEqual(['below-3', 'no-numbers', 'unwritten-5']);
    expect(items[0].underway).toBe(true);
    expect(items[1].plans.map(p => p.id)).toEqual([1, 2]);
  });

  it('ignores archived projects and viable ones', () => {
    const keys = buildAttention(plans, rows).map(i => i.key);
    expect(keys.some(k => k.endsWith('-7'))).toBe(false);
    expect(keys.some(k => k.endsWith('-4'))).toBe(false);
  });

  it('is empty when nothing needs attention', () => {
    expect(buildAttention([{ id: 1, status: 'draft', eligibleForCalc: true }], { 1: { verdict: 'Viable' } })).toEqual([]);
  });
});

describe('strongestCase', () => {
  it('picks the highest-IRR viable project and counts modelled ones', () => {
    const plans = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    const rows = {
      1: { verdict: 'Viable', irr: 40 }, 2: { verdict: 'Viable', irr: 138 },
      3: { verdict: 'Below hurdle', irr: 4 }, 4: { verdict: 'No data' },
    };
    const s = strongestCase(plans, rows);
    expect(s.best.plan.id).toBe(2);
    expect(s.viableCount).toBe(2);
    expect(s.modelledCount).toBe(3);
  });

  it('returns no best case when nothing clears the hurdle', () => {
    const s = strongestCase([{ id: 1 }], { 1: { verdict: 'Below hurdle', irr: 3 } });
    expect(s.best).toBeNull();
    expect(s.modelledCount).toBe(1);
  });
});

describe('greetingFor', () => {
  it('follows the time of day', () => {
    expect(greetingFor(new Date(2026, 0, 1, 8))).toBe('Good morning');
    expect(greetingFor(new Date(2026, 0, 1, 14))).toBe('Good afternoon');
    expect(greetingFor(new Date(2026, 0, 1, 19))).toBe('Good evening');
  });
});
