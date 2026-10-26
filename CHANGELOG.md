# Changelog

## 6.0.0 - Unreleased

Breaking: the **Posty5 Store** node is removed. The Online Store Builder left
Posty5 on 2026-10-26 (owner decision D22): it is now StorVilo (storvilo.com), a
separate platform, and store automation (suppliers, supplier products and
imports, product links, supplier orders, order parts, orders) now lives in the
**`n8n-nodes-storvilo`** package (its *StorVilo* node). Ships with the Posty5 API
release that removes the store, which waits for StorVilo's production launch.
Publish date: _to be recorded at publish_.

### Removed

- *Posty5 Store* (`posty5Store`, `nodes/Posty5Store`) and its entry in
  `package.json`'s `n8n.nodes`. A saved workflow that uses it shows the node as
  unknown after the upgrade: replace it with the *StorVilo* node from
  `n8n-nodes-storvilo`.
- Its store-only code: `utils/store.helpers.ts`, `types/store.types.ts`,
  `API_ENDPOINTS.STORE_SUPPLIERS` / `STORE_ORDERS` and
  `STORE_SUPPLIER_PAGE_SIZES` (`utils/constants.ts`).
- The `online-store` and `dropshipping` package keywords.

The other nodes and the *Posty5 API* credential are unchanged.

### Security

- An ID parameter is escaped as one path segment (`encodePathSegment`,
  `utils/api.helpers.ts`) on every node and the trigger: a mapped value holding
  `/`, `?` or `#` can no longer send the request, with the node's API key, to
  another route, and an ID of `.` or `..` is refused before any request.
  ObjectIds are unchanged.
- *Posty5 QR Code* masks the WiFi *Password* field in the editor
  (`typeOptions.password`). Saved values are kept.
- `package-lock.json`: `npm audit fix` updates of development dependencies
  (n8n-workflow 1.120.33, lodash, form-data, handlebars, js-yaml, flatted and
  others). The package still has no runtime dependencies.
- Development toolchain: `@typescript-eslint` 8 and `eslint-plugin-n8n-nodes-base`
  2 (the 1.x plugin pulled in the vulnerable `@typescript-eslint` 6), and an
  `overrides` pin of `form-data` to `^4.0.6`. What `npm audit` still reports is
  one zod advisory inside the `n8n-workflow` types package, which tests replace
  with a mock; n8n-workflow 2.x does not clear it and needs Node 24 to build.
- The publish workflow pins `actions/checkout` and `actions/setup-node` to
  commit SHAs, and build tarballs (`*.tgz`) are no longer tracked.

### Changed

- n8n lint clean (0 errors): option and collection lists alphabetized,
  *Create From File* / *Create From GitHub* / *Update From File* / *Update From
  GitHub* (HTML Hosting) and *Get post status* / *List posts* (Social Publisher
  Post) relabelled, an email placeholder on the QR Code *Email Address*, and the
  credential's API key description links to Posty5 Studio. Labels only: saved
  workflows keep their values.

## 5.2.0 - Unreleased

Additive (list date filters, redesign-dashboards SDK-03). Needs the API release
with the list date filters (API-03) for Short Link, QR Code and HTML Hosting;
the post list has always accepted them. Publish date: _to be recorded at
publish_.

### Added

- **Created From Date** / **Created To Date** in the **Filters** of
  *Posty5 Short Link › List*, *Posty5 QR Code › List* and *Posty5 HTML Hosting ›
  List*, and in a new **Filters** collection on *Posty5 Social Publisher Post ›
  List Posts* (alongside the unchanged Workspace ID, Return All and Limit).
  `YYYY-MM-DD` text fields (`type: 'string'`, as on the Store node, so no time
  is added); a date value from an expression is sent as its day. Sent as
  `fromDate` / `toDate` only when set; the API applies the created-at window
  only when both are sent, in whole UTC days.
- `CREATED_AT_RANGE_FILTERS` (`utils/list-date-filter.properties.ts`) and
  `createdAtRangeQuery` (`utils/date.helpers.ts`), shared by the four nodes.

### Node versions

No node version bump: the fields are optional collection entries, so saved
workflows load and run unchanged (same defaults, nothing new required). This
follows 5.1.0's QR Code *Render*, added to v1 and v2 alike; v2 exists only for
the versioned-writes behaviour change.

## 5.1.0 - Unreleased

Additive (QR design and export). Publish date: _to be recorded at publish_.

### Added

- **Posty5 QR Code › Render** (v1 and v2): `GET /api/qr-code/:id/render` →
  the QR code as a PNG, SVG or PDF **binary** (default field `data`) the next
  node can attach, upload or post. Format, Print Preset (loaded from
  `GET /api/qr-code-template/design-catalogue`, incl. Custom width in mm), DPI
  (PNG at a preset) and Size (Px) (no preset). File name from the API's
  `Content-Disposition`; json `{ qrCodeId, format, presetId, fileName,
  mimeType, fileSize, binaryProperty }`. SVG/PDF/presets/DPI/PNG over 2048 px
  need a paid plan: the API's 403 text is shown unchanged.
- **Posty5 QR Code › Check Scannability**: `POST /api/qr-code/scannability-check`
  for a saved QR code or a template (optional sample text and print preset) →
  the `{ verdict, checks, symbol }` report.
- **Posty5 QR Code › List Templates**: My Templates (`user-lookup`) or Public
  Templates (`public-lookup`), Search and Limit → `{ _id, name }` rows.
- `makeBinaryApiRequest` and `parseContentDispositionFileName`
  (`utils/api.helpers.ts`): a GET kept as bytes; a failed request's JSON body is
  decoded so the error keeps the API message.

## 5.0.0 - Unreleased

Not yet published (it also carries the unreleased 4.7.0 work below). Publish
date: _to be recorded at publish_.

### Breaking changes

- **Errors are `NodeApiError`.** Every failed API request now throws n8n's
  `NodeApiError` with `httpCode`, the API's `code`, `apiMessage` and, on a
  `409 VERSION_CONFLICT`, `currentVersion`. The message keeps the
  `Posty5 API Error: <message>` text, except a conflict, which reads
  "The item changed since it was read (current version N). Get it again, then
  update."
- **Node version 2** of Short Link, QR Code, HTML Hosting, Form Submission and
  Social Publisher Post. Update, delete, change status and reschedule (and, on
  Short Link, Set Rules, Update Campaign and Delete Campaign) gain a required
  **Version** field (default `{{ $json.__v }}`) sent as `If-Match: "<v>"`; a
  write that answers a new `version` returns it as `__v` (HTML Hosting's file
  update puts it on the returned details).
  **Version Options > On Unknown Version**: Fail (default) or Use Latest
  (Overwrite), which reads the item and uses its `__v` (a social post is read
  through `GET /api/social-publisher-post/:id/status`).
- **Every request** carries `X-Posty5-Client: posty5-n8n/<package version>`.
- **Posty5 Trigger** deactivation reads its webhook endpoint and deletes it with
  that `__v` as `If-Match` (a `404` still counts as already gone).

### v1 legacy behaviour

Saved v1 nodes keep working unchanged: their update and delete operations read
the item first and send its `__v` (last write wins, as before). v1 is
deprecated: its write operations show a notice saying so (no new input).

### Migration

Add a Get step before the write and map its `__v` to Version (the default does
this when the Get is the previous step), or set On Unknown Version to Use
Latest. A catch that matched the old `Error` keeps working on the message; read
`httpCode` / `code` instead of parsing it.

## 4.7.0 - folded into 5.0.0

### Short link controls

- **Posty5 Short Link → Create / Update → Additional Fields:** Tags
  (comma-separated), Campaign (dropdown, `GET /api/link-campaign`), Active From,
  Expires At, Max Visits, Fallback URL, Password (masked) and Remove Password,
  UTM, Routing Rules (JSON), Variants (JSON), Pixels with Pixels Consent
  Acknowledged, Health Monitor. On Update an added but empty field clears it.
  Routing Rules / Variants that are not a JSON array fail with a
  `NodeOperationError` naming the field.
- New operations on the same node: **Set Rules** (reads the link for
  `baseUrl` / `templateId`, sends only the rule sections you add), **List Tags**,
  **Check Health**, and **Create / Get / List / Update / Delete Campaign**
  (Delete has *Detach Links*).
- **List** filters: Tags, Campaign.
- **Tag** is kept and labelled *deprecated — use Tags*: saved workflows send the
  same body as before. No `resource` switch was added (operations only), so
  parameter paths are unchanged and the node stays version 1.

### QR content types (passes 1 and 2)

Needs the Posty5 API's QR content types (feature `qr-content-types`). Additive.

#### Added

- **Posty5 QR Code** *QR Type*: **Business Card (vCard)**, **Calendar Event**,
  **WhatsApp**, **Review Link** and **Social Profile** (one profile), each with
  its own fields, sent as `qrCodeTarget.<type>` (no `options.text`). Also
  available on *Create Many*.
- **App Store Links** (`appStore`: Android URL, iOS URL, required Fallback URL)
  and **File (PDF or Image)** (`file`), both dynamic-only: Mode is hidden and
  `mode: dynamic` is always sent; Scan Rules show on Create.
- File QR codes upload from an input binary property: type (PDF, JPEG, PNG,
  WebP) and size (10 MB) checked first, then `POST /api/qr-code/file/upload-url`,
  a PUT of the bytes to the signed URL (no API key), then create/update with
  `qrCodeTarget.file.bucketFilePath`. Update without a binary keeps the stored
  file. Not offered on *Create Many* (the bulk route cannot take a file).
- **Social Profile** takes up to 12 profiles (*Profiles* fixedCollection) and a
  *Page Title*; 2 or more profiles are always sent as dynamic. Replaces the
  pass-1 single Platform / Handle / Profile URL fields (never released).

### Bulk create and Posty5 Trigger

Needs the Posty5 API's sync bulk routes and `/api/webhook-endpoints`
(feature `link-qr-bulk-and-webhooks`). Additive; node versions stay 1.

#### Added

- **Create Many** on **Posty5 Short Link** and **Posty5 QR Code**: one record per
  input item via `POST /api/short-link/bulk` / `POST /api/qr-code/bulk` in
  chunks of up to 100, with `Idempotency-Key` per chunk, *Defaults*, *Batch
  Size*, *Fetch Page Metadata* (short links) and *Fail on Any Row Error*. One
  output item per input item; refused rows are `failed` items.
- **Posty5 Trigger**: starts a workflow on short-link visits, dynamic QR scans
  and milestones. Registers/removes its own webhook endpoint, verifies every
  request (Standard Webhooks), splits batched deliveries into items.
- `makeApiRequest` takes optional extra `headers`.

### Dynamic QR codes

Needs the Posty5 API's dynamic QR release. No node version bump.

#### Added

- Posty5 QR Code: a **Mode** option (Static / Dynamic) on Create (default
  Static) and Update (default Keep Current), hidden for WiFi. Create sends
  `mode` only for Dynamic and Update only when one is picked, so saved
  workflows send the same body as before. List gains a Mode filter. Outputs
  pass through `mode` and `dynamicSince`.
- Posty5 QR Code: a **Scan Rules** collection (Active From, Expires At, Max
  Scans, Fallback URL, Clear Scan Rules) on Create (Dynamic only) and Update,
  hidden for WiFi. Sent as `access`; empty sends nothing (Update keeps the
  rules), Clear sends `access: null`. Starter plan and above.

## 4.6.0 - Unreleased

Needs the Posty5 API's link + QR truth-pass and visit analytics releases
(`GET /api/short-link/:id/analytics`, `GET /api/qr-code/:id/analytics`). Builds
on 4.5.0 (the MCP release); node versions stay 1. The truth-pass changes are
listed under "Link + QR truth pass" below.

### Added

- **Get Analytics** on **Posty5 Short Link** and **Posty5 QR Code**: visits,
  unique visitors and bot visits over a range, a day/week/month series, and
  breakdowns by country, device, OS, browser, referrer, channel (click or scan)
  and language. **Range** is *Last 7 / 30 / 90 Days* (today included, "today"
  in the Time Zone option else the workflow's time zone) or *Custom* From/To,
  sent as `YYYY-MM-DD`; the zone is always sent as `tz`. **Interval**; **All
  Breakdowns My Plan Allows** (on by default, `breakdown=all`) or a
  **Breakdowns** list; **Options** → Breakdown Rows (1–50, API default 10) and
  Time Zone. **Output** *Series as Items* returns one item per series point,
  each carrying `meta`. Reading analytics costs no credits.
- **Get Statistics** on both nodes: account-wide counts
  (`GET /api/short-link/statistics`, `GET /api/qr-code/statistics`) for a
  **Period** (Today, Last 7 Days, Last 30 Days, This Month, Custom From/To):
  totals with the in-range visits, visits and records created per UTC day, and
  the top 10 by visits. One item, the API answer unchanged.
- A breakdown or a range your plan does not include fails with the API's own
  plan message as an n8n API error (HTTP 403); `breakdown=all` lists such
  breakdowns in `meta.locked` instead of failing.

### Fixed

- API error messages: with n8n's current HTTP helper the API's `message` was
  never read (the node looked only at the older `response.body`), so failures
  showed "Request failed with status code …". The message is now read from the
  response body either way, and the HTTP status is kept on the error.

### Link + QR truth pass

Needs the Posty5 API's link + QR truth-pass release: Android/iOS URLs and the
server-built QR text arrive with it.

#### Fixed

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

#### Changed

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

#### Added

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
