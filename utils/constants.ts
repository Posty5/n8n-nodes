/**
 * Posty5 API Constants
 * Central location for all API-related constants
 */

export const POSTY5_API_BASE_URL = 'https://api.posty5.com';

export const API_ENDPOINTS = {
	SHORT_LINK: '/api/short-link',
	QR_CODE: '/api/qr-code',
	QR_CODE_TEMPLATE: '/api/qr-code-template',
	HTML_HOSTING: '/api/html-hosting',
	FORM_SUBMISSION: '/api/html-hosting-form-submission',
	SOCIAL_PUBLISHER_WORKSPACE: '/api/social-publisher-workspace',
	SOCIAL_PUBLISHER_POST: '/api/social-publisher-post',
	STORE_SUPPLIERS: '/api/store-suppliers',
	STORE_ORDERS: '/api/store-orders',
} as const;

export const DEFAULT_PAGINATION = {
	page: 1,
	pageSize: 50,
} as const;

/**
 * Page sizes the `/api/store-suppliers` list routes accept. They mirror the api's
 * Joi schemas (`suppliers/schema.ts`): a larger `pageSize` is refused with a 400,
 * not clamped, so the node's Limit fields are capped at the same values.
 */
export const STORE_SUPPLIER_PAGE_SIZES = {
	/** Catalogue browse (`GET /:storeId/:id/products`) — the api's `CATALOGUE_MAX_PAGE_SIZE`. */
	CATALOGUE_MAX: 48,
	/** Supplier order queue (`GET /:storeId/orders`). */
	SUPPLIER_ORDERS_MAX: 100,
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
 * The QR types the API validates (`/api/qr-code/:type`). The node's QR Type
 * values are these, and `qrCodeTarget.type` is always one of them.
 */
export const QR_CODE_TYPES = ['url', 'freeText', 'email', 'wifi', 'call', 'sms', 'geolocation'] as const;

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

export const API_TIMEOUTS = {
	DEFAULT: 30000, // 30 seconds
	UPLOAD: 120000, // 2 minutes for uploads
} as const;
