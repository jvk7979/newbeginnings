# Research Vault — Design

**Date:** 2026-05-14
**Status:** Approved (pending written-spec review)

## Summary

A per-project **Research Vault**: a place to collect *clips* — web links, PDFs,
quotes, and photos — gathered while researching a project. It opens from the
Project Detail page (the "Projects" nav, backed by the `sharedPlans` collection)
and presents clips in two switchable views: a **card grid** and a
**week-grouped timeline**.

## Goals

- Capture four kinds of research artefact against a single project: WEB, PDF,
  QUOTE, PHOTO.
- Two views of the same clips — grid (scannable) and timeline (chronological) —
  switchable via a toggle.
- Filter by type and free-text search; grid additionally supports newest/oldest
  sort.
- Stay within the app's existing architecture, storage, and permission patterns.

## Non-goals

- Auto-fetching web page metadata (title/favicon). Web clips are entered
  manually.
- Referencing files from the existing Documents library. PDF clips are fresh
  uploads owned by the vault.
- Cross-project clip search or a global research view. Clips are scoped to one
  project.

## Decisions (from brainstorming)

| Question | Decision |
|---|---|
| Layout | Build **both** — grid and timeline as a view toggle on one page |
| Web clips | **Manual entry** — user types URL, title, description, source |
| Tags | **Free-form, multiple** per clip (like Idea tags) |
| PDF clips | **Fresh upload** to the vault; deleting the clip deletes the blob |
| Click behaviour | WEB opens the URL in a new tab; PDF/QUOTE/PHOTO open a detail modal |
| Entry point | **Header button + count** on Project Detail (`Research Vault · N clips`) |
| Data model | **B — lazy-loaded subcollection** `sharedPlans/{planId}/clips` |

## Architecture

### Data model & storage

Clips live in a Firestore subcollection: `sharedPlans/{planId}/clips/{clipId}`.
Clip id is `Date.now()`, matching the app convention. The vault page subscribes
to this subcollection with `onSnapshot` only when opened — the same on-demand
fetch pattern as `DiscussionThread`, keeping `AppContext` untouched.

Clip document shape:

```
{
  id,                          // Date.now()
  type: 'web' | 'pdf' | 'quote' | 'photo',
  title,                       // all types
  description,                 // all types — the excerpt / note line
  tags: [],                    // free-form, multiple
  sourceLabel,                 // italic meta line, e.g. "coirboard.gov.in",
                               //   "CIRCOT field note, Mar 2026"
  date,                        // todayStr() on create, editable
  createdAt,                   // numeric epoch — drives sort + week grouping
  addedBy,                     // user.email — matches sharedFiles

  // type-specific:
  url,                         // web
  attachedFile: { blobId, name, type, size, uploadedAt },  // pdf
  photo:        { blobId, name, type, size, uploadedAt },  // photo
  quoteText,                   // quote — the large serif quote body
}
```

PDF and photo uploads reuse `src/utils/fileStorage.js`
(`uploadFileToDB` / `deleteFileFromDB` / `getFileUrl` / `fetchFileBlob`),
storing blobs under `uploads/` in Firebase Storage. Photo uploads pass an image
`contentType`.

`firestore.rules` gains a rule for the `clips` subcollection: any signed-in
family member reads; writes follow the same admin/viewer split as the rest of
the app (viewers are read-only).

### Routing & entry point

- New route `research/<planId>` added to `App.jsx`: `planId` added to the
  `DETAIL` route list, a new `case 'research'` in `renderPage` resolving the
  plan by id (reusing `NotFound` when the plan is missing), and a lazy-loaded
  `ResearchVaultPage` import.
- `PlanDetailPage` hero toolbar gains a **`Research Vault · N clips`** button
  alongside Export/Edit/Delete. The count is a one-shot lightweight read
  (`getCountFromServer` on the subcollection); if it fails, the button still
  renders without the `· N clips` suffix.
- Vault page breadcrumb: `PROJECT / <plan title> / RESEARCH`.

### Page structure & components

New folder `src/pages/ResearchVault/` (mirroring `src/pages/Calculations/`):

| File | Responsibility |
|---|---|
| `index.jsx` | `ResearchVaultPage` — subscribes to the clips subcollection on mount; owns view-toggle, filter, search, sort state |
| `VaultHeader.jsx` | Breadcrumb, title, view toggle (grid ⇄ timeline), filter chips + search, **+ New Clip** |
| `ClipCard.jsx` | Grid-view card — type badge, title, description, source line, tags; photo thumbnail for photo clips |
| `ClipRow.jsx` | Timeline-view row — date-marker dot, meta line, title, description, tags |
| `TimelineGroups.jsx` | Buckets clips into *This Week / Last Week / Earlier* by `createdAt` |
| `AddClipModal.jsx` | Create flow — type picker first, then type-specific fields |
| `ClipModal.jsx` | View/edit/delete modal for pdf/quote/photo clips |
| `EmptyState.jsx` | No-clips state, reusing an existing illustration |

Reused UI: `Tag`, `Badge`, `ConfirmModal`, `useToast`, `UploadZone` /
`AttachmentEditor` for uploads, and the `C` design tokens.

### Interactions

- **View toggle** — grid ⇄ timeline; choice persisted in `localStorage`.
- **Filter + search** — shared across both views: type chips
  (All / Web / PDF / Quote / Photo) plus a text search over
  title/description/tags/source. Grid additionally has a Newest/Oldest sort;
  the timeline is inherently date-ordered.
- **Add clip** — `AddClipModal`: pick type, then fill type-specific fields:
  - WEB: url, title, description, tags, sourceLabel
  - PDF: file upload, title, description, tags
  - QUOTE: quoteText, description, tags, sourceLabel
  - PHOTO: image upload, title, description, tags
  Upload-then-write ordering mirrors `PlanDetailPage.handleSave`: upload the
  blob first, then write the Firestore doc; if the write fails, best-effort
  delete the orphan blob.
- **Click clip** — WEB → `window.open` in a new tab; PDF/QUOTE/PHOTO →
  `ClipModal` with edit + delete.
- **Permissions** — `isViewer` hides New Clip / edit / delete, matching the
  rest of the app.

## Error handling & edge cases

- **Upload failures** — `uploadFileToDB` already has a 30s timeout;
  `AddClipModal` stays open with an error toast so input is not lost. The
  Firestore write happens only after the upload resolves.
- **Delete coordination** — delete the clip's Firestore doc immediately and
  show a toast with **Undo**. The blob delete (for pdf/photo clips) is
  *deferred* until the undo window closes: if the user clicks Undo, the clip
  doc is re-written and the blob is untouched; if the window expires, the blob
  is deleted best-effort (swallow failure — the admin orphan scan reclaims any
  leftovers). Quote and web clips have no blob, so their delete is just the
  doc.
- **Stale / bad route** — `research/<planId>` with no matching plan reuses the
  existing `NotFound` component with a "← Go back" link to Projects.
- **Loading / empty** — spinner while the snapshot loads; `EmptyState` when
  there are zero clips; a "no clips match" line when filters exclude everything.
- **Count query failure** — the header button renders without the `· N clips`
  suffix rather than blocking the Project Detail page.

## Testing

New `e2e/research-vault.spec.js` (Playwright, matching the existing suite):

- Open the vault from the Project Detail header button; breadcrumb renders.
- Add one clip of each type (web/pdf/quote/photo); each appears in the grid.
- Toggle to timeline view; a clip appears under the correct week group.
- Filter chips and search narrow the list.
- Web clip click opens the URL; pdf/quote/photo click opens `ClipModal`.
- Edit a clip; delete a clip and exercise Undo.
- Viewer role: New Clip / edit / delete are hidden.

## Files touched

**New:**
- `src/pages/ResearchVault/index.jsx`
- `src/pages/ResearchVault/VaultHeader.jsx`
- `src/pages/ResearchVault/ClipCard.jsx`
- `src/pages/ResearchVault/ClipRow.jsx`
- `src/pages/ResearchVault/TimelineGroups.jsx`
- `src/pages/ResearchVault/AddClipModal.jsx`
- `src/pages/ResearchVault/ClipModal.jsx`
- `src/pages/ResearchVault/EmptyState.jsx`
- `e2e/research-vault.spec.js`

**Modified:**
- `src/App.jsx` — route wiring (`DETAIL` list, `renderPage` case, lazy import)
- `src/pages/PlanDetailPage.jsx` — header button + clip count
- `firestore.rules` — read/write rule for the `clips` subcollection
