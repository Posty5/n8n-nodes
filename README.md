# n8n-nodes-posty5

![Posty5](https://posty5.com/logo.png)

N8N community nodes for [Posty5](https://posty5.com) - Automate URL shortening, QR code generation, HTML hosting, and social media publishing in your N8N workflows.

## 🚀 What is Posty5?

Posty5 is a comprehensive platform for digital content management and distribution:

- **URL Shortening** - Create branded short links with analytics
- **QR Code Generation** - Generate QR codes for URLs, WiFi, email, SMS, and more
- **HTML Hosting** - Host static HTML pages with custom domains
- **Form Management** - Collect and manage form submissions
- **Social Media Publishing** - Automate video publishing to YouTube, TikTok, Facebook, and Instagram

## 📦 Installation

### Via NPM

```bash
npm install n8n-nodes-posty5
```

### Via N8N Community Nodes

1. Open N8N
2. Go to **Settings** → **Community Nodes**
3. Search for `n8n-nodes-posty5`
4. Click **Install**

## 🔑 Setup

### Get Your API Key

1. Visit [Posty5 Studio](https://studio.posty5.com/account/settings?tab=APIKeys)
2. Create a new API key
3. Copy the key for use in N8N

### Configure Credentials in N8N

1. Add **Posty5 API** credentials
2. Paste your API key
3. Click **Test**. It asks the API which key this is (`GET /api/api-key/current`):
   a good key passes, a wrong or revoked one fails with "Invalid or revoked API
   key". Requests go to `https://api.posty5.com`; there is no base URL to set.

Every request the nodes send carries `X-Posty5-Client: posty5-n8n/<package version>`
(from 4.5.0), which the API uses to tell n8n traffic apart. It is not a
credential and needs no setup.

## 📋 Available Nodes

### 1. Posty5 Short Link

Create and manage shortened URLs. Each link counts its visits.

**Operations:**

| Operation | What it sends |
| --- | --- |
| Create | Destination URL and **Template** (required), plus Name, Custom Slug and Additional Fields: Tag, Reference ID, Landing Page with its Page Title and Page Description, Android URL, iOS URL. |
| Get | Retrieve link details, including its visit count and Android/iOS URLs. |
| Get Analytics | Visits, unique visitors and bot visits over a range, a series by day/week/month, and breakdowns (country, device, OS, browser, referrer, channel = click or scan, language). See [Get Analytics](#get-analytics-short-link-and-qr-code). |
| Get Statistics | Counts over all your short links: totals, visits per day, links created per day, top 10 links by visits. See [Get Statistics](#get-statistics-short-link-and-qr-code). |
| List | Filters: Search (name), Destination URL Contains, Tag, Reference ID, Landing Page Enabled, Created From Date / Created To Date (`YYYY-MM-DD`, applied only as a pair, whole UTC days). |
| Update | Reads the link, then saves it with your changes on top: anything you leave alone keeps its stored value. Template may stay empty to keep the current one. Destination URL is under Additional Fields. The Custom Slug cannot be changed. |
| Create Many | One short link per input item in batched calls (up to 100 rows per request): Destination URL, Name, Custom Slug, Template, Row Fields (Tag, Reference ID), **Defaults** (Template ID, Tag, Reference ID) and Options (Batch Size, Fetch Page Metadata, Fail on Any Row Error). See [Create Many](#create-many-short-link-and-qr-code). |
| Delete | Remove links. |
| Set Rules | Changes only the rule sections you add: access (Active From, Expires At, Max Visits, Fallback URL, Password / Remove Password), Routing Rules, Variants, UTM, Pixels. Empty clears a section. |
| List Tags | Your links' distinct tags (optional Starts With), one item per tag. |
| Check Health | Queues one destination check of a link (once per 10 minutes; plan-gated). |
| Create / Get / List / Update / Delete Campaign | Link campaigns (`/api/link-campaign`): name, description, color, UTM, archived. Delete Campaign with *Detach Links* detaches the campaign's links first. |

Create and Update also take, under Additional Fields: **Tags** (comma-separated;
*Tag* is deprecated but still works), **Campaign**, the access fields above,
**UTM**, **Routing Rules (JSON)**, **Variants (JSON)**, **Pixels** with **Pixels
Consent Acknowledged** (required the first time), and **Health Monitor**. List
filters gain Tags and Campaign.

> **Secrets:** the Password field is masked in the editor, but n8n stores node
> parameters inside the workflow. Put the password in an expression that reads
> a secret (environment variable or a credential-backed node) rather than
> typing it in, and never share the workflow JSON with a literal password.

**Template** is a dropdown of your QR code templates and the public ones; the
Posty5 API requires one on every API-key create and update. On Update, a Tag,
Reference ID, Android URL or iOS URL you add but leave empty clears it.

**Use Cases:**

- Generate tracking links for marketing campaigns
- Create QR-friendly short URLs
- Send app users to the app (Android/iOS URLs) and everyone else to the web page

### 2. Posty5 QR Code

Generate QR codes for 14 different types.

**QR Types:**

- URL - Link to websites
- Free Text - Plain text content
- Email - mailto: links with subject/body
- WiFi - Network credentials
- Phone Call - tel: links
- SMS - Pre-filled text messages
- Geolocation - GPS coordinates
- Business Card (vCard) - Name, organization, up to 3 phones, 2 emails, website, address, note
- Calendar Event - Title, start/end, all day, timezone, location, description, URL
- WhatsApp - Chat with a pre-filled message
- Review Link - Google (Place ID or URL), Tripadvisor, Trustpilot, Yelp, Facebook, other
- Social Profile - 1 profile, or 2-12 profiles on a list page (always dynamic)
- App Store Links - Android URL and/or iOS URL plus a required Fallback URL (dynamic only)
- File (PDF or Image) - A PDF, JPEG, PNG or WebP of up to 10 MB from an input binary property (dynamic only, not in Create Many)

**Operations:**

| Operation | What it sends |
| --- | --- |
| Create | QR Type, its content fields and **Template** (required), plus Name, **Mode** and Additional Fields: Tag, Reference ID, Landing Page with its Page Title and Page Description. |
| Get | Retrieve QR code details. |
| Get Analytics | Scans, unique visitors and bot visits over a range, a series and breakdowns, as on the Short Link node. See [Get Analytics](#get-analytics-short-link-and-qr-code). |
| Get Statistics | Counts over all your QR codes, as on the Short Link node (top list `topQRCodes`). See [Get Statistics](#get-statistics-short-link-and-qr-code). |
| List | Filters: Search (name), Tag, Reference ID, Mode, Created From Date / Created To Date (`YYYY-MM-DD`, applied only as a pair, whole UTC days). |
| Update | Reads the QR code, then saves the content you enter with everything else kept. Template may stay empty to keep the current one; Mode defaults to Keep Current. |
| Create Many | One QR code per input item in batched calls (up to 100 rows per request): QR Type and its fields, Name, Mode, Template, Row Fields (Tag, Reference ID), **Defaults** and Options (Batch Size, Fail on Any Row Error). See [Create Many](#create-many-short-link-and-qr-code). |
| Delete | Remove QR codes. |
| Render | Downloads a QR code as a **file** in a binary field (default `data`) for the next node to email, upload or post. **Format** PNG / SVG / PDF; **Print Preset** (loaded from the design catalogue: Sticker 3cm, Business Card, Flyer 5cm, Table Tent 8cm, Poster 15cm, Custom 20–500 mm) with **DPI** 150 / 300 / 600 for PNG; with no preset, **Size (Px)** for PNG and SVG. The json carries `qrCodeId`, `format`, `presetId`, `fileName`, `mimeType`, `fileSize`. |
| Check Scannability | A report on whether a saved QR code (as rendered) or a template will scan: `verdict` (`good` / `warning` / `poor`), `checks` (contrast, inverted colours, logo coverage, quiet zone, module size, dot scale) and `symbol`. A Print Preset adds the module size in mm. It only warns. |
| List Templates | `{ _id, name }` rows of **My Templates** or **Public Templates**, filtered by Search, up to Limit: the IDs the Template field takes. |

The design comes from the template, and Posty5 builds the encoded text from the
content fields: the node sends the content as `qrCodeTarget` and nothing else.

**Mode.** Static (the default) encodes the content in the image. Dynamic: the
image points to a Posty5 link, so you can change where it goes later without
reprinting. Mode is hidden for WiFi, which cannot be dynamic (the API answers
400). Create sends `mode` only for Dynamic, so saved workflows keep producing
static codes; Update sends it only when you pick one. Outputs carry `mode` and
`dynamicSince` (null for a static code).

**Scan Rules** (dynamic codes, Starter plan and above): Active From, Expires At,
Max Scans and Fallback URL (where gated scans go). Shown on Create for Dynamic
and on Update. On Update, leave it empty to keep the current rules; any rule set
replaces all of them, and Clear Scan Rules removes them. Outputs carry `access`.

**Dynamic-only types.** App Store Links and File have no static form: Mode is
hidden and the node always sends `mode: dynamic` (Scan Rules are shown on
Create). A Social Profile code with 2 or more profiles is sent as dynamic too.

**File QR codes.** Set *Binary Property* (default `data`) to the input binary
holding the file, e.g. from an HTTP Request or Read Binary File node. The node
checks the type and size, asks Posty5 for a signed upload URL
(`POST /api/qr-code/file/upload-url`), uploads the bytes there (no API key is
sent to the storage URL), then creates the code with the returned
`bucketFilePath`. *File Name* overrides the binary's name. On Update, leave
Binary Property empty to keep the stored file. Create Many does not offer File:
the bulk route cannot upload.

**Render and plans.** Plain PNG up to 2048 px works on every plan. SVG, PDF, a
print preset, a DPI or a PNG over 2048 px need Starter or higher; otherwise the
node fails with the API's message (*This feature is not available on your
current plan.*), or outputs it as `error` with *Continue On Fail*. Rendering
costs no credits. PDF with no preset prints at Flyer 5cm. The file is named by
the API (`<name>-<preset or size>.<ext>`).

### Create Many (Short Link and QR Code)

*Create Many* turns every input item into one row and sends them to
`POST /api/short-link/bulk` / `POST /api/qr-code/bulk` in chunks of
**Batch Size** (default and maximum 100): 250 items are 3 requests. Each chunk
carries `Idempotency-Key: n8n-<executionId>-<nodeName>-<chunk>`, so retrying the
same execution is not charged twice; a new run creates new records.

- Output: one item per input item, in order, paired to it: `status`
  (`created` / `failed`), `id`, `shortUrl` or `qrCodeDownloadURL`, `errors`.
- A row Posty5 refuses is an output item with `status: "failed"`. Turn on
  **Fail on Any Row Error** to stop the workflow instead (rows already created
  stay created).
- An item with no Template and no **Defaults → Template ID** fails locally and
  is not sent.
- A whole-request error (plan gate, credits) stops the node, or with *Continue
  On Fail* is output as `error` on every item of that chunk.
- QR *Type* and every field are per item, so one run can mix types. Landing
  page and Android/iOS fields are not part of a bulk row.

### Get Analytics (Short Link and QR Code)

`GET /api/short-link/:id/analytics` or `GET /api/qr-code/:id/analytics`, the
same numbers the dashboard's Analytics tab and the Posty5 SDKs read. Reading
analytics costs no credits.

| Parameter | What it sends |
| --- | --- |
| Short Link ID / QR Code ID | The record to read. |
| Range | *Last 7 / 30 / 90 Days* (today included, "today" counted in the Time Zone option, else the workflow's time zone) or *Custom* with **From** and **To** dates (both days included). Sent as `from` / `to`, `YYYY-MM-DD`. Default: last 30 days. |
| Interval | `day` (default), `week` (points start on Monday) or `month` (points start on the 1st). |
| All Breakdowns My Plan Allows | On (default): `breakdown=all`. Breakdowns your plan does not include are listed in `meta.locked` with the plan that adds them, instead of failing. |
| Breakdowns | Off the toggle: the ones you pick, comma-joined. None picked: `breakdown` is left out and the API returns every breakdown your plan allows. |
| Output | *Full Response* (one item, the API answer unchanged) or *Series as Items* (one item per series point, each with `meta`, handy for Google Sheets). |
| Options → Breakdown Rows | Rows per breakdown, 1–50 (API default 10); the rest is summed into an `other` row. |
| Options → Time Zone | IANA name, e.g. `Africa/Cairo`. Empty: the workflow's time zone (Workflow Settings → Timezone, default the instance's `GENERIC_TIMEZONE`). Always sent as `tz`, so the API counts days in the same zone the presets use. |

The answer is `{ totals: { visits, uniqueVisitors, botVisits }, series: [{ date,
visits, uniqueVisitors }], breakdowns: { <name>: [{ key, visits, uniqueVisitors }] },
meta: { from, to, interval, timezone, source, analyticsStartedAt, locked,
maxHistoryDays } }`. Bots and link-preview fetchers count only in `botVisits`;
`uniqueVisitors` over several days is the sum of each day's unique visitors.
Naming a breakdown your plan does not include, or a range further back than it
allows, fails with the API's own plan message (HTTP 403). An unknown ID fails
with the API's 400 "The Short Link Is Not Found" / "The QR Code Is Not Found".

### Get Statistics (Short Link and QR Code)

`GET /api/short-link/statistics` or `GET /api/qr-code/statistics`: counts over
all your links (or QR codes), with no ID. **Period** is *Today*, *Last 7 Days*,
*Last 30 Days* (default), *This Month* or *Custom* with **From** / **To**
(`YYYY-MM-DD`); sent as the API's `period` (`today`, `7d`, `30d`, `month`,
`custom`). Days are UTC days. The answer is one item, unchanged: `{ range: {
from, to, period }, data: { totals, daily: [{ _id, createdCount, visitorsSum }],
topLinks | topQRCodes } }`. `totals` holds the lifetime `totalVisitors` counter
(it includes visits from before visit analytics launched) and the in-range
`visitsInRange`, `uniqueVisitorsInRange` and `botVisitsInRange`; `visitorsSum`
is visits by people that day. Reading statistics costs no credits.

### 3. Posty5 HTML Hosting

Host static HTML pages with CDN delivery.

**Operations:**

- Create from File - Upload HTML file
- Create from GitHub - Deploy from GitHub URL
- Update from File - Update with new file
- Update from GitHub - Sync from GitHub
- Get - Retrieve page details
- List - List all pages (Filters: Search, Tag, Reference ID, Created From Date / Created To Date (`YYYY-MM-DD`, applied only as a pair, whole UTC days).)
- Delete - Remove pages
- Clear Cache - Purge CDN cache
- Get Form IDs - Extract form IDs from page

**Use Cases:**

- Landing pages
- Lead capture forms
- Marketing microsites
- Product documentation

### 4. Posty5 HTML Variables

Manage dynamic variables for HTML pages.

**Operations:**

- Create - Add new variables
- Get - Retrieve variable value
- List - List all variables
- Update - Change variable value
- Delete - Remove variables

**Variable Keys:** Must start with `pst5_`

### 5. Posty5 Form Submission

Collect and manage form submissions from HTML pages.

**Operations:**

- Get - Retrieve submission details
- Get Adjacent - Navigate next/previous submissions
- List - List all submissions with filters
- Delete - Remove submissions

**Filters:**

- HTML Hosting ID
- Form ID
- Status (new/read/archived)
- Search term

### 6. Posty5 Social Publisher Workspace

Manage social media workspaces/organizations.

**Operations:**

- Create - New workspace with optional logo
- Get - Retrieve workspace details
- List - List all workspaces
- Update - Modify workspace
- Delete - Remove workspace

### 7. Posty5 Social Publisher Post

Publish creator-owned videos to connected social media platforms. TikTok publishing requires the Posty5 creator-controlled review and confirmation flow.

**Supported Platforms:**

- YouTube
- TikTok
- Facebook
- Instagram

**Operations:**

- Publish Video - Upload and schedule posts
- Publish Long Video - Videos up to 60 minutes, charged by duration
- Quote Long Video - Price a video before publishing it
- Reschedule Post - Move a not-yet-published post, or send it now (free)
- Get Post Status - Check publishing progress
- List Posts - View a workspace's posts (Filters: Created From Date / Created To Date (`YYYY-MM-DD`, applied only as a pair, whole UTC days).)
- Get Default Settings - Retrieve platform defaults

**Long video (up to 60 minutes):**

Long video is charged by **duration** — 50 credits for every started 5 minutes,
so a 12-minute video costs 150. The duration is measured server-side from the
file; there is no duration field to send.

Use **Quote Long Video** first to branch a workflow on cost before committing:

```
HTTP Request (fetch video) -> Quote Long Video -> IF credits < 500 -> Publish Long Video -> Get Post Status
```

Platform limits differ, and are checked when the post is created rather than
mid-upload:

| Platform | Longest accepted video |
| --- | --- |
| YouTube | 12 hours |
| Facebook | 4 hours |
| Instagram | 15 minutes (Reels) |
| TikTok | Per-creator, read from the connected account |

A workspace publish goes out to the targets that accept the video and reports
the rest in `refusedTargets` on the item, so a later node can branch on a
partial publish. An account publish is refused outright instead, and nothing is
charged.

Requires the `socialMediaPublisher.longVideoPost` plan feature.

**Uploads resume.** Binary video is sent to the API's resumable endpoint in
8MiB chunks, so a dropped connection costs one chunk rather than the whole
transfer. The node falls back to a single signed PUT when the server does not
offer the resumable service.

> **Note on memory.** n8n's binary helper hands a node the whole file as a
> Buffer, so a 60-minute video is in memory before the upload starts. Chunking
> bounds what a dropped connection costs, not what the workflow allocates —
> prefer the URL source for very large videos.

**Video Sources:**

- Binary data (file upload)
- Direct video URL
- Direct video file URL for content you created or have rights to publish

**Uploaded images:** **Publish Image** with the **Uploaded Bucket File** source
takes a file you already uploaded through `generate-upload-urls`, so the node
cannot reserve a post ID for it. Also pass the `postId` from that response as
**Upload Post ID**. Posty5 deletes an uploaded file only from the folder of the
post that owns it, so without the ID the image stays in storage after the post
is published or deleted.

TikTok Direct Post is not exposed as a public repost workflow in these n8n nodes. Do not use TikTok publishing to copy arbitrary third-party videos from TikTok, YouTube, Facebook, Instagram, or any other platform.

**Platform-Specific Settings:**

- **YouTube:** Title, description, tags, made for kids
- **TikTok:** Caption, privacy level, disable duet/stitch/comments
- **Facebook:** Title, description
- **Instagram:** Description, share to feed

**Post-publish comments:**

Up to **five** comments per post, through the **Comments** collection. Each one
carries its own text, its own delay (0-1440 minutes after the post goes live),
its own optional image and its own per-platform switches.

- **25 credits each**, charged per comment that actually posts. A comment aimed
  at no enabled platform is dropped before it is charged.
- **TikTok is never one of them.** TikTok exposes no public comment-posting
  endpoint, so a comment aimed at it reports `notSupported` rather than failing.
- **An image is Facebook only.** Instagram's and YouTube's comment endpoints are
  text-only, so an image bound for either is dropped with a reason rather than
  failing the comment.

The older single **Comment** collection still works and is marked deprecated. It
is mapped into the first entry of **Comments** when that is empty, and the two
are never sent together — the API refuses a request carrying both.

### 8. Posty5 Trigger

Starts a workflow when a short link is visited, a QR code is scanned or a
visit/scan milestone is reached. Activating the workflow registers a Posty5
webhook endpoint for the node's URL; deactivating it removes the endpoint.

| Setting | Meaning |
| --- | --- |
| Events | *Short Link Visited*, *QR Code Scanned*, *Short Link Visit Milestone*, *QR Code Scan Milestone* |
| Links | All my links and QR codes, or specific short link / QR code IDs (comma-separated) |
| Options | Include Bot Visits (off), Milestones (`100,1000`, up to 10), Delivery (each event, or batched every 1 min / 5 min / 1 h), Split Batches Into Items (on) |

- **n8n must be reachable over public HTTPS**: n8n Cloud, or self-hosted with
  `WEBHOOK_URL` set to a public HTTPS address (or a tunnel). Posty5 refuses
  private or plain-HTTP URLs.
- Every request is verified (Standard Webhooks signature, 5-minute replay
  window) before the workflow runs; a forged one gets 401.
- **Static QR codes never produce events** — the image holds the content
  itself. A scan of a short link's QR image arrives as *Short Link Visited* with
  `channel: "qr"`; dynamic QR codes send *QR Code Scanned*.
- Each item is the event envelope (`id`, `type`, `createdAt`, `data`) plus
  `webhookId` for de-duplication.
- Rotating the endpoint's secret in the dashboard breaks verification: rotate
  by deactivating and re-activating the workflow. An endpoint Posty5 disabled
  after repeated failures is recreated on the next activation.

## 💡 Workflow Examples

### Example 1: URL Shortener → QR Code

Create a short link and generate a QR code for it:

```
HTTP Request (Get URL)
  ↓
Posty5 Short Link (Create)
  ↓
Posty5 QR Code (Create URL type)
  ↓
Posty5 QR Code (Render, Format PDF, Print Preset Flyer 5cm; QR Code ID = {{ $json._id }})
  ↓
Send Email (Attachments: data)
```

### Example 2: Form Submission → Email Notification

Monitor form submissions and send notifications:

```
Schedule Trigger (every 5 minutes)
  ↓
Posty5 Form Submission (List - filter by status: new)
  ↓
IF (has new submissions)
  ↓
Send Email
  ↓
Posty5 Form Submission (Update status to read)
```

### Example 3: Social Media Publishing

Publish a video to multiple platforms:

```
Trigger (Manual/Webhook)
  ↓
Read Binary File (video.mp4)
  ↓
Posty5 Social Publisher Post (Publish)
  - Platforms: YouTube, TikTok, Instagram
  - Video: Binary data
  - Scheduled: Now
  ↓
Posty5 Social Publisher Post (Get Post Status)
  ↓
Send Notification
```

### Example 4: Landing Page Deployment

Deploy HTML page from GitHub and create short link:

```
GitHub Trigger (on push)
  ↓
Posty5 HTML Hosting (Create from GitHub)
  ↓
Posty5 Short Link (Create)
  ↓
Slack Notification (with short URL)
```

### Example 5: Weekly Top Countries to Slack

```
Schedule Trigger (every Monday)
  ↓
Posty5 Short Link (Get Analytics: Last 7 Days, Breakdowns = Country, Breakdown Rows = 5)
  ↓
Slack (post totals.visits and breakdowns.country)
```

### Example 6: Slack Message on Click

```
Posty5 Trigger (Short Link Visited, specific short link)
  ↓
Slack → Send Message ("{{$json.data.target.name}} opened from {{$json.data.visit.country}}")
```

### Example 7: Sheet Rows → Short Links (Create Many)

```
Google Sheets → Get Rows (800 rows)
  ↓
Posty5 Short Link → Create Many (Destination URL = {{$json.url}}, Defaults → Template ID)
  ↓   8 API calls, one output item per row
Google Sheets → Update Row (shortUrl, status)
```

## 🔧 Advanced Features

### Pagination

All list operations support pagination:

```javascript
// Return all results (automatic pagination)
returnAll: true;

// Or limit results
returnAll: false;
limit: 50;
```

### Filtering

Most list operations support filters:

```javascript
{
  tag: "marketing",
  refId: "campaign-2024",
  search: "keyword"
}
```

### Binary Data Handling

Nodes support binary data for:

- HTML files (HTML Hosting)
- Video files (Social Publisher) - Max 2GB
- Image files (Workspace logos, thumbnails)

Use N8N's binary data system:

```javascript
// From HTTP Request node
binaryPropertyName: 'data';

// From Read Binary File node
binaryPropertyName: 'data';
```

### Scheduling

Social Publisher Post supports scheduling:

```javascript
scheduledPublishTime: 'now';
// or
scheduledPublishTime: new Date('2024-12-31T10:00:00Z');
```

## 🔒 Versioned writes (5.0.0)

Version 2 of the Short Link, QR Code, HTML Hosting, Form Submission and Social
Publisher Post nodes protects updates and deletes from overwriting someone
else's change:

- **Version** (required on update, delete, change status, reschedule, and on
  Short Link's Set Rules, Update Campaign and Delete Campaign): the
  `__v` of the item as you read it. It defaults to `{{ $json.__v }}`, so a
  Get → Update chain works as is. It is sent as `If-Match`.
- If the item changed since, the node fails with a `409` conflict:
  *"The item changed since it was read (current version N). Get it again, then
  update."*
- **Version Options > On Unknown Version**: `Fail` (default) or
  `Use Latest (Overwrite)`, which reads the item and uses its current version
  (last write wins, your explicit choice).
- **v1 nodes (legacy, deprecated)** show no new field, only a notice on their
  write operations: they read the item first and overwrite it, exactly as
  before.
- Every request identifies itself with `X-Posty5-Client: posty5-n8n/<version>`.

## 🐛 Error Handling

All nodes support N8N's "Continue on Fail" option:

```javascript
{
	json: {
		error: 'Error message here';
	}
}
```

Common errors:

- **401 Unauthorized** - Invalid API key
- **403 Forbidden** - On Get Analytics: a breakdown or range your plan does not include (the API's message is shown as is)
- **404 Not Found** - Resource doesn't exist (Get Analytics answers an unknown ID with a 400 and the API's not-found message)
- **429 Too Many Requests** - Rate limit exceeded
- **422 Validation Error** - Invalid parameters

## 📚 Resources

- [Posty5 Documentation](https://guide.posty5.com/)
- [Posty5 Studio](https://studio.posty5.com)
- [Get API Key](https://studio.posty5.com/account/settings?tab=APIKeys)
- [N8N Documentation](https://docs.n8n.io)
- [GitHub Repository](https://github.com/posty5/n8n-nodes-posty5)

## 🤝 Support

- **Email:** support@posty5.com
- **Documentation:** https://guide.posty5.com/
- **GitHub Issues:** https://github.com/posty5/n8n-nodes-posty5/issues

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Credits

Built with ❤️ by the Posty5 team

Powered by:

- [@posty5/core](https://www.npmjs.com/package/@posty5/core)
- [@posty5/qr-code](https://www.npmjs.com/package/@posty5/qr-code)
- [@posty5/short-link](https://www.npmjs.com/package/@posty5/short-link)
- [@posty5/html-hosting](https://www.npmjs.com/package/@posty5/html-hosting)
- [@posty5/social-publisher-workspace](https://www.npmjs.com/package/@posty5/social-publisher-workspace)
- [@posty5/social-publisher-post](https://www.npmjs.com/package/@posty5/social-publisher-post)
