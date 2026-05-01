# Activity Heatmap Move Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the ActivityHeatmap component from Dashboard.jsx and render it at the bottom of AboutPage.jsx.

**Architecture:** The `buildActivityMap` helper and `ActivityHeatmap` component are cut from Dashboard.jsx and pasted into AboutPage.jsx. `SectionHeader` stays in Dashboard (still used there) and a copy is added to AboutPage since `ActivityHeatmap` depends on it. AboutPage gains two hook calls (`useIdeas`, `usePlans`) to supply data.

**Tech Stack:** React 18, Vite, Firebase Firestore (via existing AppContext hooks)

---

### Task 1: Remove ActivityHeatmap from Dashboard.jsx

**Files:**
- Modify: `src/pages/Dashboard.jsx:53-134` (remove component definitions)
- Modify: `src/pages/Dashboard.jsx:246-247` (remove render call)

- [ ] **Step 1: Delete the buildActivityMap helper and ActivityHeatmap component**

In `src/pages/Dashboard.jsx`, delete lines 53–134 in their entirety. These are the `buildActivityMap` function and the `ActivityHeatmap` function. The line immediately before the deleted block ends with the closing `}` of `SectionHeader` (line 51). The line immediately after the deleted block starts `function StatBreakdown`.

After deletion the file should jump from the closing `}` of `SectionHeader` straight to:

```jsx
function StatBreakdown({ kind, items }) {
```

- [ ] **Step 2: Delete the render call**

Still in `src/pages/Dashboard.jsx`, find and delete the two-line block:

```jsx
      {/* Activity heatmap */}
      <ActivityHeatmap ideas={ideas} plans={plans} />
```

The line immediately before this block is the closing `</div>` of the stat-grid section. The line immediately after is:

```jsx
      {/* Quick Actions */}
```

- [ ] **Step 3: Verify Dashboard compiles**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in` with no errors. If you see `ActivityHeatmap is not defined`, you missed a reference — search and remove it.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Dashboard.jsx
git commit -m "Remove ActivityHeatmap from Dashboard"
```

---

### Task 2: Add ActivityHeatmap to AboutPage.jsx

**Files:**
- Modify: `src/pages/AboutPage.jsx:1-2` (add imports)
- Modify: `src/pages/AboutPage.jsx:4` (insert helper + component before PILLARS)
- Modify: `src/pages/AboutPage.jsx:33` (add hook calls inside AboutPage)
- Modify: `src/pages/AboutPage.jsx:112` (add render call after CTA buttons)

- [ ] **Step 1: Add the three new imports at the top of AboutPage.jsx**

Replace the current two-line import block:

```jsx
import { C, alpha } from '../tokens';
import logoImg from '../assets/logo.png';
```

With:

```jsx
import { useMemo } from 'react';
import { C, alpha } from '../tokens';
import logoImg from '../assets/logo.png';
import { useIdeas, usePlans } from '../context/AppContext';
```

- [ ] **Step 2: Insert SectionHeader, buildActivityMap, and ActivityHeatmap before the PILLARS constant**

Insert the following block immediately before the line `const PILLARS = [` (currently line 4, will be line 5 after the import addition):

```jsx
function SectionHeader({ label, actionLabel, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.fg3, whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      {actionLabel && (
        <button onClick={onAction}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          {actionLabel}
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      )}
    </div>
  );
}

function buildActivityMap(ideas, plans) {
  const map = {};
  const bump = (dateStr) => {
    if (!dateStr) return;
    const key = String(dateStr).slice(0, 10);
    if (key.length === 10) map[key] = (map[key] || 0) + 1;
  };
  ideas.forEach(i => bump(i.date));
  plans.forEach(p => bump(p.updated || p.date));
  return map;
}

function ActivityHeatmap({ ideas, plans }) {
  const activityMap = useMemo(() => buildActivityMap(ideas, plans), [ideas, plans]);
  const maxCount = useMemo(() => Math.max(1, ...Object.values(activityMap)), [activityMap]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cells = useMemo(() => {
    const result = [];
    const start = new Date(today);
    start.setDate(start.getDate() - 83);
    for (let d = 0; d < 84; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + d);
      const key = date.toISOString().slice(0, 10);
      result.push({ date, key, count: activityMap[key] || 0 });
    }
    return result;
  }, [activityMap]);

  const getColor = (count) => {
    if (count === 0) return C.bg2;
    const intensity = Math.min(count / maxCount, 1);
    if (intensity < 0.25) return alpha(C.accent, 55);
    if (intensity < 0.5)  return alpha(C.accent, 99);
    if (intensity < 0.75) return alpha(C.accent, 155);
    return C.accent;
  };

  const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const weeks = [];
  for (let w = 0; w < 12; w++) weeks.push(cells.slice(w * 7, w * 7 + 7));

  const totalActivity = Object.values(activityMap).reduce((a, b) => a + b, 0);

  return (
    <div style={{ marginBottom: 32 }}>
      <SectionHeader label="Activity — last 12 weeks" />
      <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginRight: 4, paddingTop: 0 }}>
            {WEEK_DAYS.map((d, i) => (
              <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.fg3, lineHeight: 1, height: 12, display: 'flex', alignItems: 'center' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 3, flex: 1, overflowX: 'auto' }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {week.map((cell) => (
                  <div key={cell.key}
                    title={`${cell.key}: ${cell.count} activit${cell.count === 1 ? 'y' : 'ies'}`}
                    style={{ width: 12, height: 12, borderRadius: 2, background: getColor(cell.count), flexShrink: 0 }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginTop: 10 }}>
          {totalActivity === 0 ? 'No activity yet — start adding ideas and plans.' : `${totalActivity} total activit${totalActivity === 1 ? 'y' : 'ies'} in the last 12 weeks`}
        </div>
      </div>
    </div>
  );
}

```

- [ ] **Step 3: Add hook calls inside the AboutPage component**

Find the line:

```jsx
export default function AboutPage({ onNavigate }) {
  return (
```

Replace it with:

```jsx
export default function AboutPage({ onNavigate }) {
  const { ideas } = useIdeas();
  const { plans } = usePlans();
  return (
```

- [ ] **Step 4: Add the ActivityHeatmap render call at the bottom of the page**

Find the closing CTA div block (the last element before the two closing `</div>` tags that end the page):

```jsx
      {/* CTA */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingBottom: 20 }}>
        <button onClick={() => onNavigate('ideas')}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, padding: '9px 20px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}>
          Explore Ideas
        </button>
        <button onClick={() => onNavigate('plans')}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, padding: '9px 20px', borderRadius: 6, background: 'transparent', color: C.fg2, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
          Business Plans
        </button>
        <button onClick={() => onNavigate('documents')}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, padding: '9px 20px', borderRadius: 6, background: 'transparent', color: C.fg2, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
          Open Documents
        </button>
      </div>
      </div>
    </div>
  );
}
```

Replace it with:

```jsx
      {/* CTA */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingBottom: 20 }}>
        <button onClick={() => onNavigate('ideas')}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, padding: '9px 20px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}>
          Explore Ideas
        </button>
        <button onClick={() => onNavigate('plans')}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, padding: '9px 20px', borderRadius: 6, background: 'transparent', color: C.fg2, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
          Business Plans
        </button>
        <button onClick={() => onNavigate('documents')}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, padding: '9px 20px', borderRadius: 6, background: 'transparent', color: C.fg2, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
          Open Documents
        </button>
      </div>

      {/* Activity heatmap — workspace pulse at the bottom of the About page */}
      <div style={{ marginTop: 32 }}>
        <ActivityHeatmap ideas={ideas} plans={plans} />
      </div>

      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in` with no errors. Common errors and fixes:
- `useMemo is not defined` → check the `import { useMemo } from 'react'` line was added
- `useIdeas is not defined` → check the AppContext import line
- `SectionHeader is not defined` → the SectionHeader paste in Step 2 is missing or misplaced

- [ ] **Step 6: Manual smoke test**

```bash
npm run dev
```

Open `http://localhost:5173/newbeginnings/` (or whichever port Vite picks).

- Navigate to **Dashboard** → confirm the heatmap is gone; stat cards and quick-actions are still present
- Navigate to **About** → scroll to the bottom → confirm "Activity — last 12 weeks" heatmap appears below the CTA buttons

- [ ] **Step 7: Commit and push**

```bash
git add src/pages/AboutPage.jsx
git commit -m "Move ActivityHeatmap from Dashboard to bottom of About page"
git push origin main
```
