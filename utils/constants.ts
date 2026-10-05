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
