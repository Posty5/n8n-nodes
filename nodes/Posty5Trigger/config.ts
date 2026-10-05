/**
 * Posty5 Trigger configuration. The event list is static on purpose: n8n loads
 * node descriptions without credentials, so it cannot read
 * `GET /api/webhook-endpoints/event-types`. Add an event here when the API adds one.
 */

import type { INodePropertyOptions } from 'n8n-workflow';

/** Standard Webhooks, as `@posty5/webhooks` verifies them. */
export const TRIGGER_SIGNATURE = {
	TOLERANCE_SECONDS: 300,
	HEADER_ID: 'webhook-id',
	HEADER_TIMESTAMP: 'webhook-timestamp',
	HEADER_SIGNATURE: 'webhook-signature',
	SECRET_PREFIX: 'whsec_',
	VERSION: 'v1',
} as const;

export const TRIGGER_CONFIG = {
	WEBHOOK_NAME: 'default',
	WEBHOOK_PATH: 'webhook',
	DESCRIPTION_PREFIX: 'n8n:',
	TEST_EVENT: 'webhook.test',
	BATCH_EVENT: 'batch',
	MAX_MILESTONES: 10,
	MILESTONE_SEPARATOR: ',',
	ID_SEPARATOR: ',',
	NOT_FOUND_HTTP_CODE: '404',
	INVALID_URL_HTTP_CODE: '400',
	PLAN_GATE_HTTP_CODE: '403',
	UNAUTHORIZED_STATUS: 401,
} as const;

/** *Links* values. */
export const TRIGGER_TARGETS = {
	ALL: 'all',
	SHORT_LINKS: 'shortLinks',
	QR_CODES: 'qrCodes',
} as const;

/** *Delivery* values → the endpoint's `delivery`. */
export const TRIGGER_DELIVERY: Record<string, { mode: 'each' | 'batch'; windowSeconds?: number }> = {
	each: { mode: 'each' },
	batch60: { mode: 'batch', windowSeconds: 60 },
	batch300: { mode: 'batch', windowSeconds: 300 },
	batch3600: { mode: 'batch', windowSeconds: 3600 },
};

export const TRIGGER_EVENT_OPTIONS: INodePropertyOptions[] = [
	{
		name: 'QR Code Scan Milestone',
		value: 'qr_code.scans_milestone',
		description: 'A dynamic QR code reached one of the Milestones values',
	},
	{
		name: 'QR Code Scanned',
		value: 'qr_code.scanned',
		description:
			'A dynamic QR code was scanned. Static QR codes never produce events (the image holds the content itself).',
	},
	{
		name: 'Short Link Visit Milestone',
		value: 'short_link.visits_milestone',
		description: 'A short link reached one of the Milestones values',
	},
	{
		name: 'Short Link Visited',
		value: 'short_link.visited',
		description: 'A short link was opened, including a scan of its QR image (channel "qr")',
	},
];

export const TRIGGER_MESSAGES = {
	PUBLIC_HTTPS_REQUIRED:
		'Posty5 refused the n8n webhook URL. It must be a public HTTPS address: use n8n Cloud, or set WEBHOOK_URL on your self-hosted n8n to a public HTTPS address (or a tunnel).',
	PLAN_REQUIRED: 'Your Posty5 plan does not include webhooks for these events',
	INVALID_MILESTONES: 'Milestones must be up to 10 positive whole numbers separated by commas, such as 100,1000',
	NO_WEBHOOK_URL: 'n8n has no webhook URL for this node',
	SIGNATURE_REJECTED: 'Invalid Posty5 webhook signature',
} as const;
