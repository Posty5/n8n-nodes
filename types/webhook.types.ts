/**
 * Posty5 webhooks as the trigger node sees them. Mirrors the API's
 * `shared-area/webhooks/interface.ts` and `@posty5/webhooks`.
 */

export type WebhookEventType =
	| 'short_link.visited'
	| 'short_link.visits_milestone'
	| 'qr_code.scanned'
	| 'qr_code.scans_milestone'
	| 'webhook.test';

export type WebhookDeliveryMode = 'each' | 'batch';

export interface IWebhookTargets {
	shortLinkIds?: string[];
	qrCodeIds?: string[];
}

export interface IWebhookDelivery {
	mode: WebhookDeliveryMode;
	windowSeconds?: number;
}

/** `POST /api/webhook-endpoints` body (the helper stamps `createdFrom`). */
export interface ICreateWebhookEndpointRequest {
	url: string;
	description?: string;
	events: WebhookEventType[];
	targets?: IWebhookTargets;
	includeBots: boolean;
	milestones?: number[];
	delivery: IWebhookDelivery;
}

/** The fields of a stored endpoint the trigger compares. */
export interface IWebhookEndpoint {
	_id: string;
	url: string;
	events: WebhookEventType[];
	targets?: IWebhookTargets;
	enabled: boolean;
	includeBots?: boolean;
	milestones?: number[];
	delivery?: IWebhookDelivery;
}

/** The create answer: the endpoint plus its signing secret, returned this once. */
export interface ICreateWebhookEndpointResponse {
	endpoint: IWebhookEndpoint;
	secret: string;
}

/** What the trigger keeps in the node's workflow static data. */
export interface IPosty5TriggerStaticData {
	endpointId?: string;
	secret?: string;
}

/** A delivered envelope (single event or batch). */
export interface IWebhookEnvelope {
	id: string;
	type: WebhookEventType | 'batch';
	apiVersion?: string;
	createdAt: string;
	data: Record<string, unknown> & { events?: IWebhookEnvelope[] };
}

/** The node's *Options* collection. */
export interface IPosty5TriggerOptions {
	includeBots?: boolean;
	milestones?: string;
	delivery?: string;
	splitBatches?: boolean;
}

/** Why a delivery was refused (same reasons as `@posty5/webhooks`). */
export type WebhookVerifyFailure = 'missingHeaders' | 'timestampOutOfRange' | 'noMatchingSignature' | 'invalidJson';

export type WebhookHeaders = Record<string, string | string[] | undefined>;
