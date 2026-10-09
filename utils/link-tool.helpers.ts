/**
 * Body pieces the Short Link and QR Code nodes build the same way.
 *
 * Create sends only what the user filled in. Update is fetch-then-put: both
 * `PUT` routes replace the record with the body they get, so the node reads the
 * stored record first and sends it back with the user's fields on top. A field
 * the user did not touch therefore keeps its stored value.
 */

import { SHORT_LINK_DEEP_LINK_FIELDS } from './constants';
import type {
	ILinkToolAdditionalFields,
	ILinkToolCommonBody,
	ILinkToolPageInfo,
	ILinkToolStoredFields,
	ILinkToolStoredPageInfo,
} from '../types/common';
import type { IShortLinkAdditionalFields, IShortLinkDeepLinks } from '../types/short-link.types';

/**
 * A parameter value as the string the API expects (`''` for nothing). An n8n
 * expression can hand over a number, e.g. a phone number read from a sheet.
 */
export function toText(value: unknown): string {
	if (value === undefined || value === null) return '';
	return typeof value === 'string' ? value : String(value);
}

/** The first value that is a non-empty string once trimmed, trimmed; or undefined. */
export function firstText(...values: unknown[]): string | undefined {
	for (const value of values) {
		const text = toText(value).trim();
		if (text) return text;
	}
	return undefined;
}

/** Whether the user added this field to the collection (the key is present, even with an empty value). */
export function hasField(fields: object, key: string): boolean {
	return Object.prototype.hasOwnProperty.call(fields, key);
}

/**
 * The page info to send: the user's title and description over the stored ones.
 * An empty value never overrides a stored one. Only the keys both write schemas
 * accept are sent: the stored `image` is read-only and would be refused.
 */
export function buildPageInfo(
	fields: ILinkToolAdditionalFields,
	stored?: ILinkToolStoredPageInfo | null,
): ILinkToolPageInfo | undefined {
	const title = firstText(fields.pageTitle, stored?.title);
	const description = firstText(fields.pageDescription, stored?.description);
	if (!title && !description) return undefined;

	const pageInfo: ILinkToolPageInfo = {};
	if (title) pageInfo.title = title;
	if (description) pageInfo.description = description;
	if (typeof stored?.descriptionIsHtmlFile === 'boolean') {
		pageInfo.descriptionIsHtmlFile = stored.descriptionIsHtmlFile;
	}
	return pageInfo;
}

/** Create: tag, reference ID, landing page and page info, each only when the user set it. */
export function buildCommonCreateFields(fields: ILinkToolAdditionalFields): ILinkToolCommonBody {
	const body: ILinkToolCommonBody = {};
	const tag = firstText(fields.tag);
	const refId = firstText(fields.refId);
	const pageInfo = buildPageInfo(fields);

	if (tag) body.tag = tag;
	if (refId) body.refId = refId;
	if (typeof fields.isEnableLandingPage === 'boolean')
		body.isEnableLandingPage = fields.isEnableLandingPage;
	if (pageInfo) body.pageInfo = pageInfo;
	return body;
}

/**
 * Update: the stored record with the user's fields on top. A Tag or Reference ID
 * the user added but left empty clears it. `templateType` and `createdFrom` are
 * always the stored ones: the short-link update resets an omitted `createdFrom`
 * to "api", and both updates drop an omitted `templateType`.
 */
export function buildCommonUpdateFields(
	fields: ILinkToolAdditionalFields,
	stored: ILinkToolStoredFields,
): ILinkToolCommonBody {
	const body: ILinkToolCommonBody = {};
	const tag = hasField(fields, 'tag') ? toText(fields.tag).trim() : stored.tag;
	const refId = hasField(fields, 'refId') ? toText(fields.refId).trim() : stored.refId;
	const isEnableLandingPage =
		typeof fields.isEnableLandingPage === 'boolean'
			? fields.isEnableLandingPage
			: stored.isEnableLandingPage;
	const pageInfo = buildPageInfo(fields, stored.pageInfo);

	if (typeof tag === 'string') body.tag = tag;
	if (typeof refId === 'string') body.refId = refId;
	if (stored.templateType) body.templateType = stored.templateType;
	if (stored.createdFrom) body.createdFrom = stored.createdFrom;
	if (typeof isEnableLandingPage === 'boolean') body.isEnableLandingPage = isEnableLandingPage;
	if (pageInfo) body.pageInfo = pageInfo;
	return body;
}

/**
 * The Android / iOS destinations to send. Create sends a filled-in value only
 * (empty means "use the target page's own deep link"). Update sends every field
 * the user added, even empty (which clears it), and nothing else, so the API
 * keeps the stored value, or re-reads the new target page's when the
 * destination URL changed.
 */
export function buildDeepLinkFields(
	fields: IShortLinkAdditionalFields,
	operation: 'create' | 'update',
): IShortLinkDeepLinks {
	const links: IShortLinkDeepLinks = {};
	for (const key of SHORT_LINK_DEEP_LINK_FIELDS) {
		const value = toText(fields[key]).trim();
		if (operation === 'update' ? hasField(fields, key) : value) links[key] = value;
	}
	return links;
}
