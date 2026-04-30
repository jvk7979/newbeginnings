# One-time Firebase Storage CORS setup

You only need to run this **once per bucket**, ever. After it's done, every browser
on the GitHub Pages origin (and `localhost`) can fetch file bytes from
`firebasestorage.googleapis.com` — which is required for `getBlob()` calls
used by the in-app PDF/DOCX AI summary generation.

The repo includes a `cors.json` at the project root with the allowed origins.

---

## Easiest: Cloud Shell (no install)

1. Open Firebase Console → **Storage** → click the bucket name
   (`newbeginnings-b4abe.firebasestorage.app`).
2. Click the small **Cloud Shell** icon at the top right of the Google Cloud
   Console (`>_` icon). A terminal opens at the bottom of the browser.
3. Upload `cors.json` from this repo: drag-and-drop it into the Cloud Shell
   terminal pane (or click ⋮ → Upload).
4. In the Cloud Shell prompt, run:

   ```sh
   gsutil cors set cors.json gs://newbeginnings-b4abe.firebasestorage.app
   ```

5. Verify it took effect:

   ```sh
   gsutil cors get gs://newbeginnings-b4abe.firebasestorage.app
   ```

   You should see the same JSON you uploaded printed back.

That's it. The change is live immediately — no redeploy needed.

---

## Alternative: install gcloud locally (slower)

If you'd rather run it from your own machine instead of Cloud Shell:

1. Install the Google Cloud SDK:
   <https://cloud.google.com/sdk/docs/install>
2. `gcloud auth login`
3. `gcloud config set project newbeginnings-b4abe`
4. From the repo root:
   ```sh
   gsutil cors set cors.json gs://newbeginnings-b4abe.firebasestorage.app
   ```

---

## Verify it works

After setting CORS, open a saved business plan that has a PDF attached but
no Executive Summary. Click **Edit → ✦ Generate AI Summary**. The toast
should switch from `Could not load file: storage/retry-limit-exceeded` to
"AI summary generated".

---

## Adding more origins later

If you ever need to allow another domain (custom domain, preview deploys),
just edit `cors.json`, push the change, and re-run the `gsutil cors set`
command above. The JSON in the repo is the source of truth.
