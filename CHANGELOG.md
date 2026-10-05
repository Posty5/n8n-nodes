# Changelog

## 4.5.0 - Unreleased

Needs the Posty5 API's link + QR truth-pass release: Android/iOS URLs and the
server-built QR text arrive with it.

### Fixed

- **QR create/update fixed.** Every **Posty5 QR Code → Create** and **Update**
  failed: the node put the content at the top of the body (`url`, `email`,
  `wifi`, … and `text` for free text), and the API reads it only from
  `qrCodeTarget`. The node now sends `qrCodeTarget: { type, <type>: {...} }` for
  all seven types, plus the `options: {}` the API requires. It no longer builds
  `options.text`: the server encodes the target itself. Empty optional values
  (email subject/body, SMS message, WiFi password) are left out, and an open
  WiFi network never sends a password.
- **Short Link Update fixed.** It never sent the destination URL the API
  requires, and sent the Custom Slug, which the API refuses on update, so it
  could not succeed. Update now reads the link first (`GET /api/short-link/:id`)
  and sends it back with your changes on top (`PUT`), so a field you leave alone
  keeps its stored value and the slug is never sent. **Custom Slug** is shown on
  Create only.
- **QR Code Update** reads the QR code first the same way, so an update without a
  Name keeps the stored name instead of being renamed after its content.
- **Short Link → List → Search** matched only links whose name *and* destination
  URL both contained the term. It now matches the name; the URL has its own
  filter.
- Page Title and Page Description were sent without turning the landing page on,
  so they never showed, and an empty description was sent when only the title was
  set.

### Changed

- **Template now required.** The Posty5 API refuses a create or update made with
  an API key without a template, so **Template** moved out of Additional Fields
  to a dropdown of your templates and the public ones (an ID in an expression
  still works). It is required on Create. On Update it may stay empty to keep the
  current template. Workflows saved with **Template ID** under Additional Fields
  keep working: it is still read when Template is empty, and is marked
  deprecated. The editor flags the new field on those workflows until a template
  is picked.
- **Enable Monetization** removed from both nodes. The API never accepted it
  (it answered "Please Enter Full Information"); a saved value is ignored.

### Added

- **Landing Page** switch on both nodes; Page Title and Page Description show
  when it is on (the short link needs both, the QR code a title).
- **Android URL** and **iOS URL** on Short Link Create and Update: an https://
  link or an app link such as `myapp://item/1`. Left out on Create, the link uses
  the deep link the destination page declares. On Update, a field you add but
  leave empty clears it, and one you do not add is left to the API (kept, or
  re-read from the new destination when the URL changes).
- **Destination URL** under Short Link Update's Additional Fields.
- On Update, a **Tag** or **Reference ID** you add but leave empty clears it.
- **Short Link → List** filters: **Destination URL Contains** and **Landing
  Page Enabled**.

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
