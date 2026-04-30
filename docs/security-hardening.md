# Security hardening — manual one-time steps

This file documents one-time configuration changes that must be made in the
Google Cloud Console / Firebase Console. The application code in this repo
already enforces what it can on the client side; the items below close the
remaining gaps that only Cloud-side configuration can solve.

---

## 1. Restrict the Gemini API key by HTTP referrer

The Gemini key (`VITE_GEMINI_API_KEY`) is inlined into the JavaScript that
ships to GitHub Pages. Anyone visiting the site can extract it from
DevTools → Sources. Until Gemini calls are moved server-side, restrict the
key so it only works when the request comes from your domain.

1. Open <https://console.cloud.google.com/apis/credentials> while signed in
   as the project owner.
2. Pick the project that owns the Gemini key (the one used by your GitHub
   Actions deploy workflow).
3. Click the **API key** named for Gemini ("Generative Language API key" or
   similar).
4. Under **Application restrictions**, choose **HTTP referrers (web sites)**.
5. Click **ADD AN ITEM** and paste each of these on its own line:

   ```
   https://jvk7979.github.io/*
   https://*.github.io/*
   http://localhost:5173/*
   http://localhost:5174/*
   ```

6. Under **API restrictions**, switch to **Restrict key** and enable only
   **Generative Language API**.
7. Click **SAVE**. Changes take effect within a few minutes.

Verify by opening DevTools → Network on the deployed site, triggering an
AI summary, and confirming the request to `generativelanguage.googleapis.com`
returns 200. From any other origin (e.g. a different localhost port) the
same call should now return 403.

---

## 2. Restrict the Firebase web API key

The Firebase web API key in `src/firebase.js` is fine to ship publicly
(it's a project identifier rather than a credential — security comes from
Firestore + Storage rules), but adding referrer restrictions is defense in
depth and costs nothing.

Same flow as above:

1. <https://console.cloud.google.com/apis/credentials>
2. Find the **Browser key (auto created by Firebase)** for project
   `newbeginnings-b4abe`.
3. Application restrictions → HTTP referrers → same five referrer lines.
4. API restrictions → Restrict key → enable:
   - Identity Toolkit API
   - Firebase Installations API
   - Firebase Remote Config API (only if you ever add Remote Config)
   - Cloud Storage for Firebase API
   - Cloud Firestore API
5. **SAVE**.

---

## 3. Verify Firebase Auth authorized domains

Make sure the project only accepts auth callbacks from the domains you own.

1. <https://console.firebase.google.com/project/newbeginnings-b4abe/authentication/settings>
2. **Authorized domains** tab.
3. The list should contain only:
   - `localhost`
   - `newbeginnings-b4abe.firebaseapp.com`
   - `newbeginnings-b4abe.web.app`
   - `jvk7979.github.io`
4. Remove anything else (especially wildcards or unfamiliar entries).

---

## 4. Apply the Storage CORS config

Required for `getBlob()` and PDF/DOCX viewing on the deployed origin.
Already documented in `docs/setup-storage-cors.md` — make sure that has
been run once.

---

## 5. Deploy the Cloud Functions (one-time setup)

The Gemini calls have been moved to Cloud Functions in `functions/`.
Deploy them so the client can call them.

### a. Set the server-side Gemini key

Open Cloud Shell (the `>_` icon in the Firebase Console toolbar) or use a
local terminal with `firebase-tools` installed. Run:

```sh
firebase functions:secrets:set GEMINI_API_KEY --project newbeginnings-b4abe
```

Paste your existing Gemini API key when prompted. This stores the secret
in Google Secret Manager — it's NOT visible to the client and NOT
committed to the repo.

### b. Deploy

```sh
firebase deploy --only functions --project newbeginnings-b4abe
```

Takes 2–3 minutes. Output should end with `Deploy complete!` and list:
- `analyzeIdea(us-central1)`
- `generatePlanSection(us-central1)`
- `improveSummary(us-central1)`
- `summariseDocumentText(us-central1)`

### c. Revoke the old client-side Gemini key (after switchover commit deploys)

Once you've verified the AI features work via the function:

1. Open <https://console.cloud.google.com/apis/credentials>
2. Find the API key that was used as `VITE_GEMINI_API_KEY`
3. Click **DELETE** (or restrict it heavily as a temporary safety net first)

Any browser still running an old cached bundle will then see AI features
fail with a "key invalid" error — they need to refresh to pick up the
new bundle. Cache will expire naturally within a few hours.

---

## After applying all changes, deploy the rules

The repository's rule files are the source of truth — push them to Firebase:

```sh
npx firebase-tools deploy --only firestore:rules,storage:rules,database:rules \
  --project newbeginnings-b4abe
```

If `firebase-tools` is not installed locally, add `npx firebase-tools@latest`
or run from Cloud Shell where it's preinstalled.
