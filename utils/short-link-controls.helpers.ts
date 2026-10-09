/**
 * Short link controls: the body keys built from the node's control fields, the
 * campaign bodies and the Campaign dropdown.
 *
 * Create sends only what the user filled in. Update and Set Rules send every
 * field the user added: an empty value clears it (the API merges `access` key
 * by key, and an absent section keeps the stored one).
 */

import { ILoadOptionsFunctions, INode, INodePropertyOptions, NodeOperationError } from 'n8n-workflow';
import { makeApiRequest } from './api.helpers';
import {
	API_ENDPOINTS,
	LINK_ACCESS_KEYS,
	LINK_UTM_KEYS,
	SHORT_LINK_CONTROLS,
	SHORT_LINK_CONTROLS_MESSAGES,
} from './constants';
import { hasField, toText } from './link-tool.helpers';
import type {
	ILinkCampaignBody,
	ILinkCampaignFields,
	ILinkCampaignLookupItem,
	IShortLinkAccess,
	IShortLinkControlBody,
	IShortLinkControlFields,
	IShortLinkPixel,
	IShortLinkUtm,
} from '../types/short-link-controls.types';

export type ControlsMode = 'create' | 'update';

/** A comma-separated list as trimmed, non-empty, unique items. */
export function splitList(value: unknown): string[] {
	const items = toText(value)
		.split(SHORT_LINK_CONTROLS.TAGS_SEPARATOR)
		.map((item) => item.trim())
		.filter(Boolean);
	return Array.from(new Set(items));
}

/** A `json` parameter as an array; anything else throws naming the field. */
export function parseJsonArray(node: INode, value: unknown, field: string, itemIndex: number): unknown[] {
	let parsed: unknown = value;
	if (typeof value === 'string') {
		const text = value.trim();
		if (!text) return [];
		try {
			parsed = JSON.parse(text);
		} catch {
			parsed = undefined;
		}
	}
	if (!Array.isArray(parsed)) {
		throw new NodeOperationError(node, SHORT_LINK_CONTROLS_MESSAGES.INVALID_JSON(field), { itemIndex });
	}
	return parsed;
}

/** The UTM values of a single-value fixedCollection; empty values are left out, or sent as null on update. */
export function buildUtm(values: IShortLinkUtm | undefined, mode: ControlsMode): IShortLinkUtm | null | undefined {
	if (!values) return undefined;
	const utm: IShortLinkUtm = {};
	for (const key of LINK_UTM_KEYS) {
		const text = toText(values[key]).trim();
		if (text) utm[key] = text;
		else if (mode === 'update' && hasField(values, key)) utm[key] = null;
	}
	if (!Object.keys(utm).length) return mode === 'update' ? null : undefined;
	return utm;
}

/** The `access` object; `removePassword` wins over a password. */
export function buildAccess(fields: IShortLinkControlFields, mode: ControlsMode): IShortLinkAccess | undefined {
	const access: IShortLinkAccess = {};
	for (const key of LINK_ACCESS_KEYS) {
		if (!hasField(fields, key)) continue;
		const raw = fields[key];
		if (key === 'maxVisits') {
			const visits = Number(raw);
			if (visits > 0) access.maxVisits = visits;
			else if (mode === 'update') access.maxVisits = null;
			continue;
		}
		const text = toText(raw).trim();
		if (text) access[key] = text;
		else if (mode === 'update') access[key] = null;
	}
	const password = toText(fields.password);
	if (fields.removePassword === true) access.password = null;
	else if (password) access.password = password;
	return Object.keys(access).length ? access : undefined;
}

/** The pixels of a multiple-value fixedCollection, the ones with an ID. */
export function buildPixels(fields: IShortLinkControlFields): IShortLinkPixel[] {
	return (fields.pixels?.pixel || [])
		.map((pixel) => ({ provider: pixel.provider, id: toText(pixel.id).trim() }))
		.filter((pixel) => pixel.provider && pixel.id);
}

/**
 * The control keys of a create / update / set-rules body.
 * @throws NodeOperationError when Routing Rules or Variants is not a JSON array.
 */
export function buildControlFields(
	node: INode,
	fields: IShortLinkControlFields,
	mode: ControlsMode,
	itemIndex: number,
): IShortLinkControlBody {
	const body: IShortLinkControlBody = {};

	if (hasField(fields, 'tags')) {
		const tags = splitList(fields.tags);
		if (tags.length || mode === 'update') body.tags = tags;
	}
	if (hasField(fields, 'campaignId')) {
		const campaignId = toText(fields.campaignId).trim();
		if (campaignId) body.campaignId = campaignId;
		else if (mode === 'update') body.campaignId = null;
	}

	const access = buildAccess(fields, mode);
	if (access) body.access = access;

	if (hasField(fields, 'utm')) {
		const utm = buildUtm(fields.utm?.values, mode);
		if (utm !== undefined) body.utm = utm;
	}

	for (const [field, key, label] of [
		['routingRules', 'routing', 'Routing Rules'],
		['variants', 'variants', 'Variants'],
	] as const) {
		if (!hasField(fields, field)) continue;
		const list = parseJsonArray(node, fields[field], label, itemIndex);
		if (list.length || mode === 'update') body[key] = list;
	}

	if (hasField(fields, 'pixels')) {
		const pixels = buildPixels(fields);
		if (pixels.length || mode === 'update') body.pixels = pixels;
	}
	if (typeof fields.pixelsConsentAcknowledged === 'boolean' && fields.pixelsConsentAcknowledged) {
		body.pixelsConsentAcknowledged = true;
	}
	if (typeof fields.healthMonitor === 'boolean') body.health = { enabled: fields.healthMonitor };

	return body;
}

/** A campaign create / update body; on update only the fields the user added. */
export function buildCampaignBody(name: string, fields: ILinkCampaignFields, mode: ControlsMode): ILinkCampaignBody {
	const body: ILinkCampaignBody = {};
	if (name) body.name = name;
	if (hasField(fields, 'description')) {
		const description = toText(fields.description).trim();
		if (description) body.description = description;
		else if (mode === 'update') body.description = null;
	}
	if (hasField(fields, 'color')) {
		if (fields.color) body.color = fields.color;
		else if (mode === 'update') body.color = null;
	}
	if (hasField(fields, 'utm')) {
		const utm = buildUtm(fields.utm?.values, mode);
		if (utm !== undefined) body.utm = utm;
	}
	if (typeof fields.archived === 'boolean') body.archived = fields.archived;
	return body;
}

/** The Campaign dropdown: the caller's campaigns that are not archived. */
export async function getCampaigns(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const credentials = await this.getCredentials('posty5Api');
	const page = (await makeApiRequest.call(this, credentials.apiKey as string, {
		method: 'GET',
		endpoint: API_ENDPOINTS.LINK_CAMPAIGN,
		qs: { archived: false, page: 1, pageSize: SHORT_LINK_CONTROLS.CAMPAIGN_LOOKUP_PAGE_SIZE },
	})) as { items?: ILinkCampaignLookupItem[] } | undefined;
	return (page?.items || []).map((campaign) => ({ name: campaign.name, value: campaign._id }));
}
