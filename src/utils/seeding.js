// First-run seeding decision — pure, unit tested in seeding.test.js.
//
// ensureSharedData() used to treat "the ideas collection is empty" as "fresh
// install" and re-wrote the sample ideas, projects and plans with batch.set —
// so deleting every idea (while projects existed) overwrote real, edited
// projects that shared an id with a sample record. Seeding is now gated on a
// persistent marker document, and only ever runs into a completely empty
// workspace.
//
//   markerReadable — could we read the marker doc at all (rules deployed, online)?
//   markerSeeded   — the marker says this workspace/collection was already seeded
//   hasData        — the target collection(s) currently contain any records
//
// Returns:
//   'skip' — do nothing
//   'mark' — data already exists but no marker yet (an install that predates
//            the marker): record it so it can never be reseeded, write nothing else
//   'seed' — genuinely fresh: write the sample data, then record the marker
export function seedDecision({ markerReadable, markerSeeded, hasData }) {
  // If we can't tell whether we've seeded before, the safe answer is to never
  // write: a missed seed costs a few sample rows, a wrong seed overwrites work.
  if (!markerReadable) return 'skip';
  if (markerSeeded) return 'skip';
  if (hasData) return 'mark';
  return 'seed';
}
