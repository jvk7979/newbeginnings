# Ideas CAPEX & Payback — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `estimatedCapex` and `estimatedPayback` fields to ideas, surface them on cards and forms, add an IdeasPage status tab strip, replace the Dashboard "Recent Ideas" card grid with a pipeline table, and fix Badge colours/labels.

**Architecture:** Six targeted edits across existing files — no new files created. Badge.jsx is updated globally (affects all badge uses). IdeaCard.jsx gains a metrics strip. NewIdeaPage and IdeaDetailPage gain two optional number inputs. IdeasPage replaces the status dropdown with tab pills. Dashboard replaces the Recent Ideas card grid with a compact table.

**Tech Stack:** React 18, Vite, Firestore (no changes needed), inline styles, `C.*` tokens, `alpha()` helper.

---

### Task 1: Fix Badge.jsx — label + border opacity

**Files:**
- Modify: `src/components/Badge.jsx`

- [ ] **Step 1: Replace the entire `configs` object**

Open `src/components/Badge.jsx`. The current `configs` object starts at line 2. Replace the full `configs` object with:

```js
const configs = {
  active:        { label: 'Active',       bg: '#EAF5EE', color: '#2E7D52', border: '#2E7D5255' },
  completed:     { label: 'Completed',    bg: '#E8F4FF', color: '#1D5FA6', border: '#1D5FA655' },
  'in-review':   { label: 'In Review',    bg: '#F0EAF8', color: '#6B3FA6', border: '#6B3FA655' },
  progress:      { label: 'In Progress',  bg: '#FDF0E4', color: '#C4681C', border: '#C4681C55' },
  'in-progress': { label: 'In Progress',  bg: '#FDF0E4', color: '#C4681C', border: '#C4681C55' },
  stalled:       { label: 'Stalled',      bg: '#FAEAEA', color: '#B03030', border: '#B0303055' },
  paused:        { label: 'Paused',       bg: '#FAEAEA', color: '#B03030', border: '#B0303055' },
  draft:         { label: 'Draft',        bg: '#EAF0FA', color: '#2B5FA6', border: '#2B5FA655' },
  new:           { label: 'New',          bg: '#EAF0FA', color: '#2B5FA6', border: '#2B5FA655' },
  validating:    { label: 'Validating',   bg: '#FDF5E4', color: '#B8892A', border: '#B8892A55' },
  researching:   { label: 'Researching',  bg: '#FDF5E4', color: '#B8892A', border: '#B8892A55' },
  planning:      { label: 'Planning',     bg: '#F0EAF8', color: '#6B3FA6', border: '#6B3FA655' },
  archived:      { label: 'Archived',     bg: '#EDE8DE', color: '#9A8E80', border: '#9A8E8055' },
};
```

Key changes vs current: `validating` label `'Researching'` → `'Validating'`; all border alpha `33` → `55`.

- [ ] **Step 2: Verify build**

```bash
cd c:\Users\jvk79\newbeginnings && npm run build
```

Expected: `✓ built in` with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Badge.jsx
git commit -m "Update Badge: fix Validating label, increase border visibility"
```

---

### Task 2: Update IdeaCard.jsx — fmtINR helper + metrics strip + label fix

**Files:**
- Modify: `src/components/IdeaCard.jsx`

- [ ] **Step 1: Add fmtINR helper and fix IDEA_STATUSES label**

At the top of `src/components/IdeaCard.jsx`, after the imports and before the `IDEA_STATUSES` constant, add the `fmtINR` helper:

```js
function fmtINR(n) {
  if (!n || !isFinite(n)) return '—';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)} L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)} K`;
  return `₹${n.toFixed(0)}`;
}
```

Also fix the `IDEA_STATUSES` label for `validating`. Change:
```js
{ id: 'validating', label: 'Researching' },
```
to:
```js
{ id: 'validating', label: 'Validating' },
```

- [ ] **Step 2: Accept estimatedCapex and estimatedPayback props**

The component signature currently is:
```js
export default function IdeaCard({
  id, title, date, status, desc, category, onClick,
  editing = false, onStartEdit, onCancelEdit, onSaveEdit,
}) {
```

Change to:
```js
export default function IdeaCard({
  id, title, date, status, desc, category, estimatedCapex, estimatedPayback, onClick,
  editing = false, onStartEdit, onCancelEdit, onSaveEdit,
}) {
```

- [ ] **Step 3: Add the metrics strip to the card JSX**

In the non-editing return branch, locate the block that renders the description and the bottom bar. The bottom bar currently reads:

```jsx
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.fg3 }}>{date}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.accent, fontWeight: 600 }}>
          Open
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="11" height="11"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </span>
      </div>
```

Insert the metrics strip **immediately before** that bottom bar div. Add this block:

```jsx
      {(estimatedCapex || estimatedPayback) && (
        <div style={{ display: 'flex', gap: 20, paddingTop: 10, paddingBottom: 10, borderTop: `1px solid ${C.border}` }}>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.fg3, marginBottom: 2 }}>CAPEX</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: C.fg1 }}>{fmtINR(estimatedCapex)}</div>
          </div>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.fg3, marginBottom: 2 }}>PAYBACK</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: C.fg1 }}>{estimatedPayback ? `${estimatedPayback}y` : '—'}</div>
          </div>
        </div>
      )}
```

Also remove the `borderTop` from the bottom bar div since the metrics strip (when shown) provides its own top border. Change the bottom bar's style:

```jsx
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 10, borderTop: estimatedCapex || estimatedPayback ? 'none' : `1px solid ${C.border}` }}>
```

- [ ] **Step 4: Verify build**

```bash
cd c:\Users\jvk79\newbeginnings && npm run build
```

Expected: `✓ built in` with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/IdeaCard.jsx
git commit -m "IdeaCard: add CAPEX/Payback metrics strip, fix Validating label"
```

---

### Task 3: Update NewIdeaPage.jsx — add CAPEX/Payback inputs

**Files:**
- Modify: `src/pages/NewIdeaPage.jsx`

- [ ] **Step 1: Add estimatedCapex and estimatedPayback to form state**

Find the initial `useState`:
```js
const [form, setForm] = useState({ title: '', status: 'draft', category: '', desc: '', sources: [] });
```

Replace with:
```js
const [form, setForm] = useState({ title: '', status: 'draft', category: '', desc: '', sources: [], estimatedCapex: '', estimatedPayback: '' });
```

- [ ] **Step 2: Add the two inputs after the description block**

Find the closing `</div>` of the description block. It currently ends with:
```jsx
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginTop: 4 }}>{form.desc.length} characters</div>
        </div>
        <div>
          <label style={labelStyle}>Sources (optional)</label>
```

Between the description `</div>` and the Sources block, insert:

```jsx
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Estimated CAPEX (₹) <span style={{ fontWeight: 400, color: C.fg3 }}>— optional</span></label>
            <input type="number" min={0} style={inputStyle} value={form.estimatedCapex}
              onChange={e => setForm({ ...form, estimatedCapex: e.target.value })}
              onFocus={focus} onBlur={blur} />
          </div>
          <div>
            <label style={labelStyle}>Estimated Payback (yrs) <span style={{ fontWeight: 400, color: C.fg3 }}>— optional</span></label>
            <input type="number" min={0} step={0.5} style={inputStyle} value={form.estimatedPayback}
              onChange={e => setForm({ ...form, estimatedPayback: e.target.value })}
              onFocus={focus} onBlur={blur} />
          </div>
        </div>
```

- [ ] **Step 3: Include the new fields in the addIdea call**

Find the `addIdea` call in `handleSave`:
```js
      addIdea({ title: form.title.trim(), status: form.status, category: form.category || '', desc: form.desc.trim(), sources, attachedFile });
```

Replace with:
```js
      addIdea({
        title: form.title.trim(), status: form.status, category: form.category || '',
        desc: form.desc.trim(), sources, attachedFile,
        ...(form.estimatedCapex  ? { estimatedCapex:   Number(form.estimatedCapex)  } : {}),
        ...(form.estimatedPayback ? { estimatedPayback: Number(form.estimatedPayback) } : {}),
      });
```

- [ ] **Step 4: Verify build**

```bash
cd c:\Users\jvk79\newbeginnings && npm run build
```

Expected: `✓ built in` with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/NewIdeaPage.jsx
git commit -m "NewIdeaPage: add Estimated CAPEX and Payback optional inputs"
```

---

### Task 4: Update IdeaDetailPage.jsx — add CAPEX/Payback to edit form

**Files:**
- Modify: `src/pages/IdeaDetailPage.jsx`

- [ ] **Step 1: Add state for the two new fields**

Find the block of edit-form `useState` declarations starting at line ~31:
```js
  const [isEditing, setIsEditing]     = useState(false);
  const [status, setStatus]           = useState(idea.status);
  const [title, setTitle]             = useState(idea.title);
  const [category, setCategory]       = useState(idea.category || '');
  const [desc, setDesc]               = useState(idea.desc || '');
  const [notes, setNotes]             = useState(idea.notes || '');
```

After the `[notes, setNotes]` line, add:
```js
  const [estimatedCapex,   setEstimatedCapex]   = useState(idea.estimatedCapex   ?? '');
  const [estimatedPayback, setEstimatedPayback] = useState(idea.estimatedPayback ?? '');
```

- [ ] **Step 2: Reset the new fields in handleCancel**

Find where `handleCancel` (or the cancel logic) resets state. It resets fields starting around line ~115–122:
```js
    setCategory(idea.category || '');
    setDesc(idea.desc || '');
    setNotes(idea.notes || '');
    setSources(Array.isArray(idea.sources) ? idea.sources : []);
    setSections(idea.sections || []);
```

After `setSections`, add:
```js
    setEstimatedCapex(idea.estimatedCapex   ?? '');
    setEstimatedPayback(idea.estimatedPayback ?? '');
```

- [ ] **Step 3: Include the new fields in the updateIdea call**

Find the `updateIdea` call inside `handleSave` (around line 96):
```js
      await updateIdea(idea.id, { title: title.trim(), status, category: category || '', desc: desc.trim(), notes: notes.trim(), sources: cleanSources, sections, attachedFile: nextFile });
```

Replace with:
```js
      await updateIdea(idea.id, {
        title: title.trim(), status, category: category || '',
        desc: desc.trim(), notes: notes.trim(), sources: cleanSources, sections, attachedFile: nextFile,
        estimatedCapex:   estimatedCapex   !== '' ? Number(estimatedCapex)   : undefined,
        estimatedPayback: estimatedPayback !== '' ? Number(estimatedPayback) : undefined,
      });
```

- [ ] **Step 4: Add the two inputs to the edit form JSX**

Find the description textarea block in the edit form — it ends with:
```jsx
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginTop: 4 }}>{desc.length} characters · Captured {idea.date}</div>
            </div>

            <div>
              <label style={labelStyle}>Notes & Next Steps</label>
```

Between the description `</div>` and the Notes block, insert:

```jsx
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Estimated CAPEX (₹) <span style={{ fontWeight: 400, color: C.fg3 }}>— optional</span></label>
                <input type="number" min={0} style={inputStyle} value={estimatedCapex}
                  onChange={e => setEstimatedCapex(e.target.value)}
                  onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label style={labelStyle}>Estimated Payback (yrs) <span style={{ fontWeight: 400, color: C.fg3 }}>— optional</span></label>
                <input type="number" min={0} step={0.5} style={inputStyle} value={estimatedPayback}
                  onChange={e => setEstimatedPayback(e.target.value)}
                  onFocus={focus} onBlur={blur} />
              </div>
            </div>
```

- [ ] **Step 5: Verify build**

```bash
cd c:\Users\jvk79\newbeginnings && npm run build
```

Expected: `✓ built in` with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/IdeaDetailPage.jsx
git commit -m "IdeaDetailPage: add Estimated CAPEX and Payback to edit form"
```

---

### Task 5: Update IdeasPage.jsx — status tabs replacing dropdown

**Files:**
- Modify: `src/pages/IdeasPage.jsx`

- [ ] **Step 1: Fix FILTERS label and update state**

At the top of `IdeasPage.jsx`, find `FILTERS`:
```js
const FILTERS = [
  { id: 'all',       label: 'All' },
  { id: 'draft',     label: 'Draft' },
  { id: 'validating',label: 'Researching' },
  { id: 'active',    label: 'Active' },
  { id: 'archived',  label: 'Archived' },
];
```

Replace with:
```js
const FILTERS = [
  { id: 'all',        label: 'All' },
  { id: 'draft',      label: 'Draft' },
  { id: 'validating', label: 'Validating' },
  { id: 'active',     label: 'Active' },
  { id: 'archived',   label: 'Archived' },
];
```

- [ ] **Step 2: Insert status tab strip above the search bar**

The tab strip goes between the header block and the `{/* Search */}` block. The header block ends with:
```jsx
      </div>

      {/* Search */}
```

Insert the tab strip between those two lines:

```jsx
      </div>

      {/* Status tabs — Primary style when active, Secondary style when inactive */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {FILTERS.filter(f => f.id === 'all' || ideas.some(i => i.status === f.id)).map(f => {
          const count = f.id === 'all' ? ideas.length : ideas.filter(i => i.status === f.id).length;
          const active = filter === f.id;
          return (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: active ? 700 : 500,
                padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
                background: active ? C.accent : C.bg1,
                color: active ? '#fff' : C.fg1,
                border: `1.5px solid ${active ? C.accent : C.fg3}`,
                transition: 'all 120ms',
              }}>
              {f.label} <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: active ? 0.85 : 0.65 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
```

Note on button style: Active tab = Primary (C.accent fill, white text). Inactive tab = Secondary (C.bg1 fill, C.fg1 text, `1.5px solid C.fg3` visible border) — matching the button design reference.

- [ ] **Step 3: Remove the status dropdown from the Filters row**

Find the `{/* Filters row */}` block. Currently it contains three `<select>` elements (status, category, sort). Remove only the status select:

```jsx
      {/* Filters row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '6px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg1, color: C.fg2, cursor: 'pointer', outline: 'none' }}>
          {FILTERS.map(f => <option key={f.id} value={f.id}>{f.label === 'All' ? 'All Status' : f.label}</option>)}
        </select>
        <select value={catFilter} ...
```

Replace with (status select removed, category + sort kept):

```jsx
      {/* Filters row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '6px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg1, color: C.fg2, cursor: 'pointer', outline: 'none' }}>
          <option value="">All Categories</option>
          {IDEA_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '6px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg1, color: C.fg2, cursor: 'pointer', outline: 'none', marginLeft: 'auto' }}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="az">A – Z</option>
        </select>
      </div>
```

- [ ] **Step 4: Verify build**

```bash
cd c:\Users\jvk79\newbeginnings && npm run build
```

Expected: `✓ built in` with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/IdeasPage.jsx
git commit -m "IdeasPage: replace status dropdown with tab pills, fix Validating label"
```

---

### Task 6: Update Dashboard.jsx — Ideas Pipeline table

**Files:**
- Modify: `src/pages/Dashboard.jsx`

- [ ] **Step 1: Add fmtINR helper and fix IDEA_STATUS_LABELS**

Near the top of `Dashboard.jsx`, find:
```js
const IDEA_STATUS_LABELS = { draft: 'Draft', validating: 'Researching', active: 'Active', archived: 'Archived' };
```

Replace with:
```js
const IDEA_STATUS_LABELS = { draft: 'Draft', validating: 'Validating', active: 'Active', archived: 'Archived' };
```

Then, immediately after the `STATUS_COLORS` constant (around line 31), add:

```js
function fmtINR(n) {
  if (!n || !isFinite(n)) return '—';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)} L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)} K`;
  return `₹${n.toFixed(0)}`;
}
```

- [ ] **Step 2: Update recentIdeas to show 5 instead of 4**

Find:
```js
  const recentIdeas = useMemo(() => ideas.slice(0, 4), [ideas]);
```

Replace with:
```js
  const recentIdeas = useMemo(() => ideas.slice(0, 5), [ideas]);
```

- [ ] **Step 3: Replace the Recent Ideas section with the pipeline table**

Find the entire `{/* Recent Ideas */}` block (lines ~184–208):

```jsx
      {/* Recent Ideas */}
      <div style={{ marginBottom: 40 }}>
        <SectionHeader
          label="Recent Ideas"
          actionLabel={ideas.length > 0 ? 'View all Ideas' : null}
          onAction={() => onNavigate('ideas')}
        />
        {recentIdeas.length === 0 ? (
          <div style={{ background: C.bg1, border: `1px dashed ${C.border}`, borderRadius: 10, padding: '36px 24px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg2, marginBottom: 16 }}>
              No ideas yet — capture your first venture idea.
            </div>
            <button onClick={() => onNavigate('new-idea')}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, padding: '9px 20px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
              onMouseLeave={e => e.currentTarget.style.background = C.accent}>
              + New Idea
            </button>
          </div>
        ) : (
          <div className="grid-2">
            {recentIdeas.map(i => <IdeaCard key={i.id} {...i} onClick={() => onNavigate('idea-detail', i)} />)}
          </div>
        )}
      </div>
```

Replace the entire block with:

```jsx
      {/* Ideas Pipeline */}
      <div style={{ marginBottom: 40 }}>
        <SectionHeader
          label="Ideas Pipeline"
          actionLabel={ideas.length > 0 ? 'View all →' : null}
          onAction={() => onNavigate('ideas')}
        />
        {recentIdeas.length === 0 ? (
          <div style={{ background: C.bg1, border: `1px dashed ${C.border}`, borderRadius: 10, padding: '36px 24px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg2, marginBottom: 16 }}>
              No ideas yet — capture your first venture idea.
            </div>
            <button onClick={() => onNavigate('new-idea')}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, padding: '9px 20px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
              onMouseLeave={e => e.currentTarget.style.background = C.accent}>
              + New Idea
            </button>
          </div>
        ) : (
          <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: C.bg2, borderBottom: `1px solid ${C.border}` }}>
                  {['IDEA', 'STAGE', 'CAPEX', 'PAYBACK'].map(h => (
                    <th key={h} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', color: C.fg3, padding: '8px 14px', textAlign: h === 'IDEA' ? 'left' : 'right', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentIdeas.map((idea, i) => {
                  const sc = STATUS_COLORS[idea.status] || C.fg3;
                  return (
                    <tr key={idea.id}
                      style={{ borderBottom: i < recentIdeas.length - 1 ? `1px solid ${C.border}` : 'none', cursor: 'pointer', transition: 'background 120ms' }}
                      onClick={() => onNavigate('idea-detail', idea)}
                      onMouseEnter={e => e.currentTarget.style.background = C.bg2}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '10px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: C.fg1, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {idea.title}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: sc }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc, flexShrink: 0 }} />
                          {IDEA_STATUS_LABELS[idea.status] || idea.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: C.fg1, whiteSpace: 'nowrap' }}>
                        {fmtINR(idea.estimatedCapex)}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: C.fg2, whiteSpace: 'nowrap' }}>
                        {idea.estimatedPayback ? `${idea.estimatedPayback}y` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
```

- [ ] **Step 4: Remove the now-unused IdeaCard import from Dashboard.jsx**

Find the import line:
```js
import IdeaCard from '../components/IdeaCard';
```

Delete it — `IdeaCard` is no longer used in Dashboard after the pipeline table replaces the card grid.

- [ ] **Step 5: Verify build**

```bash
cd c:\Users\jvk79\newbeginnings && npm run build
```

Expected: `✓ built in` with no errors.

- [ ] **Step 6: Commit and push**

```bash
git add src/pages/Dashboard.jsx
git commit -m "Dashboard: replace Recent Ideas grid with Ideas Pipeline table"
git push origin main
```
