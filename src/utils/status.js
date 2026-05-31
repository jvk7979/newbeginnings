// src/utils/status.js
//
// Single source of truth for Idea + Plan status enums. Previously each
// consumer (IdeaCard, PlansPage, PlanDetailPage, NewPlanPage, Dashboard)
// had its own list — with subtle bugs:
//   - Dashboard's PLAN_STATUS_LABELS was missing 'in-review' and
//     'completed', so a plan with either status rendered the raw
//     hyphenated string instead of a humanised label.
//   - IdeaCard used { id, label }; NewPlanPage used { value, label };
//     PlansPage used { id, label } — three different shapes for the
//     same conceptual list, so every site had to remember which one
//     applied.
//
// Now: one canonical list per entity, one consistent `{ value, label }`
// shape (value matches the HTML <option> convention), and helpers for
// label lookup that gracefully fall back to a humanised version of the
// raw value when an unknown status sneaks through (instead of rendering
// "in-review" as a literal).

export const PLAN_STATUSES = [
  { value: 'draft',     label: 'Draft' },
  { value: 'active',    label: 'Active' },
  { value: 'in-review', label: 'In Review' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived',  label: 'Archived' },
];

export const IDEA_STATUSES = [
  { value: 'draft',      label: 'Draft' },
  { value: 'validating', label: 'Validating' },
  { value: 'active',     label: 'Active' },
  { value: 'archived',   label: 'Archived' },
];

// Build a value -> label map at module load so consumer lookup is O(1).
const planLabelMap = Object.fromEntries(PLAN_STATUSES.map(s => [s.value, s.label]));
const ideaLabelMap = Object.fromEntries(IDEA_STATUSES.map(s => [s.value, s.label]));

// Humanise a raw value when no canonical label exists — turns
// 'in-review' into 'In Review' so a Firestore doc with an unexpected
// status still renders something sensible instead of the raw hyphenated
// string. Used as a last-resort fallback only.
const humanise = (s) => (typeof s === 'string' && s
  ? s.split(/[-_\s]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  : '');

export const planStatusLabel = (status, fallback = 'Active') =>
  planLabelMap[status] || (status ? humanise(status) : fallback);

export const ideaStatusLabel = (status, fallback = 'Draft') =>
  ideaLabelMap[status] || (status ? humanise(status) : fallback);
