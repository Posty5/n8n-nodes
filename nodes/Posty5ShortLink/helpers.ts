/**
 * Short Link *Create Many*: one input item as one bulk row, read from the same
 * fields as *Create* (Destination URL, Name, Custom Slug) plus the row's
 * Template / Tag / Reference ID.
 */

import type { IExecuteFunctions } from 'n8n-workflow';
import { API_ENDPOINTS, LINK_BULK, LINK_BULK_MESSAGES } from '../../utils/constants';
import { firstText, toText } from '../../utils/link-tool.helpers';
import type { IBulkDefaults, IBulkRoute, IShortLinkBulkRow } from '../../types/link-bulk.types';

/** One item's row. Throws (the item becomes a local failed row) when no template is set anywhere. */
export function buildShortLinkBulkRow(
	ctx: IExecuteFunctions,
	itemIndex: number,
	defaults: IBulkDefaults,
): IShortLinkBulkRow {
	const rowFields = ctx.getNodeParameter('rowFields', itemIndex, {}) as Record<string, unknown>;
	const row: IShortLinkBulkRow = { url: toText(ctx.getNodeParameter('url', itemIndex, '')).trim() };
	const name = firstText(ctx.getNodeParameter('name', itemIndex, ''));
	const customId = firstText(ctx.getNodeParameter('customLandingId', itemIndex, ''));
	const templateId = firstText(ctx.getNodeParameter('templateId', itemIndex, ''));
	const tag = firstText(rowFields.tag);
	const refId = firstText(rowFields.refId);

	if (!templateId && !defaults.templateId) throw new Error(LINK_BULK_MESSAGES.TEMPLATE_REQUIRED);
	if (name) row.name = name;
	if (customId) row.customId = customId;
	if (templateId) row.templateId = templateId;
	if (tag) row.tag = tag;
	if (refId) row.refId = refId;
	return row;
}

/** `POST /api/short-link/bulk`: `{ links, defaults, fetchMetadata, templateType }` (as `@posty5/short-link` sends). */
export function shortLinkBulkRoute(fetchMetadata: boolean): IBulkRoute<IShortLinkBulkRow> {
	return {
		endpoint: `${API_ENDPOINTS.SHORT_LINK}/${LINK_BULK.PATH_SEGMENT}`,
		toBody: (links, defaults) => ({
			links,
			defaults,
			fetchMetadata,
			templateType: LINK_BULK.TEMPLATE_TYPE,
		}),
	};
}
