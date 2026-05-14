import { C } from '../../tokens';
import { bucketByWeek } from './timeBuckets';
import ClipRow from './ClipRow';

// Named export (not default) — index.jsx imports `{ TimelineGroups }`.
export function TimelineGroups({ clips, onOpen }) {
  const groups = bucketByWeek(clips);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {groups.map(group => (
        <div key={group.label}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.accent }}>{group.label}</span>
            <span style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3 }}>{group.clips.length} {group.clips.length === 1 ? 'clip' : 'clips'}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {group.clips.map(clip => <ClipRow key={clip.id} clip={clip} onOpen={onOpen} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
