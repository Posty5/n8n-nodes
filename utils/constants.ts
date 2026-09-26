/**
 * Posty5 API Constants
 * Central location for all API-related constants
 */

export const POSTY5_API_BASE_URL = 'https://api.posty5.com';

export const API_ENDPOINTS = {
	SHORT_LINK: '/api/short-link',
	QR_CODE: '/api/qr-code',
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

export const API_TIMEOUTS = {
	DEFAULT: 30000, // 30 seconds
	UPLOAD: 120000, // 2 minutes for uploads
} as const;
