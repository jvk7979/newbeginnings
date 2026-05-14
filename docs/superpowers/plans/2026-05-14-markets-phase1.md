# Markets Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Documents page with a Markets feature — a `sharedCommodities` collection with manual price entry, a "Today's Mandi" overview grid, and a per-commodity detail view.

**Architecture:** Remove the Documents page and its `sharedFiles` data layer entirely (the file-upload plumbing stays — it's shared with Plan/Idea attachments and Research Vault). Add a top-level `sharedCommodities` Firestore collection subscribed in `AppContext` in the slot `sharedFiles` vacates, exposed via `useCommodities()`. Each commodity embeds its full price `history`; all derived values (current price, 12-week % change, 52-week range, sparkline) are computed client-side by pure helpers.

**Tech Stack:** React 18, Vite, Firebase Firestore, hash-based routing (hand-rolled in `App.jsx`), inline styles with the `C` design-token proxy, Playwright e2e.

**Reference spec:** `docs/superpowers/specs/2026-05-14-markets-phase1-design.md`

**Verification note:** This project has **no unit-test runner** — verification is `npm run build` (must pass) plus Playwright e2e. Each task ends with a build check; the e2e spec is the final task. The e2e harness (`?e2e=1`) runs with empty Firestore data, so e2e covers UI presence only. There are **14 pre-existing failures** in `e2e/theming.spec.js` (retired `aura`/`lemon` themes) unrelated to this work — ignore them.

**Task ordering:** Tasks 1–2 remove Documents (build stays green at each commit). Tasks 3–14 add Markets. Each task ends with `npm run build` passing and a commit.

---

## Part A — Remove Documents

### Task 1: Remove Documents from the app chrome

Removes every Documents reference from the navigation, command palette, About page, and Dashboard — but leaves the route, page files, and `sharedFiles` context intact (Task 2 removes those). The build stays green because nothing here depends on what Task 2 removes.

**Files:**
- Modify: `src/components/SideNav.jsx`
- Modify: `src/components/CommandPalette.jsx`
- Modify: `src/pages/AboutPage.jsx`
- Modify: `src/pages/Dashboard.jsx`
- Modify: `src/styles.css`
- Modify: `e2e/dashboard.spec.js`
- Modify: `e2e/about.spec.js`

- [ ] **Step 1: Remove the Documents nav item from `SideNav.jsx`**

In `src/components/SideNav.jsx`, delete this entry from the `NAV_ITEMS` array (it's the `id: 'documents'` object, currently between the `projects` and `calculations` entries):

```jsx
  {
    id: 'documents', label: 'Documents',
    icon: <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  },
```

And in the `ACTIVE_MAP` object, delete this line:

```jsx
  'document-detail': 'documents',
```

- [ ] **Step 2: Remove the `go-documents` command from `CommandPalette.jsx`**

In `src/components/CommandPalette.jsx`, delete this line from the `items` array:

```jsx
      { id: 'go-documents', label: 'Go to Documents',  group: 'Navigate', keywords: 'documents files pdf',      run: () => onNavigate('documents') },
```

- [ ] **Step 3: Remove the Documents references from `AboutPage.jsx`**

In `src/pages/AboutPage.jsx`, delete this entry from the `PAGES` array (the `dest: 'documents'` object):

```jsx
  {
    icon: <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><circle cx="11" cy="14" r="3"/><path d="M13.5 16.5l2.5 2.5"/></svg>,
    dest: 'documents',
    title: 'Documents',
    desc: "Where the PDFs live — feasibility reports, market studies, government scheme docs, anything I want all of us reading the same copy of. Read directly in the app, no download needed.",
  },
```

And delete the entire fifth `<li>` from the "How I use this site" ordered list:

```jsx
            <li>
              <strong style={{ color: C.fg1 }}>Keep the documents in one place.</strong> Feasibility reports and market studies live in <button onClick={() => onNavigate('documents')} style={{ background: 'none', border: 'none', color: C.accent, fontWeight: 600, cursor: 'pointer', padding: 0, font: 'inherit' }}>Documents</button> — readable directly in the app, no downloads, same copy for everyone.
            </li>
```

(The `<li>` immediately before it — "Run the numbers." — keeps its `marginBottom: 10`; that is fine, a harmless trailing margin.)

- [ ] **Step 4: Remove the Recent Documents column from `Dashboard.jsx`**

In `src/pages/Dashboard.jsx`:

1. Change the import on line 7 from:
   ```jsx
   import { IllIdea, IllPlan, IllDoc } from '../components/illustrations';
   ```
   to:
   ```jsx
   import { IllIdea, IllPlan } from '../components/illustrations';
   ```
2. Change the import on line 3 from:
   ```jsx
   import { useIdeas, usePlans, useFiles } from '../context/AppContext';
   ```
   to:
   ```jsx
   import { useIdeas, usePlans } from '../context/AppContext';
   ```
3. Delete the line `const { files } = useFiles();` from the `Dashboard` component body.
4. Delete the line `const recentDocuments = useMemo(() => files.slice(0, 4), [files]);`.
5. Delete the entire `{/* Documents */}` column `<div>` block — it starts with the comment `{/* Documents */}` and is the third child of `<div ref={colsReveal.ref} className="dh-three-col">`. It runs from `{/* Documents */}` through its closing `</div>` (the block containing the `SectionHeader` with `title="Recent Documents"`, the `recentDocuments.length === 0` ternary, and the `recentDocuments.map(...)`).
6. Search the file for `ICON_DOC` — it is a `const` defined near the top of the file and is now only referenced by the deleted block. Delete the `ICON_DOC` constant definition.
7. After these edits, search `Dashboard.jsx` for `files`, `useFiles`, `IllDoc`, `ICON_DOC`, `recentDocuments`, `document-detail` — there must be **zero** remaining matches.

- [ ] **Step 5: Make the Dashboard body grid two columns in `styles.css`**

In `src/styles.css`, find the `.dh-three-col` rule (around line 5398) and change its `grid-template-columns` from three to two:

```css
.dh-three-col {
  display: grid;
  /* Two columns since the Documents column was removed — the class name
     is kept to avoid churning the markup. */
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 28px;
  margin-bottom: 48px;
}
```

(The `@media (max-width: 960px)` rule below it already collapses to `1fr` — leave it unchanged.)

- [ ] **Step 6: Update `e2e/dashboard.spec.js`**

In `e2e/dashboard.spec.js`, the test `three-column body sections render` — rename it and remove the Recent Documents assertion:

```javascript
test('two-column body sections render', async ({ page }) => {
  await expect(page.locator('.dh-section-title').filter({ hasText: 'Featured Ideas' })).toBeVisible();
  await expect(page.locator('.dh-section-title').filter({ hasText: 'Active Projects' })).toBeVisible();
});
```

- [ ] **Step 7: Update `e2e/about.spec.js`**

In `e2e/about.spec.js`, the test `page-by-page guide lists all 5 pages` — rename it and drop `'Documents'` from the loop:

```javascript
test('page-by-page guide lists all 4 pages', async ({ page }) => {
  await expect(page.locator('text=Page by page').first()).toBeVisible();
  const body = await page.locator('body').innerText();
  for (const title of ['Home', 'Ideas', 'Projects', 'Calculations']) {
    expect(body).toContain(title);
  }
});
```

- [ ] **Step 8: Verify the build passes**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 9: Commit**

```bash
git add src/components/SideNav.jsx src/components/CommandPalette.jsx src/pages/AboutPage.jsx src/pages/Dashboard.jsx src/styles.css e2e/dashboard.spec.js e2e/about.spec.js
git commit -m "refactor: remove Documents from nav, palette, About, and Dashboard"
```

---

### Task 2: Remove the Documents route, pages, and data layer

Removes the `documents` / `document-detail` routes, the page files, the `sharedFiles` collection from `AppContext`, and the Firestore rule. The file-upload utilities stay untouched.

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/context/AppContext.jsx`
- Modify: `firestore.rules`
- Modify: `e2e/smoke.spec.js`
- Modify: `e2e/ux-polish.spec.js`
- Delete: `src/pages/FilesPage.jsx`
- Delete: `src/pages/FileDetailPage.jsx`

- [ ] **Step 1: Remove Documents wiring from `App.jsx`**

In `src/App.jsx`:

1. Change the import on line 5 from:
   ```jsx
   import { useIdeas, usePlans, useFiles, useBackup } from './context/AppContext';
   ```
   to:
   ```jsx
   import { useIdeas, usePlans, useBackup } from './context/AppContext';
   ```
2. Delete the two lazy-import lines:
   ```jsx
   const FilesPage       = lazy(() => import('./pages/FilesPage'));
   const FileDetailPage  = lazy(() => import('./pages/FileDetailPage'));
   ```
3. In `LINKABLE`, remove `'documents'`:
   ```jsx
   const LINKABLE = ['dashboard', 'ideas', 'projects', 'about', 'access', 'calculations', 'scenarios', 'settings'];
   ```
4. In `DETAIL`, remove `'document-detail'`:
   ```jsx
   const DETAIL   = ['idea-detail', 'project-detail', 'new-idea', 'new-project', 'research'];
   ```
5. Delete the line `const { files } = useFiles();` from the `App` component body.
6. Delete the line `const file = files.find(f => f.id == itemId);`.
7. In `renderPage`, delete the `case 'documents'` and `case 'document-detail'` branches:
   ```jsx
      case 'documents':      return <FilesPage onNavigate={navigate} />;
      case 'document-detail':
        if (!itemId || !file) return <NotFound label="Document" dest="documents" onNavigate={navigate} />;
        return <FileDetailPage key={file.id} file={file} onNavigate={navigate} />;
   ```

- [ ] **Step 2: Remove the `sharedFiles` collection from `AppContext.jsx`**

In `src/context/AppContext.jsx`:

1. Delete the `FilesContext` declaration:
   ```jsx
   const FilesContext    = createContext(null);
   ```
2. Delete the `fileRef` helper:
   ```jsx
   const fileRef = (id) => doc(db, 'sharedFiles', String(id));
   ```
3. Delete the `files` state line: `const [files,    setFiles]    = useState([]);`
4. In the `useEffect`, in the `if (!user)` reset, remove `setFiles([]);`.
5. In the `useEffect`, change the ready-gate `tick` from 4 to 3 — replace:
   ```jsx
   const tick = () => { loadedCount.current++; if (loadedCount.current >= 4) setDataLoading(false); };
   ```
   with:
   ```jsx
   const tick = () => { loadedCount.current++; if (loadedCount.current >= 3) setDataLoading(false); };
   ```
6. Delete the `u4` files subscription line:
   ```jsx
   const u4 = onSnapshot(collection(db, 'sharedFiles'), s => { setFiles(sort(s.docs.map(d => d.data()))); tick(); }, () => tick());
   ```
7. Change the cleanup return from `return () => { u1(); u2(); u3(); u4(); clearTimeout(timeout); };` to `return () => { u1(); u2(); u3(); clearTimeout(timeout); };`.
8. Delete the entire `// ── Shared Files ──` section — the `addFile`, `updateFile`, and `deleteFile` `useCallback` definitions.
9. Delete the `filesValue` memo:
   ```jsx
   const filesValue    = useMemo(() => ({ files, addFile, updateFile, deleteFile }),
     [files, addFile, updateFile, deleteFile]);
   ```
10. In the returned provider tree, remove the `<FilesContext.Provider value={filesValue}>` wrapper (keep its children) so the nesting becomes:
    ```jsx
    return (
      <ProjectsContext.Provider value={projectsValue}>
        <PlansContext.Provider value={plansValue}>
          <IdeasContext.Provider value={ideasValue}>
            <BackupContext.Provider value={backupValue}>
              {children}
            </BackupContext.Provider>
          </IdeasContext.Provider>
        </PlansContext.Provider>
      </ProjectsContext.Provider>
    );
    ```
11. Delete the `useFiles` hook export:
    ```jsx
    export function useFiles()    { return useContext(FilesContext); }
    ```
12. In `useAppData`, delete the `...useFiles(),` line.

After these edits, search `AppContext.jsx` for `files`, `Files`, `sharedFiles` — there must be zero remaining matches.

- [ ] **Step 3: Remove the `sharedFiles` rule from `firestore.rules`**

In `firestore.rules`, delete this block:

```
    match /sharedFiles/{fileId} {
      allow read, write: if request.auth != null && isAllowed();
    }
```

- [ ] **Step 4: Delete the page files**

```bash
git rm src/pages/FilesPage.jsx src/pages/FileDetailPage.jsx
```

- [ ] **Step 5: Update `e2e/smoke.spec.js`**

In `e2e/smoke.spec.js`, remove the Documents entry from the `PAGES` array:

```javascript
const PAGES = [
  { hash: 'dashboard',    label: 'Dashboard' },
  { hash: 'ideas',        label: 'Ideas' },
  { hash: 'new-idea',     label: 'New Idea' },
  { hash: 'projects',     label: 'Projects' },
  { hash: 'new-project',  label: 'New Project' },
  { hash: 'calculations', label: 'Calculations' },
  { hash: 'about',        label: 'About' },
];
```

- [ ] **Step 6: Update `e2e/ux-polish.spec.js`**

In `e2e/ux-polish.spec.js`:

1. Remove `'documents'` from the `ATMO_PAGES` array:
   ```javascript
   const ATMO_PAGES = [
     'ideas', 'projects', 'settings', 'about', 'new-idea', 'new-project',
   ];
   ```
2. Delete the entire `Files empty state has the badge + themed CTA with new copy` test:
   ```javascript
   test('Files empty state has the badge + themed CTA with new copy', async ({ page }) => {
     await goto(page, 'documents');
     await expect(page.locator('.empty-state-art').first()).toBeVisible();
     await expect(page.locator('.empty-state .themed-cta').filter({ hasText: /Add a document/i }))
       .toBeVisible();
   });
   ```

- [ ] **Step 7: Verify the build passes**

Run: `npm run build`
Expected: build completes with no errors, no `ResearchVault`/`Files` chunk warnings about missing imports.

- [ ] **Step 8: Commit**

```bash
git add src/App.jsx src/context/AppContext.jsx firestore.rules e2e/smoke.spec.js e2e/ux-polish.spec.js
git commit -m "refactor: remove the Documents route, pages, and sharedFiles data layer"
```

---

## Part B — Markets core

### Task 3: Markets utility modules

Two pure, dependency-free modules. Not imported anywhere yet — that is expected.

**Files:**
- Create: `src/pages/Markets/marketsMath.js`
- Create: `src/pages/Markets/commodityColors.js`

- [ ] **Step 1: Create `src/pages/Markets/marketsMath.js`**

```javascript
// Pure helpers for deriving display values from a commodity's price history.
// `history` is an array of { ts, date, price }; callers must treat it as
// possibly unsorted and possibly empty.

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// A copy of history sorted ascending by ts.
export function sortHistory(history) {
  return [...(history || [])].sort((a, b) => (a.ts || 0) - (b.ts || 0));
}

// The latest price, or null when there is no history.
export function currentPrice(history) {
  const sorted = sortHistory(history);
  return sorted.length ? sorted[sorted.length - 1].price : null;
}

// Percentage change of the latest price vs the most recent entry at or
// before `weeks` ago. Falls back to the earliest entry when there is less
// than `weeks` of data. Returns null when there are fewer than 2 entries
// or the baseline price is zero.
export function pctChange(history, weeks) {
  const sorted = sortHistory(history);
  if (sorted.length < 2) return null;
  const latest = sorted[sorted.length - 1];
  const cutoff = latest.ts - weeks * WEEK_MS;
  let baseline = sorted[0];
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].ts <= cutoff) { baseline = sorted[i]; break; }
  }
  if (!baseline.price) return null;
  return ((latest.price - baseline.price) / baseline.price) * 100;
}

// { low, high } over entries within the last 52 weeks (all entries when
// there is less than 52 weeks of data). Null when history is empty.
export function range52w(history) {
  const sorted = sortHistory(history);
  if (!sorted.length) return null;
  const latestTs = sorted[sorted.length - 1].ts;
  const cutoff = latestTs - 52 * WEEK_MS;
  const within = sorted.filter(e => e.ts >= cutoff);
  const pool = within.length ? within : sorted;
  const prices = pool.map(e => e.price);
  return { low: Math.min(...prices), high: Math.max(...prices) };
}
```

- [ ] **Step 2: Create `src/pages/Markets/commodityColors.js`**

```javascript
// Fixed data-series palette for commodities — mirrors the PRODUCT_COLORS
// pattern in calcEngine.js. Each commodity stores a `color` key (stable per
// commodity); it resolves to a hex for sparklines, dots, and charts. Fixed
// hexes (not theme tokens) because these are data-viz series colours — the
// same approach the Calculations charts use.
export const COMMODITY_COLORS = [
  { key: 'amber', label: 'Amber', hex: '#D4A853' },
  { key: 'sage',  label: 'Sage',  hex: '#7BA874' },
  { key: 'clay',  label: 'Clay',  hex: '#B08968' },
  { key: 'rust',  label: 'Rust',  hex: '#C4704F' },
  { key: 'slate', label: 'Slate', hex: '#6B8CAE' },
  { key: 'plum',  label: 'Plum',  hex: '#9B7EA8' },
];

const FALLBACK = COMMODITY_COLORS[0];

// Resolve a stored colour key to its hex. Unknown / missing keys fall back
// to the first palette entry so a card never renders without a colour.
export function colorFor(key) {
  return (COMMODITY_COLORS.find(c => c.key === key) || FALLBACK).hex;
}
```

- [ ] **Step 3: Verify the build passes**

Run: `npm run build`
Expected: build completes with no errors (both files parse; not imported yet).

- [ ] **Step 4: Commit**

```bash
git add src/pages/Markets/marketsMath.js src/pages/Markets/commodityColors.js
git commit -m "feat: add Markets utility modules (price math + colour palette)"
```

---

### Task 4: Add the `sharedCommodities` collection to `AppContext`

Adds the new collection in the slot `sharedFiles` vacated in Task 2 — subscription, CRUD, context, hook, and first-load seeding.

**Files:**
- Modify: `src/context/AppContext.jsx`

- [ ] **Step 1: Add the `SEED_COMMODITIES` constant**

In `src/context/AppContext.jsx`, immediately after the `SEED_PLANS` constant (before the `todayStr` function), add:

```jsx
// Starter commodities seeded on first load — each carries one initial price
// point so the Markets overview grid renders meaningfully from day one.
const SEED_COMMODITIES = (() => {
  const ts = Date.now();
  const date = new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return [
    { name: 'Coconut Husk',    unit: '₹/piece',   mandi: 'Rajahmundry mandi', color: 'amber', price: 0.95 },
    { name: 'Coir Fiber',      unit: '₹/kg',      mandi: 'Rajahmundry mandi', color: 'sage',  price: 24.5 },
    { name: 'Copra (Milling)', unit: '₹/quintal', mandi: 'Rajahmundry mandi', color: 'clay',  price: 11850 },
    { name: 'Shell Charcoal',  unit: '₹/kg',      mandi: 'Rajahmundry mandi', color: 'rust',  price: 38.0 },
  ].map((c, i) => ({
    id: ts + i,
    name: c.name, unit: c.unit, mandi: c.mandi, color: c.color, notes: '',
    addedBy: 'seed', createdAt: ts + i,
    history: [{ ts, date, price: c.price }],
  }));
})();
```

- [ ] **Step 2: Add `commodities` to the `SHARED` map**

Change the `SHARED` constant from:

```jsx
const SHARED = { ideas: 'sharedIdeas', projects: 'sharedProjects', plans: 'sharedPlans' };
```

to:

```jsx
const SHARED = { ideas: 'sharedIdeas', projects: 'sharedProjects', plans: 'sharedPlans', commodities: 'sharedCommodities' };
```

- [ ] **Step 3: Add the `ensureCommoditiesSeed` function**

Immediately after the `ensureSharedData` function (before the `// ── Five separate contexts ──` comment), add:

```jsx
// Seed the four starter commodities on first load. Independent of
// ensureSharedData's ideas/projects/plans migration so it also runs on
// installs that already have idea data.
async function ensureCommoditiesSeed() {
  const snap = await getDocs(sharedCol('commodities'));
  if (!snap.empty) return;
  const batch = writeBatch(db);
  SEED_COMMODITIES.forEach(c => batch.set(sharedRef('commodities', c.id), c));
  await batch.commit();
}
```

- [ ] **Step 4: Add the `CommoditiesContext` declaration**

In the block of `createContext` calls, add a `CommoditiesContext` line alongside the others:

```jsx
const IdeasContext    = createContext(null);
const PlansContext    = createContext(null);
const ProjectsContext = createContext(null);
const BackupContext   = createContext(null);
const CommoditiesContext = createContext(null);
```

(If Task 2 left the `createContext` block in a different order, just add the `CommoditiesContext` line to it — order does not matter.)

- [ ] **Step 5: Add the `commodities` state and subscription**

In `AppProvider`:

1. Add the state line alongside the others:
   ```jsx
   const [commodities, setCommodities] = useState([]);
   ```
2. In the `useEffect`'s `if (!user)` reset, add `setCommodities([]);`.
3. After the `ensureSharedData(uid);` call, add:
   ```jsx
   ensureCommoditiesSeed();
   ```
4. Change the ready-gate `tick` from 3 back to 4 — replace:
   ```jsx
   const tick = () => { loadedCount.current++; if (loadedCount.current >= 3) setDataLoading(false); };
   ```
   with:
   ```jsx
   const tick = () => { loadedCount.current++; if (loadedCount.current >= 4) setDataLoading(false); };
   ```
5. Add a fourth subscription alongside `u1`/`u2`/`u3`:
   ```jsx
   const u4 = onSnapshot(sharedCol('commodities'), s => { setCommodities(sort(s.docs.map(d => d.data()))); tick(); }, () => tick());
   ```
6. Change the cleanup return to include `u4()`:
   ```jsx
   return () => { u1(); u2(); u3(); u4(); clearTimeout(timeout); };
   ```

- [ ] **Step 6: Add the commodities CRUD callbacks**

After the `// ── Plans ──` section's callbacks (before the `// ── Bulk import ──` section), add:

```jsx
  // ── Commodities ──────────────────────────────────────────────────────────
  const addCommodity = useCallback(async (commodity) => {
    if (!user) return;
    const id = Date.now();
    const item = {
      ...commodity,
      id,
      createdAt: id,
      addedBy: user.email || user.uid,
      history: commodity.history || [],
    };
    await setDoc(sharedRef('commodities', id), item);
  }, [user]);

  const updateCommodity = useCallback(async (id, patch) => {
    if (!user) return;
    await updateDoc(sharedRef('commodities', id), patch);
  }, [user]);

  const deleteCommodity = useCallback(async (id) => {
    if (!user) return;
    await deleteDoc(sharedRef('commodities', id));
  }, [user]);

  const restoreCommodity = useCallback(async (commodity) => {
    if (!user) return;
    await setDoc(sharedRef('commodities', commodity.id), commodity);
  }, [user]);
```

- [ ] **Step 7: Add the `commoditiesValue` memo**

Alongside the other `useMemo` value objects, add:

```jsx
  const commoditiesValue = useMemo(() => ({ commodities, addCommodity, updateCommodity, deleteCommodity, restoreCommodity }),
    [commodities, addCommodity, updateCommodity, deleteCommodity, restoreCommodity]);
```

- [ ] **Step 8: Add the `CommoditiesContext.Provider` to the tree**

Wrap the existing provider tree with `CommoditiesContext.Provider` (it can go anywhere in the nesting; put it outermost):

```jsx
  return (
    <CommoditiesContext.Provider value={commoditiesValue}>
      <ProjectsContext.Provider value={projectsValue}>
        <PlansContext.Provider value={plansValue}>
          <IdeasContext.Provider value={ideasValue}>
            <BackupContext.Provider value={backupValue}>
              {children}
            </BackupContext.Provider>
          </IdeasContext.Provider>
        </PlansContext.Provider>
      </ProjectsContext.Provider>
    </CommoditiesContext.Provider>
  );
```

- [ ] **Step 9: Add the `useCommodities` hook and wire `useAppData`**

Alongside the other hook exports, add:

```jsx
export function useCommodities() { return useContext(CommoditiesContext); }
```

And in `useAppData`, add `...useCommodities(),` to the returned spread.

- [ ] **Step 10: Verify the build passes**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 11: Commit**

```bash
git add src/context/AppContext.jsx
git commit -m "feat: add sharedCommodities collection to AppContext with seed + CRUD"
```

---

### Task 5: Add the `sharedCommodities` Firestore rule

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: Add the rule**

In `firestore.rules`, immediately after the `match /sharedPlans/{doc}` block, add:

```
    match /sharedCommodities/{doc} {
      allow read, write: if request.auth != null && isAllowed();
    }
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build completes with no errors (rules are not part of the JS build; this confirms nothing else broke).

- [ ] **Step 3: Note for deployment**

Firestore rules deploy separately (`firebase deploy --only firestore:rules`). Flag to the user that rules must be deployed before Markets reads/writes work against production Firestore — and that the `sharedFiles` rule removal from Task 2 ships in the same deploy.

- [ ] **Step 4: Commit**

```bash
git add firestore.rules
git commit -m "feat: add Firestore rule for the sharedCommodities collection"
```

---

### Task 6: `Sparkline` component

**Files:**
- Create: `src/pages/Markets/Sparkline.jsx`

- [ ] **Step 1: Create the file**

```jsx
import { sortHistory } from './marketsMath';

// A tiny inline-SVG line chart drawn from a commodity's price history.
// Renders nothing meaningful below 2 points — callers should guard on
// history length and show an "awaiting price" state instead.
export default function Sparkline({ history, color, width = 240, height = 56 }) {
  const sorted = sortHistory(history);
  if (sorted.length < 2) return <div style={{ height }} />;

  const prices = sorted.map(e => e.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;
  const pad = 4;

  const pts = sorted.map((e, i) => {
    const x = pad + (i / (sorted.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (e.price - min) / span) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const lastX = width - pad;
  const lastY = pad + (1 - (prices[prices.length - 1] - min) / span) * (height - pad * 2);

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none" aria-hidden="true" style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="3" fill={color} />
    </svg>
  );
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Markets/Sparkline.jsx
git commit -m "feat: add Sparkline component for Markets"
```

---

### Task 7: `EmptyState` component

**Files:**
- Create: `src/pages/Markets/EmptyState.jsx`

- [ ] **Step 1: Create the file**

```jsx
import { C, alpha } from '../../tokens';
import { IllScenario } from '../../components/illustrations';

// Shown when there are no commodities tracked yet. `canAdd` gates the CTA so
// viewers see the explanation but no action.
export default function EmptyState({ onAdd, canAdd }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ maxWidth: 460, textAlign: 'center', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 12, padding: '40px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <span style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${C.accentBg} 0%, ${C.bg2} 100%)`, border: `1px solid ${alpha(C.accent, 44)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent }}>
            <IllScenario size={36} />
          </span>
        </div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: C.fg1, marginBottom: 10 }}>No commodities tracked yet</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg2, lineHeight: 1.6, marginBottom: canAdd ? 22 : 0 }}>
          Track the price of raw materials and commodities — coconut husk, coir fiber, copra, and more — week by week.
        </div>
        {canAdd && (
          <button onClick={onAdd}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '9px 20px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}>
            + Track your first commodity
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
git add src/pages/Markets/EmptyState.jsx
git commit -m "feat: add Markets empty state"
```

---

### Task 8: `CommodityCard` component

**Files:**
- Create: `src/pages/Markets/CommodityCard.jsx`

- [ ] **Step 1: Create the file**

```jsx
import { C, alpha } from '../../tokens';
import Sparkline from './Sparkline';
import { colorFor } from './commodityColors';
import { currentPrice, pctChange, range52w } from './marketsMath';

// ₹ formatting — thousands grouping; up to 2 decimals for sub-rupee prices.
const fmtPrice = (n) => {
  if (n == null) return '—';
  return Number.isInteger(n)
    ? n.toLocaleString('en-IN')
    : n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

export default function CommodityCard({ commodity, onOpen }) {
  const color   = colorFor(commodity.color);
  const price   = currentPrice(commodity.history);
  const change  = pctChange(commodity.history, 12);
  const range   = range52w(commodity.history);
  const hasData = price != null;
  const points  = Array.isArray(commodity.history) ? commodity.history.length : 0;
  const up = change != null && change >= 0;
  const changeColor = change == null ? C.fg3 : up ? C.success : C.danger;

  return (
    <button onClick={() => onOpen(commodity)}
      style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12, background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 140ms' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = alpha(C.accent, 44); }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 19, fontWeight: 600, color: C.fg1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{commodity.name}</span>
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3 }}>
            {commodity.unit}{commodity.mandi ? ` · ${commodity.mandi}` : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: C.fg1 }}>
            {hasData ? `₹${fmtPrice(price)}` : '—'}
          </div>
          {change != null && (
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: changeColor }}>
              {up ? '↑' : '↓'} {Math.abs(change).toFixed(1)}% 12w
            </div>
          )}
        </div>
      </div>

      {points >= 2
        ? <Sparkline history={commodity.history} color={color} height={56} />
        : <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, fontStyle: 'italic' }}>
            {hasData ? 'one price point — add more to see the trend' : 'awaiting first price'}
          </div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3 }}>
        <span>52w low {range ? fmtPrice(range.low) : '—'}</span>
        <span>52w high {range ? fmtPrice(range.high) : '—'}</span>
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
git add src/pages/Markets/CommodityCard.jsx
git commit -m "feat: add CommodityCard for the Markets overview grid"
```

---

### Task 9: `AddCommodityModal` component

**Files:**
- Create: `src/pages/Markets/AddCommodityModal.jsx`

- [ ] **Step 1: Create the file**

```jsx
import { useState } from 'react';
import { C } from '../../tokens';
import { COMMODITY_COLORS } from './commodityColors';
import { useToast } from '../../context/ToastContext';

const inputStyle = { width: '100%', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 15, padding: '9px 12px', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' };

const todayStr = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function AddCommodityModal({ onClose, onAdd }) {
  const { showToast } = useToast();
  const [name, setName]   = useState('');
  const [unit, setUnit]   = useState('');
  const [mandi, setMandi] = useState('');
  const [color, setColor] = useState(COMMODITY_COLORS[0].key);
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim() && unit.trim();

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const commodity = {
        name: name.trim(),
        unit: unit.trim(),
        mandi: mandi.trim(),
        color,
        notes: '',
        history: [],
      };
      // Optional first price becomes history[0].
      const p = parseFloat(price);
      if (price.trim() && Number.isFinite(p) && p > 0) {
        commodity.history = [{ ts: Date.now(), date: todayStr(), price: p }];
      }
      await onAdd(commodity);
      onClose();
    } catch (err) {
      console.error('[AddCommodityModal]', err);
      showToast('Could not add commodity. Please try again.', 'error');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,25,20,0.55)', zIndex: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ position: 'relative', background: C.bg0, borderRadius: 12, padding: '26px 24px', width: '100%', maxWidth: 460, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.22)', animation: 'fadeIn 160ms ease' }}>
        <button onClick={onClose} aria-label="Close"
          style={{ position: 'absolute', top: 6, right: 6, width: 44, height: 44, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: C.fg3, fontSize: 26, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={e => { e.currentTarget.style.color = C.fg1; e.currentTarget.style.background = C.bg2; }}
          onMouseLeave={e => { e.currentTarget.style.color = C.fg3; e.currentTarget.style.background = 'none'; }}>×</button>

        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 600, color: C.fg1, marginBottom: 18, paddingRight: 36 }}>
          Track a Commodity
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} maxLength={80} placeholder="e.g. Coconut Husk" />
          </div>
          <div>
            <label style={labelStyle}>Unit</label>
            <input style={inputStyle} value={unit} onChange={e => setUnit(e.target.value)} maxLength={24} placeholder="e.g. ₹/piece, ₹/kg, ₹/quintal" />
          </div>
          <div>
            <label style={labelStyle}>Mandi / market (optional)</label>
            <input style={inputStyle} value={mandi} onChange={e => setMandi(e.target.value)} maxLength={60} placeholder="e.g. Rajahmundry mandi" />
          </div>
          <div>
            <label style={labelStyle}>Colour</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COMMODITY_COLORS.map(c => (
                <button key={c.key} type="button" onClick={() => setColor(c.key)}
                  aria-label={c.label} aria-pressed={color === c.key}
                  style={{ width: 30, height: 30, borderRadius: 7, background: c.hex, cursor: 'pointer', border: `2px solid ${color === c.key ? C.fg1 : 'transparent'}` }} />
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Current price (optional)</label>
            <input style={inputStyle} type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="Today's price — you can add this later" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
          <button onClick={onClose}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, padding: '9px 18px', borderRadius: 6, background: 'transparent', color: C.fg2, border: `1px solid ${C.border}`, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={!canSubmit || submitting}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '9px 20px', borderRadius: 6, background: (!canSubmit || submitting) ? C.bg2 : C.accent, color: (!canSubmit || submitting) ? C.fg3 : '#fff', border: 'none', cursor: (!canSubmit || submitting) ? 'not-allowed' : 'pointer' }}>
            {submitting ? 'Adding…' : 'Add Commodity'}
          </button>
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
git add src/pages/Markets/AddCommodityModal.jsx
git commit -m "feat: add AddCommodityModal create flow"
```

---

### Task 10: `PriceEntryModal` component

A single modal with two modes: `'price'` (add a dated price point) and `'edit'` (edit the commodity's own fields).

**Files:**
- Create: `src/pages/Markets/PriceEntryModal.jsx`

- [ ] **Step 1: Create the file**

```jsx
import { useState } from 'react';
import { C } from '../../tokens';
import { COMMODITY_COLORS } from './commodityColors';
import { useToast } from '../../context/ToastContext';

const inputStyle = { width: '100%', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 15, padding: '9px 12px', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' };

// ISO yyyy-mm-dd for the date <input>; today by default.
const todayISO = () => new Date().toISOString().slice(0, 10);
// Display string matching the app's convention ("May 09, 2026").
const fmtDate = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// mode 'price' — add a dated price point; calls onSubmitPrice({ ts, date, price }).
// mode 'edit'  — edit commodity fields; calls onSubmitEdit({ name, unit, mandi, color, notes }).
export default function PriceEntryModal({ mode, commodity, onClose, onSubmitPrice, onSubmitEdit }) {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  // price mode
  const [date, setDate]   = useState(todayISO());
  const [price, setPrice] = useState('');

  // edit mode
  const [name, setName]   = useState(commodity?.name || '');
  const [unit, setUnit]   = useState(commodity?.unit || '');
  const [mandi, setMandi] = useState(commodity?.mandi || '');
  const [color, setColor] = useState(commodity?.color || COMMODITY_COLORS[0].key);
  const [notes, setNotes] = useState(commodity?.notes || '');

  const priceNum = parseFloat(price);
  const priceValid = price.trim() && Number.isFinite(priceNum) && priceNum > 0;
  const dateValid  = !!date && date <= todayISO();
  const canSubmit = mode === 'price'
    ? (priceValid && dateValid)
    : (!!name.trim() && !!unit.trim());

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      if (mode === 'price') {
        await onSubmitPrice({ ts: new Date(date + 'T00:00:00').getTime(), date: fmtDate(date), price: priceNum });
      } else {
        await onSubmitEdit({ name: name.trim(), unit: unit.trim(), mandi: mandi.trim(), color, notes: notes.trim() });
      }
      onClose();
    } catch (err) {
      console.error('[PriceEntryModal]', err);
      showToast('Could not save. Please try again.', 'error');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,25,20,0.55)', zIndex: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ position: 'relative', background: C.bg0, borderRadius: 12, padding: '26px 24px', width: '100%', maxWidth: 440, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.22)', animation: 'fadeIn 160ms ease' }}>
        <button onClick={onClose} aria-label="Close"
          style={{ position: 'absolute', top: 6, right: 6, width: 44, height: 44, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: C.fg3, fontSize: 26, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={e => { e.currentTarget.style.color = C.fg1; e.currentTarget.style.background = C.bg2; }}
          onMouseLeave={e => { e.currentTarget.style.color = C.fg3; e.currentTarget.style.background = 'none'; }}>×</button>

        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 21, fontWeight: 600, color: C.fg1, marginBottom: 18, paddingRight: 36 }}>
          {mode === 'price' ? 'Add a Price' : 'Edit Commodity'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'price' ? (
            <>
              <div>
                <label style={labelStyle}>Date</label>
                <input style={inputStyle} type="date" max={todayISO()} value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Price ({commodity?.unit || '₹'})</label>
                <input style={inputStyle} type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
              </div>
            </>
          ) : (
            <>
              <div>
                <label style={labelStyle}>Name</label>
                <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} maxLength={80} />
              </div>
              <div>
                <label style={labelStyle}>Unit</label>
                <input style={inputStyle} value={unit} onChange={e => setUnit(e.target.value)} maxLength={24} />
              </div>
              <div>
                <label style={labelStyle}>Mandi / market</label>
                <input style={inputStyle} value={mandi} onChange={e => setMandi(e.target.value)} maxLength={60} />
              </div>
              <div>
                <label style={labelStyle}>Colour</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {COMMODITY_COLORS.map(c => (
                    <button key={c.key} type="button" onClick={() => setColor(c.key)}
                      aria-label={c.label} aria-pressed={color === c.key}
                      style={{ width: 30, height: 30, borderRadius: 7, background: c.hex, cursor: 'pointer', border: `2px solid ${color === c.key ? C.fg1 : 'transparent'}` }} />
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Notes (optional)</label>
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60, lineHeight: 1.6 }} value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
          <button onClick={onClose}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, padding: '9px 18px', borderRadius: 6, background: 'transparent', color: C.fg2, border: `1px solid ${C.border}`, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={!canSubmit || submitting}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '9px 20px', borderRadius: 6, background: (!canSubmit || submitting) ? C.bg2 : C.accent, color: (!canSubmit || submitting) ? C.fg3 : '#fff', border: 'none', cursor: (!canSubmit || submitting) ? 'not-allowed' : 'pointer' }}>
            {submitting ? 'Saving…' : (mode === 'price' ? 'Add Price' : 'Save')}
          </button>
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
git add src/pages/Markets/PriceEntryModal.jsx
git commit -m "feat: add PriceEntryModal (add-price + edit-commodity modes)"
```

---

### Task 11: `MarketsPage` (overview)

**Files:**
- Create: `src/pages/Markets/index.jsx`

- [ ] **Step 1: Create the file**

```jsx
import { useState } from 'react';
import { C } from '../../tokens';
import { useCommodities } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import CommodityCard from './CommodityCard';
import AddCommodityModal from './AddCommodityModal';
import EmptyState from './EmptyState';

const todayLabel = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function MarketsPage({ onNavigate }) {
  const { commodities, addCommodity } = useCommodities();
  const { isViewer } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const canAdd = !isViewer;

  return (
    <div className="page-pad" style={{ background: C.bg0, flex: 1, overflowY: 'auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: '0.06em', color: C.fg3, marginBottom: 10, textTransform: 'uppercase' }}>
          Markets
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 34, fontWeight: 600, color: C.fg1, margin: 0, lineHeight: 1.15 }}>
              Today's Mandi
            </h1>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, marginTop: 4 }}>
              {todayLabel()} · {commodities.length} {commodities.length === 1 ? 'commodity' : 'commodities'} tracked
            </div>
          </div>
          {canAdd && (
            <button onClick={() => setAddOpen(true)}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '9px 18px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
              + Track
            </button>
          )}
        </div>
      </div>

      {commodities.length === 0 ? (
        <EmptyState onAdd={() => setAddOpen(true)} canAdd={canAdd} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {commodities.map(c => (
            <CommodityCard key={c.id} commodity={c}
              onOpen={(com) => onNavigate('commodity-detail', { id: com.id })} />
          ))}
        </div>
      )}

      {addOpen && (
        <AddCommodityModal onClose={() => setAddOpen(false)} onAdd={addCommodity} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Markets/index.jsx
git commit -m "feat: add MarketsPage overview grid"
```

---

### Task 12: `CommodityDetailPage`

**Files:**
- Create: `src/pages/Markets/CommodityDetailPage.jsx`

- [ ] **Step 1: Create the file**

```jsx
import { useState } from 'react';
import { C, alpha } from '../../tokens';
import { useCommodities } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ConfirmModal';
import Sparkline from './Sparkline';
import PriceEntryModal from './PriceEntryModal';
import { colorFor } from './commodityColors';
import { currentPrice, pctChange, range52w, sortHistory } from './marketsMath';

const fmtPrice = (n) => {
  if (n == null) return '—';
  return Number.isInteger(n)
    ? n.toLocaleString('en-IN')
    : n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

export default function CommodityDetailPage({ commodity, onNavigate }) {
  const { updateCommodity, deleteCommodity, restoreCommodity } = useCommodities();
  const { isViewer } = useAuth();
  const { showToast } = useToast();
  const [priceOpen, setPriceOpen]   = useState(false);
  const [editOpen, setEditOpen]     = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const canEdit = !isViewer;
  const color  = colorFor(commodity.color);
  const sorted = sortHistory(commodity.history);
  const price  = currentPrice(commodity.history);
  const change = pctChange(commodity.history, 12);
  const range  = range52w(commodity.history);
  const up = change != null && change >= 0;
  const changeColor = change == null ? C.fg3 : up ? C.success : C.danger;

  const handleAddPrice = async (point) => {
    const next = sortHistory([...(commodity.history || []), point]);
    await updateCommodity(commodity.id, { history: next });
    showToast('Price added', 'success');
  };

  const handleEdit = async (patch) => {
    await updateCommodity(commodity.id, patch);
    showToast('Commodity updated', 'success');
  };

  const handleDelete = () => {
    const backup = { ...commodity };
    deleteCommodity(commodity.id);
    showToast('Commodity deleted', 'info', { label: 'Undo', onClick: () => restoreCommodity(backup) });
    onNavigate('markets');
  };

  return (
    <div className="page-pad" style={{ background: C.bg0, flex: 1, overflowY: 'auto' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: '0.06em', color: C.fg3, marginBottom: 10 }}>
        <button onClick={() => onNavigate('markets')}
          style={{ background: 'none', border: 'none', color: C.fg3, cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 'inherit', letterSpacing: 'inherit', textTransform: 'uppercase' }}>
          Markets
        </button>
        <span aria-hidden="true">/</span>
        <span style={{ textTransform: 'uppercase', color: C.accent, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320 }}>{commodity.name}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 3, background: color, flexShrink: 0 }} />
            <h1 className="page-title" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 32, fontWeight: 600, color: C.fg1, margin: 0, lineHeight: 1.15 }}>{commodity.name}</h1>
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3 }}>
            {commodity.unit}{commodity.mandi ? ` · ${commodity.mandi}` : ''}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 14 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 34, fontWeight: 700, color: C.fg1 }}>
              {price != null ? `₹${fmtPrice(price)}` : '—'}
            </span>
            {change != null && (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, color: changeColor }}>
                {up ? '↑' : '↓'} {Math.abs(change).toFixed(1)}% · 12 weeks
              </span>
            )}
          </div>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
            <button onClick={() => setPriceOpen(true)}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, padding: '8px 14px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}>+ Add price</button>
            <button onClick={() => setEditOpen(true)}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '8px 14px', borderRadius: 6, background: 'transparent', color: C.fg2, border: `1px solid ${C.border}`, cursor: 'pointer' }}>Edit</button>
            <button onClick={() => setConfirmDel(true)}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '8px 14px', borderRadius: 6, background: 'transparent', color: C.danger, border: `1px solid ${alpha(C.danger, 33)}`, cursor: 'pointer' }}>Delete</button>
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.fg3, marginBottom: 14 }}>
          Price history
        </div>
        {sorted.length >= 2 ? (
          <Sparkline history={commodity.history} color={color} width={640} height={200} />
        ) : (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, fontStyle: 'italic' }}>
            {sorted.length === 1 ? 'One price point so far — add more to see the trend.' : 'No prices yet — add the first one.'}
          </div>
        )}
        {range && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3 }}>
            <span>52w low ₹{fmtPrice(range.low)}</span>
            <span>52w high ₹{fmtPrice(range.high)}</span>
          </div>
        )}
      </div>

      {/* History table */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.fg3, marginBottom: 10 }}>
          Entries ({sorted.length})
        </div>
        {sorted.length === 0 ? (
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3 }}>No price entries yet.</div>
        ) : (
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
            {[...sorted].reverse().map((e, i) => (
              <div key={e.ts} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < sorted.length - 1 ? `1px solid ${C.border}` : 'none', background: i % 2 ? C.bg0 : C.bg1 }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2 }}>{e.date}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: C.fg1 }}>₹{fmtPrice(e.price)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {commodity.notes && (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, lineHeight: 1.6, background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px', whiteSpace: 'pre-wrap' }}>
          {commodity.notes}
        </div>
      )}

      {priceOpen && (
        <PriceEntryModal mode="price" commodity={commodity} onClose={() => setPriceOpen(false)} onSubmitPrice={handleAddPrice} />
      )}
      {editOpen && (
        <PriceEntryModal mode="edit" commodity={commodity} onClose={() => setEditOpen(false)} onSubmitEdit={handleEdit} />
      )}
      {confirmDel && (
        <ConfirmModal
          title="Delete commodity?"
          message="This removes the commodity and its entire price history. You can undo for a few seconds."
          confirmLabel="Delete"
          onConfirm={() => { setConfirmDel(false); handleDelete(); }}
          onCancel={() => setConfirmDel(false)} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Markets/CommodityDetailPage.jsx
git commit -m "feat: add CommodityDetailPage — chart, history table, edit/delete"
```

---

### Task 13: Wire the Markets routes into the app chrome

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/SideNav.jsx`
- Modify: `src/components/CommandPalette.jsx`

- [ ] **Step 1: Add the lazy imports to `App.jsx`**

In `src/App.jsx`, after the `ResearchVaultPage` lazy import line, add:

```jsx
const MarketsPage         = lazy(() => import('./pages/Markets'));
const CommodityDetailPage = lazy(() => import('./pages/Markets/CommodityDetailPage'));
```

- [ ] **Step 2: Update the route arrays in `App.jsx`**

Change `LINKABLE` to include `'markets'`:

```jsx
const LINKABLE = ['dashboard', 'ideas', 'projects', 'markets', 'about', 'access', 'calculations', 'scenarios', 'settings'];
```

Change `DETAIL` to include `'commodity-detail'`:

```jsx
const DETAIL   = ['idea-detail', 'project-detail', 'new-idea', 'new-project', 'research', 'commodity-detail'];
```

- [ ] **Step 3: Add `useCommodities` and resolve the commodity in `App.jsx`**

Change the `AppContext` import line from:

```jsx
import { useIdeas, usePlans, useBackup } from './context/AppContext';
```

to:

```jsx
import { useIdeas, usePlans, useCommodities, useBackup } from './context/AppContext';
```

In the `App` component body, alongside `const { plans } = usePlans();`, add:

```jsx
  const { commodities } = useCommodities();
```

Alongside `const idea = ideas.find(...)` and `const plan = plans.find(...)`, add:

```jsx
  const commodity = commodities.find(c => c.id == itemId);
```

- [ ] **Step 4: Add the `renderPage` cases in `App.jsx`**

In the `renderPage` switch, immediately before `case 'scenarios':`, add:

```jsx
      case 'markets':        return <MarketsPage onNavigate={navigate} />;
      case 'commodity-detail':
        if (!itemId || !commodity) return <NotFound label="Commodity" dest="markets" onNavigate={navigate} />;
        return <CommodityDetailPage key={commodity.id} commodity={commodity} onNavigate={navigate} />;
```

- [ ] **Step 5: Add the Markets nav item to `SideNav.jsx`**

In `src/components/SideNav.jsx`, add this entry to the `NAV_ITEMS` array between the `projects` and `calculations` entries (the slot Documents previously occupied):

```jsx
  {
    id: 'markets', label: 'Markets',
    icon: <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>,
  },
```

And in `ACTIVE_MAP`, add:

```jsx
  'commodity-detail': 'markets',
```

- [ ] **Step 6: Add the `go-markets` command to `CommandPalette.jsx`**

In `src/components/CommandPalette.jsx`, add this line to the `items` array, in the `Navigate` group (e.g. right after the `go-projects` line):

```jsx
      { id: 'go-markets',   label: 'Go to Markets',    group: 'Navigate', keywords: 'markets mandi commodity prices raw material', run: () => onNavigate('markets') },
```

- [ ] **Step 7: Verify the build passes**

Run: `npm run build`
Expected: build completes with no errors. A new `Markets` chunk appears in the build output.

- [ ] **Step 8: Manual smoke check**

Run `npm run dev`, sign in. The sidebar shows a **Markets** item between Projects and Calculations. Clicking it shows "Today's Mandi" with the four seeded commodity cards. Clicking a card opens its detail page; **+ Add price** and **Edit** work; **+ Track** adds a commodity.

- [ ] **Step 9: Commit**

```bash
git add src/App.jsx src/components/SideNav.jsx src/components/CommandPalette.jsx
git commit -m "feat: wire the Markets routes into nav, palette, and App router"
```

---

### Task 14: Playwright e2e spec

**Files:**
- Create: `e2e/markets.spec.js`
- Modify: `e2e/navigation.spec.js`
- Modify: `e2e/smoke.spec.js`
- Modify: `e2e/theming.spec.js`

**Note:** the e2e harness runs with empty Firestore data, so `MarketsPage` shows the empty state (the four seed commodities only appear against real Firestore). The new spec covers UI presence — the same approach as `e2e/research-vault.spec.js`.

- [ ] **Step 1: Create `e2e/markets.spec.js`**

```javascript
/**
 * Markets — verifies the Markets page UI shell renders. The e2e harness runs
 * with empty Firestore data, so this covers UI presence; commodity CRUD
 * (add/edit/delete/undo, price entry, sparkline/range math) is trusted via
 * runtime use — same approach as e2e/research-vault.spec.js.
 */
import { test, expect } from '@playwright/test';
import { goto } from './helpers.js';

test("Markets page renders the Today's Mandi title", async ({ page }) => {
  await goto(page, 'markets');
  await expect(page.locator('.page-title').filter({ hasText: "Today's Mandi" }).first()).toBeVisible();
});

test('Markets breadcrumb shows the Markets segment', async ({ page }) => {
  await goto(page, 'markets');
  await expect(page.locator('text=MARKETS').first()).toBeVisible();
});

test('Track button is present', async ({ page }) => {
  await goto(page, 'markets');
  await expect(page.locator('button').filter({ hasText: /Track/ }).first()).toBeVisible();
});

test('empty state renders when no commodities exist', async ({ page }) => {
  // In e2e mode there is no Firestore data, so the empty state shows.
  await goto(page, 'markets');
  await expect(page.locator('text=No commodities tracked yet').first()).toBeVisible();
});

test('Track opens the add-commodity modal', async ({ page }) => {
  await goto(page, 'markets');
  await page.locator('button').filter({ hasText: /Track/ }).first().click();
  await page.waitForTimeout(200);
  await expect(page.locator('text=Track a Commodity').first()).toBeVisible();
});

test('#/commodity-detail with no id renders Not Found', async ({ page }) => {
  await goto(page, 'commodity-detail');
  await expect(page.locator('text=/not found/i').first()).toBeVisible();
});
```

- [ ] **Step 2: Update `e2e/navigation.spec.js`**

Change the nav-items filter regex (around line 25) from:

```javascript
    .filter({ hasText: /Home|Ideas|Projects|Documents|Calculations|About/ })
```

to:

```javascript
    .filter({ hasText: /Home|Ideas|Projects|Markets|Calculations|About/ })
```

And change `NAV_PAGES` (around line 34) from:

```javascript
const NAV_PAGES = ['dashboard', 'ideas', 'projects', 'documents', 'calculations', 'about'];
```

to:

```javascript
const NAV_PAGES = ['dashboard', 'ideas', 'projects', 'markets', 'calculations', 'about'];
```

- [ ] **Step 3: Update `e2e/smoke.spec.js`**

Add the Markets entry back to the `PAGES` array (Task 2 removed the Documents entry; this adds Markets in roughly the same slot):

```javascript
const PAGES = [
  { hash: 'dashboard',    label: 'Dashboard' },
  { hash: 'ideas',        label: 'Ideas' },
  { hash: 'new-idea',     label: 'New Idea' },
  { hash: 'projects',     label: 'Projects' },
  { hash: 'new-project',  label: 'New Project' },
  { hash: 'markets',      label: 'Markets' },
  { hash: 'calculations', label: 'Calculations' },
  { hash: 'about',        label: 'About' },
];
```

- [ ] **Step 4: Update the comment in `e2e/theming.spec.js`**

Around line 157, update the comment to reflect the nav item swap (the count is unchanged — Documents was replaced by Markets):

```javascript
    // 8 items in NAV_ITEMS (Home, Ideas, Projects, Markets, Calculations,
    // Scenarios, Settings, About). Admin-only Access button is conditional.
```

- [ ] **Step 5: Run the new spec**

Run: `npm run test:e2e -- markets`
Expected: all 6 tests pass across the configured projects (web / ipad / mobile) — 18 test instances.

- [ ] **Step 6: Run the full e2e suite for regressions**

Run: `npm run test:e2e`
Expected: the suite passes except the **14 pre-existing `theming.spec.js` failures** (retired `aura`/`lemon` themes) noted at the top of this plan. No other failures — in particular `navigation.spec.js`, `smoke.spec.js`, `dashboard.spec.js`, `about.spec.js`, and `ux-polish.spec.js` must pass.

- [ ] **Step 7: Verify the build passes**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 8: Commit**

```bash
git add e2e/markets.spec.js e2e/navigation.spec.js e2e/smoke.spec.js e2e/theming.spec.js
git commit -m "test: add Markets e2e spec; update nav/smoke specs for the route swap"
```

---

## Self-Review

**1. Spec coverage:**

| Spec requirement | Task |
|---|---|
| Delete `FilesPage.jsx` / `FileDetailPage.jsx` | Task 2 |
| `AppContext` — remove `sharedFiles` slot entirely, gate 4→3 | Task 2 |
| `App.jsx` — remove Documents imports/route/`useFiles`/cases | Task 2 |
| `SideNav` / `CommandPalette` / `AboutPage` / `Dashboard` — remove Documents refs | Task 1 |
| `firestore.rules` — remove `sharedFiles` block | Task 2 |
| File-upload plumbing kept untouched | Tasks 1–2 touch none of `fileStorage.js` / `UploadZone` / `AttachmentEditor` / `AttachedFileViewer` / `PdfPageRenderer` |
| `sharedFiles` data deletion is a manual op, not code | Noted in spec + Task 5 Step 3 / "Follow-up" below |
| `sharedCommodities/{id}` embedded-`history` model | Tasks 4, 8, 12 |
| `useCommodities()` in `AppContext`, in the `sharedFiles` slot | Task 4 |
| `marketsMath.js` pure helpers (`currentPrice`/`pctChange`/`range52w`/`sortHistory`) | Task 3 |
| Seed the four mockup commodities on first load | Task 4 (`SEED_COMMODITIES` + `ensureCommoditiesSeed`) |
| Routing: `documents`→`markets`, `document-detail`→`commodity-detail` | Tasks 2 (remove) + 13 (add) |
| `SideNav` Markets item + `ACTIVE_MAP`; `CommandPalette` `go-markets` | Task 13 |
| Components: index, CommodityCard, Sparkline, CommodityDetailPage, AddCommodityModal, PriceEntryModal, EmptyState, marketsMath | Tasks 3, 6–12 |
| Overview grid + per-commodity detail (drill-in) | Tasks 11, 12 |
| Interactions: +Track, click card, add price, edit, delete+undo | Tasks 11, 12 |
| `isViewer` hides Track / add-price / edit / delete | Tasks 7, 11, 12 (`canAdd` / `canEdit`) |
| Error handling: `onSnapshot` error → empty list | Task 4 (the `() => tick()` error callback leaves `commodities` `[]`) |
| Bad `commodity-detail` route → `NotFound` | Task 13 |
| Empty / short history fallbacks | Tasks 3 (`marketsMath` returns `null`), 8, 12 |
| Price entry validation (positive, not future) | Task 10 |
| `firestore.rules` — add `sharedCommodities` | Task 5 |
| e2e `markets.spec.js` + `navigation.spec.js` update + other Documents e2e refs removed | Tasks 1, 2, 14 |

All spec sections map to a task. No gaps.

**2. Placeholder scan:** No "TBD"/"TODO"/"handle edge cases"/"similar to Task N" — every code step contains complete code or exact edit instructions. The only deferred actions are operational (Firestore rules deploy; the one-time `sharedFiles` data deletion) — flagged, not code placeholders.

**3. Type consistency:** Verified across tasks —
- Commodity shape `{ id, name, unit, mandi, color, notes, addedBy, createdAt, history: [{ ts, date, price }] }` — written by `addCommodity` (Task 4) and `SEED_COMMODITIES` (Task 4); read by `CommodityCard` (Task 8), `CommodityDetailPage` (Task 12), and `marketsMath` (Task 3). All field names match.
- `marketsMath` exports `sortHistory`, `currentPrice`, `pctChange`, `range52w` (Task 3) — imported with those exact names by `Sparkline` (Task 6), `CommodityCard` (Task 8), `CommodityDetailPage` (Task 12).
- `commodityColors` exports `COMMODITY_COLORS` and `colorFor` (Task 3) — imported with those names by `AddCommodityModal`/`PriceEntryModal` (Tasks 9–10) and `CommodityCard`/`CommodityDetailPage` (Tasks 8, 12).
- `AppContext` callbacks `addCommodity` / `updateCommodity` / `deleteCommodity` / `restoreCommodity` (Task 4) — consumed by `MarketsPage` (`addCommodity`, Task 11) and `CommodityDetailPage` (`updateCommodity`/`deleteCommodity`/`restoreCommodity`, Task 12). Signatures match (`addCommodity(commodity)`, `updateCommodity(id, patch)`, `deleteCommodity(id)`, `restoreCommodity(commodity)`).
- `PriceEntryModal` props: `mode`, `commodity`, `onClose`, `onSubmitPrice`, `onSubmitEdit` (Task 10) — `CommodityDetailPage` passes `mode="price"` + `onSubmitPrice={handleAddPrice}` and `mode="edit"` + `onSubmitEdit={handleEdit}` (Task 12). Consistent.
- `onNavigate('commodity-detail', { id })` (Task 11) matches `App.jsx`'s `navigate(dest, data)` where `id = data?.id` → hash `#/commodity-detail/<id>` → `DETAIL` includes `commodity-detail` (Task 13).
- `tick` gate: Task 2 sets it to `>= 3` (3 subscriptions after removing files); Task 4 restores `>= 4` (adds the commodities subscription). Each task's value matches its subscription count.

No inconsistencies found.

## Follow-up operational steps (not code)

- Deploy the updated `firestore.rules` (`firebase deploy --only firestore:rules`) — this single deploy ships both the `sharedFiles` removal (Task 2) and the `sharedCommodities` addition (Task 5).
- One-time: delete the `sharedFiles` Firestore collection via the Firebase console, plus the specific `uploads/<blobId>` Storage objects referenced by those docs. **Do not** delete the whole `uploads/` folder — it is shared with Plan/Idea attachments and Research Vault clips.
