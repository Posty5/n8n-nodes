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
	SOCIAL_PUBLISHER_TASK: '/api/social-publisher-task',
} as const;

export const DEFAULT_PAGINATION = {
	page: 1,
	pageSize: 50,
} as const;

export const API_TIMEOUTS = {
	DEFAULT: 30000, // 30 seconds
	UPLOAD: 120000, // 2 minutes for uploads
} as const;
