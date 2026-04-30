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

## 5. Long-term: move Gemini behind a Cloud Function

Steps 1 + 2 above are interim mitigations. The proper fix is a Firebase
Cloud Function that:

1. Verifies the caller is signed in (`context.auth`).
2. Looks up the caller's email in `allowedUsers` (or relies on a custom
   claim).
3. Forwards the prompt to Gemini using a server-side key.
4. Returns the response to the client.

Then `src/utils/gemini.js` and `src/utils/aiSummary.js` call the function
via `httpsCallable(functions, 'aiSummary')` instead of using the SDK
directly, and `VITE_GEMINI_API_KEY` is removed from the build entirely.
This is the only configuration that fully prevents quota theft and key
extraction. Track this as a follow-up — it's a half-day of work and
requires `firebase-functions` plus a billing-enabled Cloud project.

---

## After applying all changes, deploy the rules

The repository's rule files are the source of truth — push them to Firebase:

```sh
npx firebase-tools deploy --only firestore:rules,storage:rules,database:rules \
  --project newbeginnings-b4abe
```

If `firebase-tools` is not installed locally, add `npx firebase-tools@latest`
or run from Cloud Shell where it's preinstalled.
