// Buckets clips into "This Week" / "Last Week" / "Earlier" by their numeric
// `createdAt` epoch. The week starts Monday. Returns an array of
// { label, clips } in display order, omitting any empty bucket. Pure — `now`
// is injectable so behaviour is deterministic.
export function bucketByWeek(clips, now = Date.now()) {
  const startOfWeek = (ts) => {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    const day = (d.getDay() + 6) % 7; // Mon=0 .. Sun=6
    d.setDate(d.getDate() - day);
    return d.getTime();
  };

  const thisWeekStart = startOfWeek(now);
  const lastWeekStart = thisWeekStart - 7 * 86400000;

  const buckets = { 'This Week': [], 'Last Week': [], 'Earlier': [] };
  for (const clip of clips) {
    const ts = clip.createdAt || 0;
    if (ts >= thisWeekStart)      buckets['This Week'].push(clip);
    else if (ts >= lastWeekStart) buckets['Last Week'].push(clip);
    else                         buckets['Earlier'].push(clip);
  }

  return ['This Week', 'Last Week', 'Earlier']
    .filter(label => buckets[label].length > 0)
    .map(label => ({ label, clips: buckets[label] }));
}