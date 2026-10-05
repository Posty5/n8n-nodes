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
| List | Filters: Search (name), Destination URL Contains, Tag, Reference ID, Landing Page Enabled. |
| Update | Reads the link, then saves it with your changes on top: anything you leave alone keeps its stored value. Template may stay empty to keep the current one. Destination URL is under Additional Fields. The Custom Slug cannot be changed. |
| Delete | Remove links. |

**Template** is a dropdown of your QR code templates and the public ones; the
Posty5 API requires one on every API-key create and update. On Update, a Tag,
Reference ID, Android URL or iOS URL you add but leave empty clears it.

**Use Cases:**

- Generate tracking links for marketing campaigns
- Create QR-friendly short URLs
- Send app users to the app (Android/iOS URLs) and everyone else to the web page

### 2. Posty5 QR Code

Generate QR codes for 7 different types.

**QR Types:**

- URL - Link to websites
- Free Text - Plain text content
- Email - mailto: links with subject/body
- WiFi - Network credentials
- Phone Call - tel: links
- SMS - Pre-filled text messages
- Geolocation - GPS coordinates

**Operations:**

| Operation | What it sends |
| --- | --- |
| Create | QR Type, its content fields and **Template** (required), plus Name and Additional Fields: Tag, Reference ID, Landing Page with its Page Title and Page Description. |
| Get | Retrieve QR code details. |
| Get Analytics | Scans, unique visitors and bot visits over a range, a series and breakdowns, as on the Short Link node. See [Get Analytics](#get-analytics-short-link-and-qr-code). |
| Get Statistics | Counts over all your QR codes, as on the Short Link node (top list `topQRCodes`). See [Get Statistics](#get-statistics-short-link-and-qr-code). |
| List | Filters: Search (name), Tag, Reference ID. |
| Update | Reads the QR code, then saves the content you enter with everything else kept. Template may stay empty to keep the current one. |
| Delete | Remove QR codes. |

The design comes from the template, and Posty5 builds the encoded text from the
content fields: the node sends the content as `qrCodeTarget` and nothing else.

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
- List - List all pages
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
- List Posts - View all posts
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

### 8. Posty5 Store

Dropshipping with a Posty5 store: watch the orders sent to suppliers, act on a
paused one, import supplier products and follow each part of an order.

**Resources and operations:**

- **Supplier** — Get Catalogue, Get Many (connections), Test, Get Balance
- **Supplier Product** — Get Many (browse), Get, Resolve URL, Preview Import, Import, Get Import Status
- **Product Link** — Get Many, Sync
- **Supplier Order** — Get Many (Return All or Limit; filters Needs Review, Status, Order ID, Supplier Connection ID, Cursor), Get, Retry (option Accept New Cost), Pay, Cancel
- **Fulfilment Group** (an order part, addressed by order ID + part key) — Submit (option Pay Now), Fulfil Manually
- **Order** — Get (option **Split Parts**: one item per part, with its supplier order), Get Many (filter Needs Attention)

**Use Cases:**

- Alert a channel when a supplier order needs attention, and retry it automatically when the cause is fixable
- Import supplier products from a spreadsheet of product IDs
- Push tracking numbers of shipped parts to a sheet or a customer message

> **No trigger.** The API does not push supplier-order events to merchants, so a
> trigger would only poll. Use a **Schedule Trigger** with **Supplier Order → Get
> Many** (Example 5) — every 15 minutes matches how often Posty5 itself checks
> suppliers for updates.
>
> **What the node will not do:** connect a supplier, change its credentials or
> automation, or build a product link. Those stay in the store's control panel —
> a supplier credential in a node parameter would sit in plain text in the
> workflow JSON.

**Money and permissions:** **Pay** and **Submit → Pay Now** spend the merchant's
balance at the supplier and need `suppliers.orders.manage`. A second **Submit**
finds the first supplier order instead of creating another; **Pay** on an order
already paid at the supplier records it and does not pay again. **Import** is
charged like adding products; nothing else here is charged. **Retry**, **Pay** and
**Submit** answer a paused outcome as an error — use *Continue On Fail* to keep
the reason in the item.

**Pagination:** each **Get Many** outputs one item per row. **Supplier Product
→ Get Many** (the supplier's catalogue) takes **Page** and **Limit**.
**Supplier Order → Get Many** and **Order → Get Many** page by cursor: they take
a **Limit** (sent as `pageSize`) and a **Cursor** filter, and put `nextCursor`
on the last row they return, so the next run can continue from it. **Supplier
Order → Get Many** also has **Return All**, which follows `nextCursor` 100 rows
at a time until the API says there is no more (`hasMore` false).

**Errors:** **Product Link → Sync** runs at most once a minute per link; a second
run inside that minute fails with `Posty5 API Error: This product was synced a
moment ago…` (an HTTP 400, not a 429) — wait a minute and run again. A 403 on
**Pay** or **Submit → Pay Now** means the API key lacks
`suppliers.orders.manage`; elsewhere, check that the store's plan includes
dropshipping. **Supplier Product → Get Many** takes at most 48 rows a page and
**Supplier Order → Get Many** at most 100; the API refuses a larger Limit.

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
Send Email (with QR code)
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

### Example 5: Needs-Attention Alerts

Hear about a paused supplier order, and retry the fixable ones:

```
Schedule Trigger (every 15 minutes)
  ↓
Posty5 Store (Supplier Order → Get Many, Needs Review = true)
  ↓
Filter (updatedAt within the last 15 minutes)
  ↓
Slack (order number, reviewReason, reviewMessage)
  ↓
IF (reviewReason = connectionUnhealthy)
  ↓
Posty5 Store (Supplier Order → Retry)
```

### Example 6: Import From a Spreadsheet

```
Google Sheets (rows of supplier product IDs)
  ↓
Posty5 Store (Supplier Product → Preview Import)
  ↓
IF (no row has duplicateOf)
  ↓
Posty5 Store (Supplier Product → Import)
  ↓
IF (jobId is set) → Wait → Posty5 Store (Supplier Product → Get Import Status)
  ↓
Email (rows with state = failed)
```

### Example 7: Weekly Top Countries to Slack

```
Schedule Trigger (every Monday)
  ↓
Posty5 Short Link (Get Analytics: Last 7 Days, Breakdowns = Country, Breakdown Rows = 5)
  ↓
Slack (post totals.visits and breakdowns.country)
```

### Example 8: Tracking Updates Per Part

```
Schedule Trigger (hourly)
  ↓
Posty5 Store (Order → Get Many, Status = processing)
  ↓
Posty5 Store (Order → Get, Split Parts = true)
  ↓
IF (status = shipped and shipment.trackingNumber is set)
  ↓
Google Sheets (append order number, part label, tracking number)
```

A supplier order carries the delivery address only when the API key's owner may
see customer data. Forwarding the output to a third-party channel forwards it too.

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
