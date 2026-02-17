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
3. (Optional) Set custom base URL (default: `https://api.posty5.com`)

## 📋 Available Nodes

### 1. Posty5 Short Link

Create and manage shortened URLs with analytics.

**Operations:**

- Create - Generate short links with custom slugs
- Get - Retrieve link details
- List - List all links with filters
- Update - Modify existing links
- Delete - Remove links

**Use Cases:**

- Generate tracking links for marketing campaigns
- Create QR-friendly short URLs
- Monitor click analytics

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

- Create - Generate new QR codes
- Get - Retrieve QR code details
- List - List all QR codes
- Update - Modify QR code content
- Delete - Remove QR codes

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

Publish videos to multiple social media platforms.

**Supported Platforms:**

- YouTube
- TikTok
- Facebook
- Instagram

**Operations:**

- Publish Video - Upload and schedule posts
- Get Post Status - Check publishing progress
- List Posts - View all posts
- Get Default Settings - Retrieve platform defaults

**Video Sources:**

- Binary data (file upload)
- Direct video URL
- Facebook video URL (repost)
- TikTok video URL (repost)
- YouTube Shorts URL (repost)

**Platform-Specific Settings:**

- **YouTube:** Title, description, tags, made for kids
- **TikTok:** Caption, privacy level, disable duet/stitch/comments
- **Facebook:** Title, description
- **Instagram:** Description, share to feed

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
- **404 Not Found** - Resource doesn't exist
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
