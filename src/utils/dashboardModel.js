// Dashboard model — pure functions that turn ideas + projects into what the
// Dashboard shows: the five-stage stream, the "needs your attention" list
// and the strongest case. Unit tested in dashboardModel.test.js.
//
// `rows` are projectRow() results (utils/projectMetrics.js) keyed by
// project id, computed only for calc-eligible projects.

export const STAGES = [
  { id: 'ideas',       name: 'Ideas',           note: 'Captured, not yet looked into' },
  { id: 'shortlisted', name: 'Shortlisted',     note: 'Worth a closer look' },
  { id: 'planning',    name: 'Planning',        note: 'Project written up, no numbers yet' },
  { id: 'numbers',     name: 'Running numbers', note: 'Being worked out in Calculations' },
  { id: 'underway',    name: 'Underway',        note: 'Active on the ground' },
];

// Which stage an idea sits in. Archived ideas and ideas that have been
// promoted to a project (the project carries them forward) are left out.
export function ideaStage(idea, promotedIds) {
  if (idea.status === 'archived') return null;
  if (promotedIds.has(String(idea.id))) return null;
  if (idea.status === 'validating' || idea.status === 'active') return 'shortlisted';
  return 'ideas';
}

// Which stage a project sits in. A project with no status reads as Active
// everywhere else in the app (planStatusLabel's fallback), so it is
// Underway here too.
export function planStage(plan) {
  const s = plan.status;
  if (s === 'archived') return null;
  if (!s || s === 'active' || s === 'completed') return 'underway';
  if (plan.eligibleForCalc) return 'numbers';
  return 'planning';
}

export function buildStream(ideas = [], plans = []) {
  const promoted = new Set(plans.map(p => p.linkedIdeaId).filter(v => v !== undefined && v !== null && v !== '').map(String));
  const byStage = Object.fromEntries(STAGES.map(s => [s.id, []]));
  for (const idea of ideas) {
    const st = ideaStage(idea, promoted);
    if (st) byStage[st].push({ kind: 'idea', item: idea });
  }
  for (const plan of plans) {
    const st = planStage(plan);
    if (st) byStage[st].push({ kind: 'plan', item: plan });
  }
  const stages = STAGES.map(s => ({ ...s, entries: byStage[s.id], count: byStage[s.id].length }));
  return { stages, total: stages.reduce((n, s) => n + s.count, 0) };
}

// "Needs your attention", most serious first:
//   1. modelled projects whose returns fall below their hurdle (one each)
//   2. calc-eligible projects with no numbers entered (grouped into one)
//   3. projects still in Planning with no write-up (no sections, no file)
export function buildAttention(plans = [], rows = {}) {
  const items = [];
  const live = plans.filter(p => p.status !== 'archived');

  for (const p of live) {
    const r = rows[p.id];
    if (r?.verdict === 'Below hurdle') {
      items.push({
        level: 'below',
        key: `below-${p.id}`,
        plan: p,
        row: r,
        underway: planStage(p) === 'underway',
      });
    }
  }
  const noNumbers = live.filter(p => p.eligibleForCalc && rows[p.id]?.verdict === 'No data');
  if (noNumbers.length) items.push({ level: 'todo', key: 'no-numbers', plans: noNumbers });

  const unwritten = live.filter(p => planStage(p) === 'planning'
    && !(Array.isArray(p.sections) && p.sections.length) && !p.attachedFile);
  for (const p of unwritten) items.push({ level: 'todo', key: `unwritten-${p.id}`, plan: p, unwritten: true });

  return items;
}

// The best modelled project that clears its hurdle, plus how many do.
export function strongestCase(plans = [], rows = {}) {
  const modelled = plans
    .filter(p => p.status !== 'archived' && rows[p.id] && rows[p.id].verdict !== 'No data')
    .map(p => ({ plan: p, row: rows[p.id] }));
  const viable = modelled.filter(m => m.row.verdict === 'Viable')
    .sort((a, b) => (b.row.irr ?? -Infinity) - (a.row.irr ?? -Infinity));
  return { best: viable[0] || null, viableCount: viable.length, modelledCount: modelled.length };
}

export function greetingFor(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
