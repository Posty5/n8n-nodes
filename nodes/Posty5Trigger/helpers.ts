/**
 * Posty5 Trigger helpers: the endpoint body, the "is the stored endpoint still
 * ours" check, Standard Webhooks verification (the same algorithm as
 * `@posty5/webhooks` `verifyWebhookSignature`, kept in-node because the
 * package has no runtime dependencies) and envelope → items.
 */

import { createHmac, timingSafeEqual } from 'crypto';
import type { IDataObject, INodeExecutionData } from 'n8n-workflow';
import { TRIGGER_CONFIG, TRIGGER_DELIVERY, TRIGGER_MESSAGES, TRIGGER_SIGNATURE, TRIGGER_TARGETS } from './config';
import type {
	ICreateWebhookEndpointRequest,
	IPosty5TriggerOptions,
	IWebhookEndpoint,
	IWebhookEnvelope,
	IWebhookTargets,
	WebhookEventType,
	WebhookHeaders,
	WebhookVerifyFailure,
} from '../../types/webhook.types';

/** A comma-separated id list, trimmed, empties dropped. */
export function splitIds(value: unknown): string[] {
	return String(value ?? '')
		.split(TRIGGER_CONFIG.ID_SEPARATOR)
		.map((id) => id.trim())
		.filter(Boolean);
}

/** *Links* as the endpoint's `targets`; undefined = all of the caller's links and QR codes. */
export function buildTargets(links: string, ids: unknown): IWebhookTargets | undefined {
	if (links === TRIGGER_TARGETS.SHORT_LINKS) return { shortLinkIds: splitIds(ids) };
	if (links === TRIGGER_TARGETS.QR_CODES) return { qrCodeIds: splitIds(ids) };
	return undefined;
}

/** *Milestones* (`100,1000`) as numbers; throws on anything but up to 10 positive integers. */
export function parseMilestones(value: unknown): number[] | undefined {
	const parts = splitIds(value);
	if (!parts.length) return undefined;
	const numbers = parts.map(Number);
	if (numbers.length > TRIGGER_CONFIG.MAX_MILESTONES || numbers.some((n) => !Number.isInteger(n) || n < 1)) {
		throw new Error(TRIGGER_MESSAGES.INVALID_MILESTONES);
	}
	return numbers;
}

/** The `POST /api/webhook-endpoints` body for this node. */
export function buildEndpointBody(
	url: string,
	events: WebhookEventType[],
	targets: IWebhookTargets | undefined,
	options: IPosty5TriggerOptions,
	description: string,
): ICreateWebhookEndpointRequest {
	const body: ICreateWebhookEndpointRequest = {
		url,
		events,
		includeBots: options.includeBots === true,
		delivery: TRIGGER_DELIVERY[options.delivery || 'each'] || TRIGGER_DELIVERY.each,
		description,
	};
	if (targets) body.targets = targets;
	const milestones = parseMilestones(options.milestones);
	if (milestones) body.milestones = milestones;
	return body;
}

/** Same members, any order. */
function sameSet(a: string[] = [], b: string[] = []): boolean {
	if (a.length !== b.length) return false;
	const set = new Set(a);
	return b.every((value) => set.has(value));
}

/** Whether the stored endpoint is enabled and still points at this URL with these events and targets. */
export function endpointMatches(
	endpoint: IWebhookEndpoint,
	url: string,
	events: WebhookEventType[],
	targets: IWebhookTargets | undefined,
): boolean {
	return (
		endpoint.enabled !== false &&
		endpoint.url === url &&
		sameSet(endpoint.events, events) &&
		sameSet(endpoint.targets?.shortLinkIds, targets?.shortLinkIds) &&
		sameSet(endpoint.targets?.qrCodeIds, targets?.qrCodeIds)
	);
}

/** A header's value, case-insensitive; the first of a repeated header. */
export function readHeader(headers: WebhookHeaders, name: string): string | undefined {
	for (const [key, value] of Object.entries(headers || {})) {
		if (key.toLowerCase() === name) return Array.isArray(value) ? value[0] : value;
	}
	return undefined;
}

/** base64 HMAC-SHA256 of `<id>.<timestamp>.<payload>` with the base64 key after `whsec_`. */
export function signPayload(secret: string, id: string, timestamp: string, payload: Buffer | string): string {
	const encoded = secret.startsWith(TRIGGER_SIGNATURE.SECRET_PREFIX)
		? secret.slice(TRIGGER_SIGNATURE.SECRET_PREFIX.length)
		: secret;
	const text = typeof payload === 'string' ? payload : payload.toString('utf8');
	return createHmac('sha256', Buffer.from(encoded, 'base64')).update(`${id}.${timestamp}.${text}`).digest('base64');
}

/** Constant-time match of any `v1,<sig>` entry (two during a secret rotation). */
function anySignatureMatches(header: string, expected: string): boolean {
	const wanted = Buffer.from(expected);
	return header.split(' ').some((entry) => {
		const comma = entry.indexOf(',');
		if (comma < 0 || entry.slice(0, comma) !== TRIGGER_SIGNATURE.VERSION) return false;
		const received = Buffer.from(entry.slice(comma + 1));
		return received.length === wanted.length && timingSafeEqual(received, wanted);
	});
}

/**
 * Verify a delivery and parse it. Answers the envelope, or the failure reason.
 * `payload` must be the raw body: a re-serialised object does not match.
 */
export function verifySignature(
	payload: Buffer | string | undefined,
	headers: WebhookHeaders,
	secret: string | undefined,
	nowSeconds: number = Math.floor(Date.now() / 1000),
): { event: IWebhookEnvelope } | { failure: WebhookVerifyFailure } {
	const id = readHeader(headers, TRIGGER_SIGNATURE.HEADER_ID);
	const timestamp = readHeader(headers, TRIGGER_SIGNATURE.HEADER_TIMESTAMP);
	const signature = readHeader(headers, TRIGGER_SIGNATURE.HEADER_SIGNATURE);
	if (!id || !timestamp || !signature || !secret || payload === undefined) return { failure: 'missingHeaders' };

	const sentAt = Number(timestamp);
	if (!Number.isFinite(sentAt) || Math.abs(nowSeconds - sentAt) > TRIGGER_SIGNATURE.TOLERANCE_SECONDS) {
		return { failure: 'timestampOutOfRange' };
	}
	if (!anySignatureMatches(signature, signPayload(secret, id, timestamp, payload))) {
		return { failure: 'noMatchingSignature' };
	}
	try {
		const text = typeof payload === 'string' ? payload : payload.toString('utf8');
		return { event: JSON.parse(text) as IWebhookEnvelope };
	} catch {
		return { failure: 'invalidJson' };
	}
}

/** The envelope as output items: a batch is split into one item per event unless *Split Batches* is off. */
export function toItems(event: IWebhookEnvelope, webhookId: string | undefined, splitBatches: boolean): INodeExecutionData[] {
	const withId = (envelope: IWebhookEnvelope): INodeExecutionData => ({
		json: { ...envelope, webhookId } as unknown as IDataObject,
	});
	if (event.type === TRIGGER_CONFIG.BATCH_EVENT && splitBatches) {
		return (event.data.events || []).map(withId);
	}
	return [withId(event)];
}
