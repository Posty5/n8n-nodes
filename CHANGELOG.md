# Changelog

## 4.5.0 - 2026-10-05

### Fixed

- **Reschedule Post** sends `scheduleType` + `scheduledAt` flat, as the API's
  edit route requires. It sent the create routes' `schedule` object, which the
  API refused, so rescheduling never worked.

### Changed

- **Test** on the **Posty5 API** credential now asks the API which key it is
  (`GET /api/api-key/current`) instead of listing one short link. A wrong or
  revoked key fails with "Invalid or revoked API key"; a successful answer has
  to name the key (`result.apiKey._id`) to pass. The test request also carries
  the API origin itself — before, it had none, so it could fail for every key.
- Every request the nodes make to the API sends
  `X-Posty5-Client: posty5-n8n/<package version>`, so the API can tell n8n
  traffic apart. The version is compiled in from `package.json`; nothing to
  configure. Signed-URL and resumable uploads are unchanged.

### Requires

- The `GET /api/api-key/current` route on the API. Against an API without it,
  **Test** fails for every key; the nodes themselves are unaffected.

## 4.4.0 - 2026-09-26

### Added

- **Posty5 Store** node for dropshipping: Supplier (Get Catalogue, Get Many,
  Test, Get Balance), Supplier Product (Get Many, Get, Resolve URL, Preview
  Import, Import, Get Import Status), Product Link (Get Many, Sync), Supplier
  Order (Get Many, Get, Retry, Pay, Cancel), Fulfilment Group (Submit, Fulfil
  Manually) and Order (Get with Split Parts, Get Many).
- **Supplier Order → Get Many** pages by cursor, matching the API's list
  envelope (`{ items, pagination }`): **Return All** follows
  `pagination.nextCursor` until `hasMore` is false; otherwise **Limit** is sent
  as `pageSize` (max 100), a **Cursor** filter continues from a previous page,
  and `nextCursor` rides on the last row. There is no **Page** field.
- `storeGetAllByCursor` and `rowsWithNextCursor` in `utils/store.helpers.ts`;
  **Order → Get Many** now uses `rowsWithNextCursor` too (same output).
- `makeApiRequest` accepts `stampCreatedFrom: false`; the store node uses it on
  every supplier POST. The default is unchanged for the other nodes.

### Documentation

- Three workflow examples (needs-attention alerts, import from a spreadsheet,
  tracking per part) and why there is no trigger.

### Fixed

- **A short video uploaded from binary data was never deleted from storage.**
  The API now deletes a post's media folder only when the folder belongs to that
  post, and **Publish Video** created the post under a fresh ID instead of the one
  `generate-upload-urls` reserved for the upload. It is now created under the
  reserved ID, the same way **Publish Long Video** already did.
- The same operations stored the signed upload URL with its query stripped as the
  video and thumbnail URL. That host is the storage API, not the public CDN, so the
  cleanup could not recognise the files as Posty5's even with a matching ID. They
  now store the public `fileURL`, like every other client.

### Added

- **Upload Post ID** on **Publish Image** and **Publish Image to Account** when the
  source is **Uploaded Bucket File**. The image is uploaded outside the node, so
  the node cannot reserve an ID for it. Pass the `postId` returned with the
  bucket file URL and the post owns its image. Leave it empty and the post is still
  created, but the uploaded image is never deleted from storage.

## 4.3.0 - 2026-09-19

### Added

- **Up to five comments per post**, through a new **Comments** collection on the
  four publish operations. Each entry carries its own text, delay (0-1440
  minutes), optional image URL and per-platform switches, and they post in the
  order they are listed.

### Deprecated

- The single **Comment** collection. It still works — it is mapped into the
  first entry of **Comments** when that is empty — and the two are never sent
  together, because the API refuses a request carrying both. A workflow half
  upgraded, with the new collection filled in and the old one never cleared, is
  exactly the state that would otherwise produce a 400.

### Fixed

- **The credit wording was wrong everywhere it appeared.** A comment is **25
  credits**, not "+1", and an image post is **50**, not 5. Corrected on the node
  description, both image operations and the comment fields.

### Documentation

- The two caveats a workflow author has no way to discover are now stated on the
  fields themselves: **TikTok is not supported** (no public comment-posting
  endpoint, so it reports `notSupported` rather than failing), and **an image is
  Facebook only** (Instagram and YouTube comments are text-only).
