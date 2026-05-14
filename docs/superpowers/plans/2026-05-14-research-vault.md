# Research Vault Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-project Research Vault — a page that collects web links, PDFs, quotes, and photos against a project, opening from Project Detail, with switchable grid and timeline views.

**Architecture:** Clips live in a lazy-loaded Firestore subcollection `sharedPlans/{planId}/clips`, subscribed only when the vault page opens (the on-demand pattern used by `DiscussionThread`, not the always-on `AppContext` subscriptions). A new `planId`-driven `ResearchVaultPage` route renders a header (breadcrumb, view toggle, type filter, search) plus either a card grid or a week-grouped timeline. PDF/photo blobs reuse the existing Firebase Storage helpers in `src/utils/fileStorage.js`.

**Tech Stack:** React 18, Vite, Firebase Firestore + Storage, hash-based routing (hand-rolled in `App.jsx`), inline styles with the `C` design-token proxy, Playwright e2e.

**Reference spec:** `docs/superpowers/specs/2026-05-14-research-vault-design.md`

**Verification note:** This project has **no unit-test runner** — verification is `npm run build` (must pass) plus Playwright e2e. Each task ends with a build check; the e2e spec is the final task. The e2e harness (`?e2e=1`) runs with empty Firestore data, so e2e covers UI presence only.

---

### Task 1: Firestore rule for the clips subcollection

**Files:**
- Modify: `firestore.rules` (after the `planDiscussions` block, ~line 55)

- [ ] **Step 1: Add the rule**

In `firestore.rules`, immediately after the `match /planDiscussions/{planId}/{document=**}` block and before the `match /ideaTopics/...` block, add:

```
    // Per-project Research Vault clips — web links, PDFs, quotes, photos
    // collected against a plan. Mirrors the access model of the parent
    // sharedPlans collection: any signed-in allowed family member.
    match /sharedPlans/{planId}/clips/{clipId} {
      allow read, write: if request.auth != null && isAllowed();
    }
```

- [ ] **Step 2: Verify the build still passes**

Run: `npm run build`
Expected: build completes with no errors (rules are not part of the JS build, but this confirms nothing else broke).

- [ ] **Step 3: Note for deployment**

Firestore rules deploy separately via `firebase deploy --only firestore:rules`. The deploy is **not** part of this task — flag to the user that rules must be deployed before the feature works against production Firestore.

- [ ] **Step 4: Commit**

```bash
git add firestore.rules
git commit -m "feat: add Firestore rule for Research Vault clips subcollection"
```

---

### Task 2: `uploadImageToDB` helper in fileStorage

**Files:**
- Modify: `src/utils/fileStorage.js` (add a function after `uploadFileToDB`, ~line 53)

**Why:** `uploadFileToDB` keys `contentType` off `mimeForType()`, which only knows PDF/DOC/DOCX and returns `application/octet-stream` for images. Photo clips need the image's real MIME type preserved so the stored blob renders inline when fetched via `getFileUrl`.

- [ ] **Step 1: Add the function**

In `src/utils/fileStorage.js`, immediately after the `uploadFileToDB` function (after its closing `}` on ~line 53), add:

```javascript
// Upload an image File → Firebase Storage → return metadata object.
// Like uploadFileToDB, but preserves the image's own MIME type so the
// stored blob renders inline when later fetched via getFileUrl.
export async function uploadImageToDB(file) {
  const blobId  = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const fileRef = ref(storage, `uploads/${blobId}`);

  await new Promise((resolve, reject) => {
    const task  = uploadBytesResumable(fileRef, file, { contentType: file.type || 'image/jpeg' });
    const timer = setTimeout(() => { task.cancel(); reject(new Error('Upload timed out — check your connection and try again.')); }, 30000);
    task.on('state_changed', null,
      err  => { clearTimeout(timer); console.error('[Storage image upload error]', err?.code, err); reject(err); },
      ()   => { clearTimeout(timer); resolve(); }
    );
  });

  return { blobId, name: file.name, type: detectType(file), size: file.size, uploadedAt: todayLabel() };
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/utils/fileStorage.js
git commit -m "feat: add uploadImageToDB for image-aware Storage uploads"
```

---

### Task 3: Week-bucketing pure helper

**Files:**
- Create: `src/pages/ResearchVault/timeBuckets.js`

- [ ] **Step 1: Create the file**

```javascript
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
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build completes with no errors (the file is not imported yet — this confirms it parses).

- [ ] **Step 3: Commit**

```bash
git add src/pages/ResearchVault/timeBuckets.js
git commit -m "feat: add week-bucketing helper for Research Vault timeline"
```

---

### Task 4: `ClipTypeBadge` component + shared clip-type constants

**Files:**
- Create: `src/pages/ResearchVault/ClipTypeBadge.jsx`

**Why:** ClipCard, ClipRow, AddClipModal, and ClipModal all need a consistent type indicator and the canonical list of clip types. Centralising avoids four divergent copies.

- [ ] **Step 1: Create the file**

```jsx
import { C, alpha } from '../../tokens';

// The four research-clip kinds. `glyph` is a short inline mark shown in the
// badge — kept as a text glyph so no icon-system dependency is introduced.
export const CLIP_TYPES = {
  web:   { label: 'WEB',   glyph: '🔗' },
  pdf:   { label: 'PDF',   glyph: '📄' },
  quote: { label: 'QUOTE', glyph: '“' },
  photo: { label: 'PHOTO', glyph: '🖼' },
};

export const CLIP_TYPE_ORDER = ['web', 'pdf', 'quote', 'photo'];

export default function ClipTypeBadge({ type }) {
  const t = CLIP_TYPES[type] || CLIP_TYPES.web;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600,
      letterSpacing: '0.08em', color: C.accent,
      background: alpha(C.accent, 11), border: `1px solid ${alpha(C.accent, 33)}`,
      borderRadius: 4, padding: '2px 7px', flexShrink: 0,
    }}>
      <span aria-hidden="true">{t.glyph}</span>{t.label}
    </span>
  );
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ResearchVault/ClipTypeBadge.jsx
git commit -m "feat: add ClipTypeBadge + shared clip-type constants"
```

---

### Task 5: `EmptyState` component

**Files:**
- Create: `src/pages/ResearchVault/EmptyState.jsx`

- [ ] **Step 1: Create the file**

```jsx
import { C, alpha } from '../../tokens';
import { IllLibrary } from '../../components/illustrations';

// Shown when the project has zero clips. `canAdd` gates the CTA button so
// viewers (read-only role) see the explanation but no action.
export default function EmptyState({ onAddClip, canAdd }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ maxWidth: 460, textAlign: 'center', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 12, padding: '40px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <span style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${C.accentBg} 0%, ${C.bg2} 100%)`, border: `1px solid ${alpha(C.accent, 44)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent }}>
            <IllLibrary size={36} />
          </span>
        </div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: C.fg1, marginBottom: 10 }}>No clips yet</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg2, lineHeight: 1.6, marginBottom: canAdd ? 22 : 0 }}>
          Collect the web links, PDFs, quotes, and photos you gather while researching this project.
        </div>
        {canAdd && (
          <button onClick={onAddClip}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '9px 20px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}>
            + Add your first clip
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ResearchVault/EmptyState.jsx
git commit -m "feat: add Research Vault empty state"
```

---

### Task 6: `VaultHeader` component

**Files:**
- Create: `src/pages/ResearchVault/VaultHeader.jsx`

- [ ] **Step 1: Create the file**

```jsx
import { C, alpha } from '../../tokens';

// Type-filter chips. Labels are hardcoded (not derived from CLIP_TYPES)
// because the display casing differs from the badge casing (e.g. "PDF" vs
// "Quote") and "All" has no clip type.
const FILTER_CHIPS = [
  { value: 'all',   label: 'All' },
  { value: 'web',   label: 'Web' },
  { value: 'pdf',   label: 'PDF' },
  { value: 'quote', label: 'Quote' },
  { value: 'photo', label: 'Photo' },
];

export default function VaultHeader({
  planTitle, clipCount, view, onChangeView,
  typeFilter, onChangeTypeFilter, search, onChangeSearch,
  sort, onChangeSort, onNewClip, onBack, canAdd,
}) {
  const chipStyle = (active) => ({
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
    padding: '5px 13px', borderRadius: 999, cursor: 'pointer',
    border: `1px solid ${active ? alpha(C.accent, 66) : C.border}`,
    background: active ? alpha(C.accent, 11) : 'transparent',
    color: active ? C.accent : C.fg2, transition: 'all 120ms',
  });

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: '0.06em', color: C.fg3, marginBottom: 10 }}>
        <button onClick={onBack}
          style={{ background: 'none', border: 'none', color: C.fg3, cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 'inherit', letterSpacing: 'inherit', textTransform: 'uppercase' }}>
          Project
        </button>
        <span aria-hidden="true">/</span>
        <span style={{ textTransform: 'uppercase', color: C.fg2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>{planTitle}</span>
        <span aria-hidden="true">/</span>
        <span style={{ textTransform: 'uppercase', color: C.accent }}>Research</span>
      </div>

      {/* Title row + New Clip */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <h1 className="page-title" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 34, fontWeight: 600, color: C.fg1, margin: 0, lineHeight: 1.15 }}>
            Research Log
          </h1>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, marginTop: 4 }}>
            {clipCount} {clipCount === 1 ? 'clip' : 'clips'} · a running record of every source, quote, and field note
          </div>
        </div>
        {canAdd && (
          <button onClick={onNewClip}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '9px 18px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
            + New Clip
          </button>
        )}
      </div>

      {/* Controls: filter chips + search + sort + view toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTER_CHIPS.map(chip => (
            <button key={chip.value} onClick={() => onChangeTypeFilter(chip.value)} style={chipStyle(typeFilter === chip.value)}>
              {chip.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 160 }}>
          <input
            type="text"
            value={search}
            onChange={e => onChangeSearch(e.target.value)}
            placeholder="Search clips…"
            style={{ width: '100%', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '7px 11px', outline: 'none' }}
            onFocus={e => { e.target.style.borderColor = C.accentDim; }}
            onBlur={e => { e.target.style.borderColor = C.border; }}
          />
        </div>

        {view === 'grid' && (
          <div className="select-wrap">
            <select value={sort} onChange={e => onChangeSort(e.target.value)}
              style={{ appearance: 'none', cursor: 'pointer', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg2, fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '7px 28px 7px 11px' }}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        )}

        <div role="group" aria-label="View" style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
          {['grid', 'timeline'].map(v => (
            <button key={v} onClick={() => onChangeView(v)} aria-pressed={view === v}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '7px 13px', border: 'none', cursor: 'pointer', textTransform: 'capitalize', background: view === v ? C.accent : 'transparent', color: view === v ? '#fff' : C.fg2 }}>
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ResearchVault/VaultHeader.jsx
git commit -m "feat: add Research Vault header (breadcrumb, filters, view toggle)"
```

---

### Task 7: `ClipCard` component (grid view item)

**Files:**
- Create: `src/pages/ResearchVault/ClipCard.jsx`

- [ ] **Step 1: Create the file**

```jsx
import { useState, useEffect } from 'react';
import { C, alpha } from '../../tokens';
import ClipTypeBadge from './ClipTypeBadge';
import Tag from '../../components/Tag';
import { getFileUrl } from '../../utils/fileStorage';

// Photo clips show a thumbnail. The download URL is resolved on demand and
// never persisted — the same rule the rest of the app follows for Storage
// blobs (see fileStorage.js getFileUrl).
function PhotoThumb({ blobId }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let alive = true;
    if (blobId) getFileUrl(blobId).then(u => { if (alive) setUrl(u); }).catch(() => {});
    return () => { alive = false; };
  }, [blobId]);
  return (
    <div style={{ height: 150, borderRadius: 6, marginBottom: 12, border: `1px solid ${C.border}`, background: url ? `center / cover no-repeat url("${url}")` : C.bg2 }} />
  );
}

export default function ClipCard({ clip, onOpen }) {
  const tags = Array.isArray(clip.tags) ? clip.tags : [];
  const isQuote = clip.type === 'quote';
  return (
    <button onClick={() => onOpen(clip)}
      style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 140ms' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = alpha(C.accent, 44); }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <ClipTypeBadge type={clip.type} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3 }}>{clip.date}</span>
      </div>

      {clip.type === 'photo' && clip.photo?.blobId && <PhotoThumb blobId={clip.photo.blobId} />}

      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: isQuote ? 18 : 17, fontStyle: isQuote ? 'italic' : 'normal', fontWeight: 600, color: C.fg1, lineHeight: 1.3, marginBottom: 8 }}>
        {isQuote ? `“${clip.quoteText || clip.title || ''}”` : (clip.title || 'Untitled')}
      </div>

      {clip.description && (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, lineHeight: 1.55, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {clip.description}
        </div>
      )}

      <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: `1px dashed ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontStyle: 'italic', color: C.fg3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {clip.sourceLabel || (clip.type === 'web' ? clip.url : '')}
        </span>
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {tags.slice(0, 2).map((t, i) => <Tag key={i} label={t} />)}
          </div>
        )}
      </div>
    </button>
  );
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ResearchVault/ClipCard.jsx
git commit -m "feat: add ClipCard for Research Vault grid view"
```

---

### Task 8: `ClipRow` + `TimelineGroups` (timeline view)

**Files:**
- Create: `src/pages/ResearchVault/ClipRow.jsx`
- Create: `src/pages/ResearchVault/TimelineGroups.jsx`

- [ ] **Step 1: Create `ClipRow.jsx`**

```jsx
import { C, alpha } from '../../tokens';
import ClipTypeBadge from './ClipTypeBadge';
import Tag from '../../components/Tag';

export default function ClipRow({ clip, onOpen }) {
  const tags = Array.isArray(clip.tags) ? clip.tags : [];
  const isQuote = clip.type === 'quote';
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      {/* Timeline marker */}
      <span aria-hidden="true" style={{ width: 11, height: 11, borderRadius: '50%', border: `2px solid ${C.accent}`, background: C.bg0, flexShrink: 0, marginTop: 20 }} />
      <button onClick={() => onOpen(clip)}
        style={{ flex: 1, textAlign: 'left', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 18px', cursor: 'pointer', fontFamily: 'inherit', minWidth: 0, transition: 'border-color 140ms' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = alpha(C.accent, 44); }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.accent }}>{clip.date}</span>
          <span style={{ color: C.fg3 }}>·</span>
          <ClipTypeBadge type={clip.type} />
          {clip.sourceLabel && (
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontStyle: 'italic', color: C.fg3 }}>· {clip.sourceLabel}</span>
          )}
        </div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: isQuote ? 19 : 18, fontStyle: isQuote ? 'italic' : 'normal', fontWeight: 600, color: C.fg1, lineHeight: 1.3, marginBottom: clip.description ? 6 : 0 }}>
          {isQuote ? `“${clip.quoteText || clip.title || ''}”` : (clip.title || 'Untitled')}
        </div>
        {clip.description && (
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, lineHeight: 1.55 }}>{clip.description}</div>
        )}
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {tags.map((t, i) => <Tag key={i} label={t} />)}
          </div>
        )}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create `TimelineGroups.jsx`**

```jsx
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
```

- [ ] **Step 3: Verify the build passes**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/ResearchVault/ClipRow.jsx src/pages/ResearchVault/TimelineGroups.jsx
git commit -m "feat: add timeline view (ClipRow + week-grouped TimelineGroups)"
```

---

### Task 9: `AddClipModal` component

**Files:**
- Create: `src/pages/ResearchVault/AddClipModal.jsx`

**Behaviour:** Two steps — pick a type, then fill type-specific fields. On submit: for pdf/photo, upload the blob first, then call `onAdd(clip)`; if `onAdd` throws after an upload, delete the orphan blob. On any failure, keep the modal open with an error toast so input isn't lost.

- [ ] **Step 1: Create the file**

```jsx
import { useState } from 'react';
import { C, alpha } from '../../tokens';
import { CLIP_TYPE_ORDER, CLIP_TYPES } from './ClipTypeBadge';
import { useToast } from '../../context/ToastContext';
import UploadZone from '../../components/UploadZone';
import {
  uploadFileToDB, uploadImageToDB, deleteFileFromDB,
  FILE_MAX_BYTES, FILE_MAX_LABEL, fmtSize,
} from '../../utils/fileStorage';

const inputStyle = { width: '100%', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 15, padding: '9px 12px', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' };

const parseTags = (s) => s.split(',').map(t => t.trim()).filter(Boolean);

// Human-readable type labels for the picker step.
const TYPE_PICKER = [
  { type: 'web',   blurb: 'A link to an article, policy page, or report' },
  { type: 'pdf',   blurb: 'Upload a PDF, DOC, or DOCX document' },
  { type: 'quote', blurb: 'A noteworthy line from a source or field note' },
  { type: 'photo', blurb: 'A site photo or image from the field' },
];

export default function AddClipModal({ onClose, onAdd }) {
  const { showToast } = useToast();
  const [step, setStep] = useState('type');   // 'type' | 'fields'
  const [type, setType] = useState(null);

  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput,   setTagsInput]   = useState('');
  const [sourceLabel, setSourceLabel] = useState('');
  const [url,         setUrl]         = useState('');
  const [quoteText,   setQuoteText]   = useState('');
  const [file,        setFile]        = useState(null);   // pdf — File object
  const [imageFile,   setImageFile]   = useState(null);   // photo — File object
  const [imageErr,    setImageErr]    = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  const pickImage = (f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) { setImageErr('Please choose an image file.'); return; }
    if (f.size > FILE_MAX_BYTES) { setImageErr(`Image too large (${fmtSize(f.size)}). Maximum is ${FILE_MAX_LABEL}.`); return; }
    setImageErr('');
    setImageFile(f);
  };

  const canSubmit = (() => {
    if (type === 'web')   return url.trim() && title.trim();
    if (type === 'pdf')   return !!file && title.trim();
    if (type === 'quote') return !!quoteText.trim();
    if (type === 'photo') return !!imageFile && title.trim();
    return false;
  })();

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    let uploadedBlobId = null;
    try {
      const base = {
        type,
        title: title.trim(),
        description: description.trim(),
        tags: parseTags(tagsInput),
        sourceLabel: sourceLabel.trim(),
      };
      let clip;
      if (type === 'web') {
        clip = { ...base, url: url.trim() };
      } else if (type === 'quote') {
        clip = { ...base, quoteText: quoteText.trim(), title: base.title || quoteText.trim().slice(0, 80) };
      } else if (type === 'pdf') {
        const attachedFile = await uploadFileToDB(file);
        uploadedBlobId = attachedFile.blobId;
        clip = { ...base, attachedFile };
      } else {
        const photo = await uploadImageToDB(imageFile);
        uploadedBlobId = photo.blobId;
        clip = { ...base, photo };
      }
      await onAdd(clip);
      onClose();
    } catch (err) {
      console.error('[AddClipModal]', err);
      // Upload succeeded but the Firestore write failed — clean up the orphan.
      if (uploadedBlobId) { try { await deleteFileFromDB(uploadedBlobId); } catch { /* orphan scan cleans up */ } }
      showToast(err?.message || 'Could not save clip. Please try again.', 'error');
      setSubmitting(false);   // stay open so input isn't lost
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(28,25,20,0.55)', zIndex: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ position: 'relative', background: C.bg0, borderRadius: 12, padding: '26px 24px', width: '100%', maxWidth: 520, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.22)', animation: 'fadeIn 160ms ease' }}>
        <button onClick={onClose} aria-label="Close"
          style={{ position: 'absolute', top: 6, right: 6, width: 44, height: 44, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: C.fg3, fontSize: 26, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ×
        </button>

        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 600, color: C.fg1, marginBottom: 4, paddingRight: 36 }}>
          New Clip
        </div>

        {step === 'type' && (
          <>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, marginBottom: 18 }}>Choose a clip type</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {TYPE_PICKER.map(({ type: t, blurb }) => (
                <button key={t} onClick={() => { setType(t); setStep('fields'); }}
                  style={{ textAlign: 'left', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px', cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 140ms' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = alpha(C.accent, 55); }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: C.fg1, marginBottom: 4 }}>
                    <span aria-hidden="true" style={{ marginRight: 6 }}>{CLIP_TYPES[t].glyph}</span>
                    {CLIP_TYPES[t].label[0] + CLIP_TYPES[t].label.slice(1).toLowerCase()}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, lineHeight: 1.45 }}>{blurb}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'fields' && (
          <>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, marginBottom: 18 }}>
              <button onClick={() => setStep('type')}
                style={{ background: 'none', border: 'none', color: C.accent, cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 'inherit' }}>
                ← Type
              </button>
              {'  ·  '}{CLIP_TYPES[type].label[0] + CLIP_TYPES[type].label.slice(1).toLowerCase()}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {type === 'web' && (
                <div>
                  <label style={labelStyle}>URL</label>
                  <input style={inputStyle} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" />
                </div>
              )}

              {type === 'pdf' && (
                <div>
                  <label style={labelStyle}>Document</label>
                  <UploadZone file={file} onFile={setFile} onRemove={() => setFile(null)} />
                </div>
              )}

              {type === 'photo' && (
                <div>
                  <label style={labelStyle}>Image</label>
                  {imageFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 8, background: C.accentBg, border: `1px solid ${alpha(C.accent, 44)}` }}>
                      <span style={{ flex: 1, minWidth: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{imageFile.name}</span>
                      <button onClick={() => setImageFile(null)}
                        style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.danger, background: 'none', border: `1px solid ${alpha(C.danger, 33)}`, borderRadius: 5, padding: '4px 10px', cursor: 'pointer', flexShrink: 0 }}>
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label style={{ display: 'block', border: `2px dashed ${C.border}`, borderRadius: 8, padding: '20px', textAlign: 'center', cursor: 'pointer', background: C.bg1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2 }}>
                      Click to choose an image
                      <input type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={e => { pickImage(e.target.files[0]); e.target.value = ''; }} />
                    </label>
                  )}
                  {imageErr && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.danger, marginTop: 6 }}>{imageErr}</div>}
                </div>
              )}

              {type === 'quote' && (
                <div>
                  <label style={labelStyle}>Quote</label>
                  <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 90, lineHeight: 1.6 }} value={quoteText}
                    onChange={e => setQuoteText(e.target.value)} placeholder="The noteworthy line…" />
                </div>
              )}

              {type !== 'quote' && (
                <div>
                  <label style={labelStyle}>Title</label>
                  <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} maxLength={160} placeholder="Clip title" />
                </div>
              )}

              <div>
                <label style={labelStyle}>{type === 'quote' ? 'Context (optional)' : 'Description (optional)'}</label>
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60, lineHeight: 1.6 }} value={description}
                  onChange={e => setDescription(e.target.value)} placeholder="A short note or excerpt…" />
              </div>

              <div>
                <label style={labelStyle}>Tags (optional)</label>
                <input style={inputStyle} value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="Comma-separated, e.g. Subsidy, Policy" />
              </div>

              {type !== 'pdf' && type !== 'photo' && (
                <div>
                  <label style={labelStyle}>Source label (optional)</label>
                  <input style={inputStyle} value={sourceLabel} onChange={e => setSourceLabel(e.target.value)} placeholder="e.g. coirboard.gov.in, CIRCOT field note" />
                </div>
              )}
              {(type === 'pdf' || type === 'photo') && (
                <div>
                  <label style={labelStyle}>Source label (optional)</label>
                  <input style={inputStyle} value={sourceLabel} onChange={e => setSourceLabel(e.target.value)} placeholder="e.g. Personal, Field — Apr 18" />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
              <button onClick={onClose}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, padding: '9px 18px', borderRadius: 6, background: 'transparent', color: C.fg2, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={!canSubmit || submitting}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '9px 20px', borderRadius: 6, background: (!canSubmit || submitting) ? C.bg2 : C.accent, color: (!canSubmit || submitting) ? C.fg3 : '#fff', border: 'none', cursor: (!canSubmit || submitting) ? 'not-allowed' : 'pointer' }}>
                {submitting ? 'Saving…' : 'Add Clip'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ResearchVault/AddClipModal.jsx
git commit -m "feat: add AddClipModal — type picker + per-type create flow"
```

---

### Task 10: `ClipModal` component (view / edit / delete)

**Files:**
- Create: `src/pages/ResearchVault/ClipModal.jsx`

**Behaviour:** Opens for pdf/quote/photo clips (web clips open their URL directly, never this modal). Shows the clip content; for PDF a "Open document" button resolves `getFileUrl` on demand; for photo the full image. Edit mode edits metadata only (title, description, tags, sourceLabel, and quoteText for quotes) — not the underlying file. Delete goes through `ConfirmModal`.

- [ ] **Step 1: Create the file**

```jsx
import { useState, useEffect } from 'react';
import { C, alpha } from '../../tokens';
import ClipTypeBadge from './ClipTypeBadge';
import Tag from '../../components/Tag';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { getFileUrl } from '../../utils/fileStorage';

const inputStyle = { width: '100%', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 15, padding: '9px 12px', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' };

const parseTags = (s) => s.split(',').map(t => t.trim()).filter(Boolean);

// Resolves a Storage download URL on demand. Used for both the photo <img>
// and the PDF "open" action.
function useBlobUrl(blobId) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let alive = true;
    if (blobId) getFileUrl(blobId).then(u => { if (alive) setUrl(u); }).catch(() => {});
    return () => { alive = false; };
  }, [blobId]);
  return url;
}

export default function ClipModal({ clip, onClose, onUpdate, onDelete, canEdit }) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title,       setTitle]       = useState(clip.title || '');
  const [description, setDescription] = useState(clip.description || '');
  const [tagsInput,   setTagsInput]   = useState((Array.isArray(clip.tags) ? clip.tags : []).join(', '));
  const [sourceLabel, setSourceLabel] = useState(clip.sourceLabel || '');
  const [quoteText,   setQuoteText]   = useState(clip.quoteText || '');

  const blobId  = clip.attachedFile?.blobId || clip.photo?.blobId || null;
  const blobUrl = useBlobUrl(clip.type === 'photo' ? blobId : null);

  const handleOpenDoc = async () => {
    try {
      const u = await getFileUrl(clip.attachedFile.blobId);
      window.open(u, '_blank', 'noopener,noreferrer');
    } catch {
      showToast('Could not open the document.', 'error');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(clip.id, {
        title: title.trim(),
        description: description.trim(),
        tags: parseTags(tagsInput),
        sourceLabel: sourceLabel.trim(),
        ...(clip.type === 'quote' ? { quoteText: quoteText.trim() } : {}),
      });
      setEditing(false);
      showToast('Clip updated', 'success');
    } catch (err) {
      console.error('[ClipModal/save]', err);
      showToast('Could not save changes.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const tags = Array.isArray(clip.tags) ? clip.tags : [];

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(28,25,20,0.55)', zIndex: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        onClick={e => e.target === e.currentTarget && onClose()}>
        <div style={{ position: 'relative', background: C.bg0, borderRadius: 12, padding: '26px 24px', width: '100%', maxWidth: 560, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.22)', animation: 'fadeIn 160ms ease' }}>
          <button onClick={onClose} aria-label="Close"
            style={{ position: 'absolute', top: 6, right: 6, width: 44, height: 44, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: C.fg3, fontSize: 26, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ×
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingRight: 36 }}>
            <ClipTypeBadge type={clip.type} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3 }}>{clip.date}</span>
          </div>

          {/* ── VIEW MODE ── */}
          {!editing && (
            <>
              {clip.type === 'photo' && (
                <div style={{ width: '100%', borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 16, overflow: 'hidden', background: C.bg2 }}>
                  {blobUrl
                    ? <img src={blobUrl} alt={clip.title || 'Clip photo'} style={{ width: '100%', display: 'block' }} />
                    : <div style={{ height: 220 }} />}
                </div>
              )}

              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: clip.type === 'quote' ? 22 : 20, fontStyle: clip.type === 'quote' ? 'italic' : 'normal', fontWeight: 600, color: C.fg1, lineHeight: 1.35, marginBottom: 12 }}>
                {clip.type === 'quote' ? `“${clip.quoteText || ''}”` : (clip.title || 'Untitled')}
              </div>

              {clip.description && (
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg2, lineHeight: 1.65, marginBottom: 14, whiteSpace: 'pre-wrap' }}>{clip.description}</div>
              )}

              {clip.type === 'pdf' && clip.attachedFile?.blobId && (
                <button onClick={handleOpenDoc}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, padding: '8px 16px', borderRadius: 6, background: C.accentBg, color: C.accent, border: `1px solid ${alpha(C.accent, 44)}`, cursor: 'pointer', marginBottom: 14 }}>
                  Open document — {clip.attachedFile.name}
                </button>
              )}

              {clip.sourceLabel && (
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontStyle: 'italic', color: C.fg3, marginBottom: 12 }}>{clip.sourceLabel}</div>
              )}

              {tags.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                  {tags.map((t, i) => <Tag key={i} label={t} />)}
                </div>
              )}

              {canEdit && (
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                  <button onClick={() => setConfirmDel(true)}
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '8px 16px', borderRadius: 6, background: 'transparent', color: C.danger, border: `1px solid ${alpha(C.danger, 33)}`, cursor: 'pointer', marginRight: 'auto' }}>
                    Delete
                  </button>
                  <button onClick={() => setEditing(true)}
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, padding: '8px 16px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}>
                    Edit
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── EDIT MODE (metadata only) ── */}
          {editing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {clip.type === 'quote' && (
                <div>
                  <label style={labelStyle}>Quote</label>
                  <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 90, lineHeight: 1.6 }} value={quoteText} onChange={e => setQuoteText(e.target.value)} />
                </div>
              )}
              {clip.type !== 'quote' && (
                <div>
                  <label style={labelStyle}>Title</label>
                  <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} maxLength={160} />
                </div>
              )}
              <div>
                <label style={labelStyle}>Description</label>
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60, lineHeight: 1.6 }} value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Tags</label>
                <input style={inputStyle} value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="Comma-separated" />
              </div>
              <div>
                <label style={labelStyle}>Source label</label>
                <input style={inputStyle} value={sourceLabel} onChange={e => setSourceLabel(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button onClick={() => setEditing(false)}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '8px 16px', borderRadius: 6, background: 'transparent', color: C.fg2, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, padding: '8px 18px', borderRadius: 6, background: saving ? C.bg2 : C.accent, color: saving ? C.fg3 : '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {confirmDel && (
        <ConfirmModal
          title="Delete clip?"
          message="Are you sure you want to delete this clip? You can undo for a few seconds."
          confirmLabel="Delete"
          onConfirm={() => { setConfirmDel(false); onClose(); onDelete(clip); }}
          onCancel={() => setConfirmDel(false)} />
      )}
    </>
  );
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ResearchVault/ClipModal.jsx
git commit -m "feat: add ClipModal — view, edit metadata, delete a clip"
```

---

### Task 11: `ResearchVaultPage` (index) + route wiring in App.jsx

**Files:**
- Create: `src/pages/ResearchVault/index.jsx`
- Modify: `src/App.jsx` (lazy import ~line 27-29; `DETAIL` array line 32; `renderPage` switch ~line 248)

- [ ] **Step 1: Create `src/pages/ResearchVault/index.jsx`**

```jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { C } from '../../tokens';
import { db } from '../../firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { deleteFileFromDB } from '../../utils/fileStorage';
import VaultHeader from './VaultHeader';
import ClipCard from './ClipCard';
import { TimelineGroups } from './TimelineGroups';
import AddClipModal from './AddClipModal';
import ClipModal from './ClipModal';
import EmptyState from './EmptyState';

const VIEW_KEY = 'nb_vault_view';

const clipsCol = (planId)     => collection(db, 'sharedPlans', String(planId), 'clips');
const clipRef  = (planId, id) => doc(db, 'sharedPlans', String(planId), 'clips', String(id));

const todayStr = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// Toast "Undo" window for action toasts is 5s (see ToastContext). Defer the
// blob delete a little past that so an Undo restores the clip with its file
// intact, but a genuine delete still reclaims storage.
const BLOB_DELETE_DELAY = 6000;

export default function ResearchVaultPage({ planId, plan, onNavigate }) {
  const { showToast } = useToast();
  const { user, isViewer } = useAuth();

  const [clips,   setClips]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [view,    setView]    = useState(() => {
    try { return localStorage.getItem(VIEW_KEY) === 'timeline' ? 'timeline' : 'grid'; }
    catch { return 'grid'; }
  });
  const [typeFilter, setTypeFilter] = useState('all');
  const [search,     setSearch]     = useState('');
  const [sort,       setSort]       = useState('newest');
  const [addOpen,    setAddOpen]    = useState(false);
  const [activeClip, setActiveClip] = useState(null);

  // Subscribe to this project's clips subcollection. On error (e.g. the e2e
  // harness has no auth, or a permission-denied) degrade to an empty list
  // rather than crashing — the same defensive pattern as DiscussionThread.
  useEffect(() => {
    if (!planId) { setClips([]); setLoading(false); return; }
    setLoading(true);
    const q = query(clipsCol(planId), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q,
      snap => { setClips(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); },
      err  => { console.error('[ResearchVault/onSnapshot]', err); setClips([]); setLoading(false); }
    );
    return () => unsub();
  }, [planId]);

  const changeView = useCallback((next) => {
    setView(next);
    try { localStorage.setItem(VIEW_KEY, next); } catch { /* private mode */ }
  }, []);

  const handleAddClip = useCallback(async (clip) => {
    const id = Date.now();
    const record = {
      ...clip,
      id,
      createdAt: id,
      date: todayStr(),
      addedBy: user?.email || user?.uid || '',
    };
    await setDoc(clipRef(planId, id), record);
  }, [planId, user]);

  const handleUpdateClip = useCallback(async (id, patch) => {
    await updateDoc(clipRef(planId, id), patch);
  }, [planId]);

  const handleDeleteClip = useCallback((clip) => {
    // Delete the Firestore doc immediately; show an Undo toast. The blob
    // delete (pdf/photo) is deferred past the Undo window so Undo restores
    // the clip with its file intact.
    deleteDoc(clipRef(planId, clip.id)).catch(e => console.error('[deleteClip]', e));
    let undone = false;
    showToast('Clip deleted', 'info', {
      label: 'Undo',
      onClick: () => {
        undone = true;
        setDoc(clipRef(planId, clip.id), clip).catch(e => console.error('[restoreClip]', e));
      },
    });
    const blobId = clip.attachedFile?.blobId || clip.photo?.blobId;
    if (blobId) {
      setTimeout(() => { if (!undone) deleteFileFromDB(blobId); }, BLOB_DELETE_DELAY);
    }
  }, [planId, showToast]);

  const openClip = useCallback((clip) => {
    if (clip.type === 'web' && clip.url) {
      window.open(clip.url, '_blank', 'noopener,noreferrer');
    } else {
      setActiveClip(clip);
    }
  }, []);

  // Apply the type filter + text search; grid view additionally sorts.
  const visible = useMemo(() => {
    const s = search.trim().toLowerCase();
    let list = clips.filter(c => {
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (!s) return true;
      const hay = [
        c.title, c.description, c.sourceLabel, c.quoteText,
        ...(Array.isArray(c.tags) ? c.tags : []),
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(s);
    });
    if (view === 'grid') {
      list = [...list].sort((a, b) =>
        sort === 'newest'
          ? (b.createdAt || 0) - (a.createdAt || 0)
          : (a.createdAt || 0) - (b.createdAt || 0));
    }
    return list;
  }, [clips, typeFilter, search, sort, view]);

  const planTitle = plan?.title || 'Project';
  const canAdd = !isViewer;

  return (
    <div className="page-pad" style={{ background: C.bg0, flex: 1, overflowY: 'auto' }}>
      <VaultHeader
        planTitle={planTitle}
        clipCount={clips.length}
        view={view}
        onChangeView={changeView}
        typeFilter={typeFilter}
        onChangeTypeFilter={setTypeFilter}
        search={search}
        onChangeSearch={setSearch}
        sort={sort}
        onChangeSort={setSort}
        onNewClip={() => setAddOpen(true)}
        onBack={() => onNavigate(plan ? 'project-detail' : 'projects', plan ? { id: plan.id } : null)}
        canAdd={canAdd}
      />

      {loading && (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg3, padding: '40px 0', textAlign: 'center' }}>
          Loading clips…
        </div>
      )}

      {!loading && clips.length === 0 && (
        <EmptyState onAddClip={() => setAddOpen(true)} canAdd={canAdd} />
      )}

      {!loading && clips.length > 0 && visible.length === 0 && (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg3, padding: '40px 0', textAlign: 'center' }}>
          No clips match your filter.
        </div>
      )}

      {!loading && visible.length > 0 && view === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {visible.map(clip => <ClipCard key={clip.id} clip={clip} onOpen={openClip} />)}
        </div>
      )}

      {!loading && visible.length > 0 && view === 'timeline' && (
        <TimelineGroups clips={visible} onOpen={openClip} />
      )}

      {addOpen && (
        <AddClipModal onClose={() => setAddOpen(false)} onAdd={handleAddClip} />
      )}

      {activeClip && (
        <ClipModal
          clip={activeClip}
          onClose={() => setActiveClip(null)}
          onUpdate={handleUpdateClip}
          onDelete={handleDeleteClip}
          canEdit={canAdd}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add the lazy import in `src/App.jsx`**

In `src/App.jsx`, find this line (~line 29):

```jsx
const SettingsPage     = lazy(() => import('./pages/SettingsPage'));
```

Add immediately after it:

```jsx
const ResearchVaultPage = lazy(() => import('./pages/ResearchVault'));
```

- [ ] **Step 3: Add `'research'` to the `DETAIL` route list in `src/App.jsx`**

Find this line (~line 32):

```jsx
const DETAIL   = ['idea-detail', 'project-detail', 'new-idea', 'new-project', 'document-detail'];
```

Replace it with:

```jsx
const DETAIL   = ['idea-detail', 'project-detail', 'new-idea', 'new-project', 'document-detail', 'research'];
```

- [ ] **Step 4: Add the `renderPage` case in `src/App.jsx`**

Find this line in the `renderPage` switch (~line 249):

```jsx
      case 'scenarios':      return <ScenariosPage onNavigate={navigate} />;
```

Add immediately before it:

```jsx
      case 'research':
        if (!itemId) return <NotFound label="Project" dest="projects" onNavigate={navigate} />;
        return <ResearchVaultPage key={itemId} planId={itemId} plan={plan} onNavigate={navigate} />;
```

(`plan` is already computed at ~line 226: `const plan = plans.find(p => p.id == itemId);` — the new case reuses it.)

- [ ] **Step 5: Verify the build passes**

Run: `npm run build`
Expected: build completes with no errors. A new `ResearchVault` chunk should appear in the build output.

- [ ] **Step 6: Manual smoke check**

Run: `npm run dev`, open the app, append `#/research/1` to the URL.
Expected: the vault page renders with the "Research Log" title, breadcrumb, controls, and the "No clips yet" empty state (no plan exists locally, so the breadcrumb shows "PROJECT").

- [ ] **Step 7: Commit**

```bash
git add src/pages/ResearchVault/index.jsx src/App.jsx
git commit -m "feat: add ResearchVaultPage and wire the research route"
```

---

### Task 12: Project Detail header button + clip count

**Files:**
- Modify: `src/pages/PlanDetailPage.jsx` (imports ~line 1-18; state ~line 36-58; new effect after ~line 87; hero-actions JSX ~line 314)

- [ ] **Step 1: Add the Firestore imports to `src/pages/PlanDetailPage.jsx`**

At the top of `src/pages/PlanDetailPage.jsx`, find:

```jsx
import { C, alpha } from '../tokens';
import { usePlans, useIdeas } from '../context/AppContext';
```

Add immediately after the second line:

```jsx
import { db } from '../firebase';
import { collection, getCountFromServer } from 'firebase/firestore';
```

- [ ] **Step 2: Add the clip-count state**

Find this line (~line 53):

```jsx
  const [confirmDel, setConfirmDel] = useState(false);
```

Add immediately after it:

```jsx
  const [clipCount, setClipCount] = useState(null);
```

- [ ] **Step 3: Add the count-fetch effect**

Find the end of the scroll-to-top `useEffect` (the line `}, [plan.id]);` at ~line 87, immediately before the `const inputStyle = ...` line). Add this new effect immediately after that `}, [plan.id]);`:

```jsx
  // One-shot lightweight count of the project's research clips for the
  // header button. If it fails (offline / rules), the button still renders
  // without the "· N" suffix — the count is decorative, not load-bearing.
  useEffect(() => {
    let alive = true;
    getCountFromServer(collection(db, 'sharedPlans', String(plan.id), 'clips'))
      .then(snap => { if (alive) setClipCount(snap.data().count); })
      .catch(() => { /* leave null */ });
    return () => { alive = false; };
  }, [plan.id]);
```

- [ ] **Step 4: Add the Research Vault button to the hero toolbar**

Find this block in the `plan-hero-actions` div (~line 315):

```jsx
          <div className="plan-hero-actions">
            {!isEditing && sections.length > 0 && (
              <button onClick={handleExportPDF} className="plan-hero-btn plan-hero-btn-ghost">
```

Insert the new button immediately after `<div className="plan-hero-actions">` and before the `{!isEditing && sections.length > 0 && (` line:

```jsx
            {!isEditing && (
              <button onClick={() => onNavigate('research', { id: plan.id })} className="plan-hero-btn plan-hero-btn-ghost">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                Research Vault{clipCount != null ? ` · ${clipCount}` : ''}
              </button>
            )}
```

- [ ] **Step 5: Verify the build passes**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 6: Manual smoke check**

Run: `npm run dev`, sign in, open any project's detail page.
Expected: a "Research Vault" button appears in the hero toolbar next to Edit/Delete. Clicking it navigates to `#/research/<planId>` and renders the vault page with the correct project title in the breadcrumb.

- [ ] **Step 7: Commit**

```bash
git add src/pages/PlanDetailPage.jsx
git commit -m "feat: add Research Vault entry button + clip count to Project Detail"
```

---

### Task 13: Playwright e2e spec

**Files:**
- Create: `e2e/research-vault.spec.js`

**Note:** The e2e harness (`?e2e=1`) bypasses auth and runs with empty Firestore data, so this spec covers UI presence only. Full clip CRUD is verified via runtime use — the same approach documented in `e2e/linking.spec.js`.

- [ ] **Step 1: Create the spec file**

```javascript
/**
 * Research Vault — verifies the vault page UI shell renders. The e2e harness
 * runs with empty Firestore data, so this covers UI presence; clip CRUD
 * (add/edit/delete/undo, click behaviour, week grouping, viewer permissions)
 * is trusted via runtime use — same approach as e2e/linking.spec.js.
 */
import { test, expect } from '@playwright/test';
import { goto } from './helpers.js';

test('vault page renders the Research Log title', async ({ page }) => {
  await goto(page, 'research/1');
  await expect(page.locator('.page-title').filter({ hasText: 'Research Log' }).first()).toBeVisible();
});

test('New Clip button is present', async ({ page }) => {
  await goto(page, 'research/1');
  await expect(page.locator('button').filter({ hasText: /New Clip/ }).first()).toBeVisible();
});

test('breadcrumb shows the Research segment', async ({ page }) => {
  await goto(page, 'research/1');
  await expect(page.locator('text=RESEARCH').first()).toBeVisible();
});

test('type filter chips render with correct labels', async ({ page }) => {
  await goto(page, 'research/1');
  for (const label of ['All', 'Web', 'PDF', 'Quote', 'Photo']) {
    await expect(
      page.locator('button').filter({ hasText: new RegExp(`^${label}$`) }).first()
    ).toBeVisible();
  }
});

test('search input is present', async ({ page }) => {
  await goto(page, 'research/1');
  await expect(page.locator('input[placeholder*="Search"]').first()).toBeVisible();
});

test('empty state renders when no clips exist', async ({ page }) => {
  // In e2e mode there is no Firestore data, so the empty state shows.
  await goto(page, 'research/1');
  await expect(page.locator('text=No clips yet').first()).toBeVisible();
});

test('view toggle switches the active view', async ({ page }) => {
  await goto(page, 'research/1');
  const timelineBtn = page.locator('button[aria-pressed]').filter({ hasText: /^timeline$/i }).first();
  await timelineBtn.click();
  await page.waitForTimeout(150);
  await expect(timelineBtn).toHaveAttribute('aria-pressed', 'true');
});

test('New Clip opens the add-clip modal with the type picker', async ({ page }) => {
  await goto(page, 'research/1');
  await page.locator('button').filter({ hasText: /New Clip/ }).first().click();
  await page.waitForTimeout(200);
  await expect(page.locator('text=Choose a clip type').first()).toBeVisible();
});

test('#/research with no id renders Not Found', async ({ page }) => {
  await goto(page, 'research');
  await expect(page.locator('text=/not found/i').first()).toBeVisible();
});
```

- [ ] **Step 2: Run the new spec**

Run: `npm run test:e2e -- research-vault`
Expected: all 9 tests pass across the configured projects (web / ipad / mobile).

- [ ] **Step 3: Run the full e2e suite for regressions**

Run: `npm run test:e2e`
Expected: the full suite passes — the new route and the PlanDetailPage button change introduce no regressions. In particular `e2e/navigation.spec.js` and `e2e/projects.spec.js` should still pass.

- [ ] **Step 4: Verify the build passes**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 5: Commit**

```bash
git add e2e/research-vault.spec.js
git commit -m "test: add Research Vault e2e spec (UI presence)"
```

---

## Self-Review

**1. Spec coverage:**

| Spec requirement | Task |
|---|---|
| Subcollection `sharedPlans/{planId}/clips`, clip id = `Date.now()` | Task 11 (`clipRef`, `handleAddClip`) |
| Clip document shape (type/title/description/tags/sourceLabel/date/createdAt/addedBy + type-specific) | Tasks 9, 11 |
| PDF/photo uploads reuse `fileStorage.js`; photo needs image contentType | Tasks 2, 9 |
| `firestore.rules` rule for clips subcollection, viewers read-only | Task 1 (write requires `isAllowed()`; viewer gating is client-side per app convention) |
| Route `research/<planId>`, `planId`-driven, `NotFound` only when id absent | Task 11 |
| `PlanDetailPage` header button "Research Vault · N clips", count via `getCountFromServer`, degrades without suffix | Task 12 |
| Breadcrumb `PROJECT / <title> / RESEARCH` | Task 6 |
| Components: index, VaultHeader, ClipCard, ClipRow, TimelineGroups, AddClipModal, ClipModal, EmptyState | Tasks 4–11 |
| View toggle persisted in `localStorage` | Task 11 (`VIEW_KEY`, `changeView`) |
| Filter + search shared; grid-only sort | Tasks 6, 11 (`visible` memo) |
| Add clip: type picker → type-specific fields; upload-then-write ordering | Task 9 |
| Click clip: web → new tab; others → `ClipModal` | Task 11 (`openClip`) |
| `isViewer` hides New Clip / edit / delete | Tasks 5, 6, 10, 11 (`canAdd`) |
| Upload failure keeps modal open with toast | Task 9 (`handleSubmit` catch) |
| Delete: doc first, Undo toast, deferred blob delete | Task 11 (`handleDeleteClip`) |
| Clips snapshot error → empty state, no crash | Task 11 (`onSnapshot` error callback) |
| Bad route (`research`, no id) → `NotFound` | Task 11 |
| Loading / empty / no-match states | Task 11 |
| e2e `research-vault.spec.js` | Task 13 |

All spec sections map to a task. No gaps.

**2. Placeholder scan:** No "TBD"/"TODO"/"handle edge cases"/"similar to Task N" — every code step contains complete code. The only deferred action is the Firestore rules *deploy* (Task 1 Step 3), which is operational, not a code placeholder.

**3. Type consistency:** Verified across tasks —
- `CLIP_TYPES` / `CLIP_TYPE_ORDER` defined in Task 4, imported in Tasks 6 (not used — labels hardcoded, OK), 9.
- `bucketByWeek` defined in Task 3, imported in Task 8.
- `TimelineGroups` is a **named** export (Task 8) and imported as `{ TimelineGroups }` (Task 11). Consistent.
- `uploadImageToDB` defined in Task 2, imported in Task 9.
- Clip-record fields written in `handleAddClip` (Task 11: `id`, `createdAt`, `date`, `addedBy`, plus `...clip`) match the fields read in `ClipCard`/`ClipRow`/`ClipModal`/`bucketByWeek` (`type`, `title`, `description`, `tags`, `sourceLabel`, `url`, `quoteText`, `attachedFile`, `photo`, `createdAt`, `date`).
- `handleUpdateClip(id, patch)` (Task 11) signature matches `onUpdate(clip.id, {...})` call in `ClipModal` (Task 10).
- `handleDeleteClip(clip)` (Task 11) takes the whole clip object; `ClipModal`'s `onDelete(clip)` passes it. Consistent.
- `onNavigate('research', { id: plan.id })` (Task 12) matches `App.jsx` `navigate(dest, data)` signature where `id = data?.id`.

No inconsistencies found.
