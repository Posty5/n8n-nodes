/**
 * QR Code *Create Many*: one input item as one bulk row. The content is built
 * by `buildQrCodeTarget`, the same mapping *Create* sends as `qrCodeTarget`,
 * so the two operations cannot drift apart.
 */

import type { IExecuteFunctions } from 'n8n-workflow';
import { API_ENDPOINTS, LINK_BULK, LINK_BULK_MESSAGES } from '../../utils/constants';
import { firstText } from '../../utils/link-tool.helpers';
import { buildQrCodeTarget, readQrMode } from '../../utils/qr-target.helpers';
import type { IBulkDefaults, IBulkRoute, IQrCodeBulkRow } from '../../types/link-bulk.types';

/** One item's row. Throws (the item becomes a local failed row) on an unknown type or no template. */
export function buildQrCodeBulkRow(
	ctx: IExecuteFunctions,
	itemIndex: number,
	defaults: IBulkDefaults,
): IQrCodeBulkRow {
	const qrType = ctx.getNodeParameter('qrType', itemIndex) as string;
	const qrCodeTarget = buildQrCodeTarget(qrType, (parameter, fallback) =>
		ctx.getNodeParameter(parameter, itemIndex, fallback),
	);
	const rowFields = ctx.getNodeParameter('rowFields', itemIndex, {}) as Record<string, unknown>;
	const name = firstText(ctx.getNodeParameter('name', itemIndex, ''));
	const templateId = firstText(ctx.getNodeParameter('templateId', itemIndex, ''));
	const tag = firstText(rowFields.tag);
	const refId = firstText(rowFields.refId);

	if (!templateId && !defaults.templateId) throw new Error(LINK_BULK_MESSAGES.TEMPLATE_REQUIRED);

	const row: IQrCodeBulkRow = {
		type: qrCodeTarget.type,
		target: qrCodeTarget[qrCodeTarget.type]!,
	};
	// Static is the API default: send `mode` only for dynamic, as *Create* does.
	if (readQrMode(ctx.getNodeParameter('mode', itemIndex, 'static')) === 'dynamic') row.mode = 'dynamic';
	if (name) row.name = name;
	if (templateId) row.templateId = templateId;
	if (tag) row.tag = tag;
	if (refId) row.refId = refId;
	return row;
}

/** `POST /api/qr-code/bulk`: `{ items, defaults }` (as `@posty5/qr-code` sends; the bulk schema refuses `templateType`). */
export const QR_CODE_BULK_ROUTE: IBulkRoute<IQrCodeBulkRow> = {
	endpoint: `${API_ENDPOINTS.QR_CODE}/${LINK_BULK.PATH_SEGMENT}`,
	toBody: (items, defaults) => ({
		items,
		defaults,
	}),
};
