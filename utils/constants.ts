/**
 * Posty5 API Constants
 * Central location for all API-related constants
 */

import { version as packageVersion } from '../package.json';

export const POSTY5_API_BASE_URL = 'https://api.posty5.com';

/**
 * `X-Posty5-Client`, sent on every request this package makes to the API (the
 * mcp-server headers contract: `posty5-n8n/<version>`; the API logs it and never
 * trusts it). The version is package.json's, compiled in by tsc through
 * `resolveJsonModule`, so a release bump cannot leave a stale copy here.
 */
export const Posty5ClientConst = {
	HEADER: 'X-Posty5-Client',
	VALUE: `posty5-n8n/${packageVersion}`,
} as const;

/**
 * The credential's Test button (`GET /api/api-key/current`). A wrong or revoked
 * key answers 401; a 200 has to name the key at `KEY_ID_PATH`, so a 200 from
 * anything else is not a pass.
 */
export const CredentialTestConst = {
	INVALID_KEY_STATUS: 401,
	INVALID_KEY_MESSAGE: 'Invalid or revoked API key',
	KEY_ID_PATH: 'result.apiKey._id',
	NO_KEY_ID_MESSAGE: 'The Posty5 API did not identify this API key',
} as const;

export const API_ENDPOINTS = {
	API_KEY_CURRENT: '/api/api-key/current',
	SHORT_LINK: '/api/short-link',
	LINK_CAMPAIGN: '/api/link-campaign',
	QR_CODE: '/api/qr-code',
	QR_CODE_TEMPLATE: '/api/qr-code-template',
	HTML_HOSTING: '/api/html-hosting',
	FORM_SUBMISSION: '/api/html-hosting-form-submission',
	SOCIAL_PUBLISHER_WORKSPACE: '/api/social-publisher-workspace',
	SOCIAL_PUBLISHER_POST: '/api/social-publisher-post',
	WEBHOOK_ENDPOINTS: '/api/webhook-endpoints',
} as const;

/** Errors `encodePathSegment` raises before any request. */
export const PATH_SEGMENT_MESSAGES = {
	DOT_SEGMENT: (value: string) => `"${value}" is not a valid ID`,
} as const;

export const DEFAULT_PAGINATION = {
	page: 1,
	pageSize: 50,
} as const;

/**
 * The Template dropdown on the Short Link and QR Code nodes. It reads the
 * caller's own templates (`GET /api/qr-code-template/user-lookup`, accepts the
 * API key) and the public ones (`/public-lookup`, no auth). Both lists are
 * cursor-paged; one page of `PAGE_SIZE` each fills the dropdown, and a template
 * beyond it can still be entered by ID as an expression.
 */
export const QR_TEMPLATE_LOOKUP = {
	USER_PATH: '/user-lookup',
	PUBLIC_PATH: '/public-lookup',
	PAGE_SIZE: 100,
	/** Shown under each option so the user can tell the two lists apart. */
	USER_LABEL: 'My template',
	PUBLIC_LABEL: 'Public template',
} as const;

/**
 * QR Code *Render*, *Check Scannability* and *List Templates* (QR design and
 * export, K6): `GET /api/qr-code/:id/render`, `POST /api/qr-code/scannability-check`,
 * the two template lookups, and the print presets of
 * `GET /api/qr-code-template/design-catalogue`. Values mirror the API's schemas.
 * SVG, PDF, a preset, a DPI or a PNG over 2048 px need a paid plan; the API's
 * 403 text is shown unchanged.
 */
export const QR_RENDER = {
	RENDER_PATH_SEGMENT: 'render',
	SCANNABILITY_PATH: '/scannability-check',
	CATALOGUE_PATH: '/design-catalogue',
	FORMATS: ['png', 'svg', 'pdf'] as const,
	DEFAULT_FORMAT: 'png',
	/** The API's MIME type per format, used when the answer carries none. */
	MIME_TYPES: {
		png: 'image/png',
		svg: 'image/svg+xml',
		pdf: 'application/pdf',
	} as Record<string, string>,
	DPI_VALUES: [150, 300, 600] as const,
	DEFAULT_DPI: 300,
	/** `presetId` value that takes a width in mm (`customMm`). */
	CUSTOM_PRESET_ID: 'custom',
	CUSTOM_MM_MIN: 20,
	CUSTOM_MM_MAX: 500,
	DEFAULT_CUSTOM_MM: 50,
	SIZE_PX_MIN: 64,
	SIZE_PX_MAX: 6000,
	DEFAULT_SIZE_PX: 1024,
	DEFAULT_BINARY_PROPERTY: 'data',
	/** Any value: the API answers an attachment named `<name>-<preset|size>.<ext>`. */
	DOWNLOAD_FLAG: '1',
	/** File name when the answer has no `Content-Disposition`: `qr-code-<id>.<ext>`. */
	FALLBACK_FILE_NAME_PREFIX: 'qr-code-',
	/** The "no preset" option of the Print Preset dropdown. */
	NO_PRESET_LABEL: 'None (Size in Pixels)',
	LIST_TEMPLATES_DEFAULT_LIMIT: 50,
	LIST_TEMPLATES_MAX_LIMIT: 100,
} as const;

/** Errors the QR render operations raise before any request. */
export const QR_RENDER_MESSAGES = {
	unknownFormat: (format: string) => `Unknown format "${format}". Use png, svg or pdf.`,
	idRequired: (what: string) => `${what} is required`,
} as const;

/**
 * The QR types the API validates (`/api/qr-code/:type`). The node's QR Type
 * values are these, and `qrCodeTarget.type` is always one of them.
 */
export const QR_CODE_TYPES = [
	'url',
	'freeText',
	'email',
	'wifi',
	'call',
	'sms',
	'geolocation',
	'vcard',
	'event',
	'whatsapp',
	'review',
	'social',
	'appStore',
	'file',
] as const;

/** WiFi authentication values: the node's default, and the one that means "open network" (no password is sent). */
export const QR_WIFI_AUTH = {
	DEFAULT: 'WPA',
	OPEN_NETWORK: 'nopass',
} as const;

/** The Short Link fields that set a device's destination by hand (S13). */
export const SHORT_LINK_DEEP_LINK_FIELDS = ['androidUrl', 'iosUrl'] as const;

/** Errors the Short Link and QR Code nodes raise before calling the API. */
export const LINK_TOOL_MESSAGES = {
	TEMPLATE_REQUIRED:
		'Template is required: pick one in the Template field. The Posty5 API refuses a create or update made with an API key without it.',
} as const;

/**
 * *Get Analytics* on the Short Link and QR Code nodes:
 * `GET <SHORT_LINK|QR_CODE>/:id/analytics` (contract C2). The breakdown names,
 * intervals, the `all` value and the limit bounds mirror the API's query schema.
 */
export const LINK_ANALYTICS = {
	/** Path segment after `/:id`. */
	PATH_SEGMENT: 'analytics',
	/** `breakdown` value asking for every breakdown the owner's plan allows. */
	ALL_BREAKDOWNS: 'all',
	/** Separator of an explicit `breakdown` list. */
	BREAKDOWN_SEPARATOR: ',',
	/** Days of each preset range, today included. */
	RANGE_DAYS: {
		last7Days: 7,
		last30Days: 30,
		last90Days: 90,
	},
	/** The Range a new node starts with: the API's own default span. */
	DEFAULT_RANGE: 'last30Days',
	DEFAULT_INTERVAL: 'day',
	/** The Output a new node starts with: the API answer, unchanged. */
	DEFAULT_OUTPUT: 'response',
	/** Rows per breakdown: the API's default and maximum. */
	LIMIT_DEFAULT: 10,
	LIMIT_MIN: 1,
	LIMIT_MAX: 50,
	/** The status the API answers for a breakdown or a range the owner's plan does not include. */
	PLAN_GATE_HTTP_CODE: '403',
	/** The zone used when neither the Time Zone option nor the workflow names one. */
	FALLBACK_TIME_ZONE: 'UTC',
} as const;

/**
 * *Get Statistics* on the Short Link and QR Code nodes: account-wide counts
 * over the caller's records, `GET <SHORT_LINK|QR_CODE>/statistics`. The periods
 * are the API's own `period` values; days are UTC days on the server.
 */
export const LINK_STATISTICS = {
	PATH_SEGMENT: 'statistics',
	/** The API's default period. */
	DEFAULT_PERIOD: '30d',
	CUSTOM_PERIOD: 'custom',
} as const;

/** Errors *Get Analytics* and *Get Statistics* raise before calling the API. */
export const LINK_ANALYTICS_MESSAGES = {
	ID_REQUIRED: 'The ID is required to read analytics.',
	CUSTOM_RANGE_REQUIRED: 'A Custom range needs both From and To dates.',
	INVALID_DATE: 'is not a date. Use a date such as 2026-10-01.',
	UNKNOWN_TIME_ZONE:
		'is not a known time zone. Use an IANA name such as Africa/Cairo in the Time Zone option or in the workflow settings.',
} as const;

/** `YYYY-MM-DD` at the start of a date string (the day an n8n `dateTime` value names). */
export const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}/;

/** Milliseconds in one calendar day (day keys are shifted on UTC midnights, so no DST applies). */
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * *Create Many* on the Short Link and QR Code nodes: `POST <SHORT_LINK|QR_CODE>/bulk`
 * (link-qr-bulk-and-webhooks contract). Rows are sent in chunks of at most
 * `MAX_BATCH_SIZE`; each chunk carries `Idempotency-Key:
 * n8n-<executionId>-<nodeName>-<chunk>`, so retrying the same execution is
 * charged once while a new run is not deduped.
 */
export const LINK_BULK = {
	PATH_SEGMENT: 'bulk',
	MAX_BATCH_SIZE: 100,
	DEFAULT_BATCH_SIZE: 100,
	IDEMPOTENCY_HEADER: 'Idempotency-Key',
	IDEMPOTENCY_PREFIX: 'n8n',
	ROW_STATUS_CREATED: 'created',
	ROW_STATUS_FAILED: 'failed',
} as const;

/** Errors *Create Many* raises. */
export const LINK_BULK_MESSAGES = {
	TEMPLATE_REQUIRED:
		'Template is required: pick one in the Template field or set Defaults > Template ID. The Posty5 API refuses a create made with an API key without it.',
	ROW_FAILED: 'Posty5 refused a row of Create Many',
	MISSING_ROW_RESULT: 'The Posty5 API returned no result for this row',
} as const;

export const API_TIMEOUTS = {
	DEFAULT: 30000, // 30 seconds
	UPLOAD: 120000, // 2 minutes for uploads
} as const;

/**
 * Short link controls (short-link-controls): sub-paths under `/api/short-link`,
 * the enums the API's Joi schemas accept, and the node's own messages.
 */
export const SHORT_LINK_CONTROLS = {
	TAGS_PATH: '/tags',
	HEALTH_CHECK_PATH: '/health-check',
	/** `?tags=a,b` and the Tags field are split on this. */
	TAGS_SEPARATOR: ',',
	/** `GET /api/link-campaign` page size for the Campaign dropdown. */
	CAMPAIGN_LOOKUP_PAGE_SIZE: 100,
	/** Answer of Check Health (the API answers 202 with no body). */
	HEALTH_CHECK_QUEUED: { queued: true },
} as const;

/** Retargeting pixel providers (`pixelsJoi`). */
export const LINK_PIXEL_PROVIDERS = ['meta', 'googleAds', 'tiktok', 'linkedin', 'x', 'pinterest'] as const;

/** Campaign colours (`LINK_CAMPAIGN_COLORS`). */
export const LINK_CAMPAIGN_COLORS = [
	'slate', 'red', 'orange', 'amber', 'green', 'teal', 'blue', 'indigo', 'purple', 'pink',
] as const;

/** Routing rule condition values (documented in the Routing Rules field). */
export const LINK_ROUTING_DEVICES = ['tablet', 'mobile', 'desktop', 'other'] as const;
export const LINK_ROUTING_OS = ['android', 'ios', 'windows', 'macos', 'linux'] as const;

/** The UTM keys a link or a campaign carries. */
export const LINK_UTM_KEYS = ['source', 'medium', 'campaign', 'term', 'content'] as const;

/** The access keys of a link (`password` and `removePassword` handled apart). */
export const LINK_ACCESS_KEYS = ['activeFrom', 'expiresAt', 'maxVisits', 'fallbackUrl'] as const;

export const SHORT_LINK_CONTROLS_MESSAGES = {
	INVALID_JSON: (field: string) => `${field} must be a JSON array, e.g. [] or [{ ... }]`,
	CAMPAIGN_NAME_REQUIRED: 'Campaign Name is required',
	ID_REQUIRED: (field: string) => `${field} is required`,
} as const;

/**
 * Optimistic concurrency (optimistic-concurrency feature, D-5/D-6/D-18). v2 of
 * the nodes with update/delete operations sends the Version field as
 * `If-Match`; v1 keeps last-write-wins by reading the item's `__v` first.
 */
export const VERSIONED_WRITES = {
	IF_MATCH_HEADER: 'If-Match',
	CONFLICT_CODE: 'VERSION_CONFLICT',
	/** The node version that carries the Version field. */
	FIRST_VERSIONED_NODE_VERSION: 2,
	VERSION_PARAMETER: 'expectedVersion',
	OPTIONS_PARAMETER: 'versionOptions',
	/** The v1-only legacy notice (display only, no value). */
	V1_NOTICE_PARAMETER: 'legacyVersionNotice',
	ON_UNKNOWN_FAIL: 'fail',
	ON_UNKNOWN_USE_LATEST: 'useLatest',
	DEFAULT_VERSION_EXPRESSION: '={{ $json.__v }}',
	CONFLICT_MESSAGE: (currentVersion?: number) =>
		`The item changed since it was read${typeof currentVersion === 'number' ? ` (current version ${currentVersion})` : ''}. Get it again, then update.`,
	UNKNOWN_VERSION_MESSAGE:
		'Version is required: map the __v of a Get step, or set Version Options > On Unknown Version to Use Latest (Overwrite).',
	V1_DEPRECATION_NOTE:
		'Version 1 of this node is legacy: its update and delete operations read the item first and overwrite it (last write wins). Add the node again to get version 2, which fails on a conflict instead.',
} as const;
