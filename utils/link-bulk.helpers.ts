/**
 * *Create Many* on the Short Link and QR Code nodes.
 *
 * Every input item is mapped to one row with the same field reading as
 * *Create*; the rows are sent in chunks to the sync bulk route and every input
 * item gets exactly one output item (`pairedItem` = its index) carrying the
 * row's result. A refused row is an output item with `status: "failed"`, not a
 * thrown error, unless *Fail on Any Row Error* is on.
 */

import { IExecuteFunctions, INodeExecutionData, NodeOperationError } from 'n8n-workflow';
import { makeApiRequest } from './api.helpers';
import { firstText } from './link-tool.helpers';
import { LINK_BULK, LINK_BULK_MESSAGES } from './constants';
import type {
	BulkPreparedRow,
	IBulkCreateResult,
	IBulkDefaults,
	IBulkNodeOptions,
	IBulkRoute,
	IBulkRowResult,
} from '../types/link-bulk.types';

/** The *Defaults* collection as the body's `defaults`, empty values left out. */
export function readBulkDefaults(raw: Record<string, unknown> | undefined): IBulkDefaults {
	const defaults: IBulkDefaults = {};
	const templateId = firstText(raw?.templateId);
	const tag = firstText(raw?.tag);
	const refId = firstText(raw?.refId);
	if (templateId) defaults.templateId = templateId;
	if (tag) defaults.tag = tag;
	if (refId) defaults.refId = refId;
	return defaults;
}

/** *Batch Size* clamped to 1..100 (100 when unset or not a number). */
export function readBatchSize(value: unknown): number {
	const size = Math.floor(Number(value));
	if (!Number.isFinite(size) || size < 1) return LINK_BULK.DEFAULT_BATCH_SIZE;
	return Math.min(size, LINK_BULK.MAX_BATCH_SIZE);
}

/** `n8n-<executionId>-<nodeName>-<chunk>`: one execution retried is deduped, a new run is not. */
export function buildBulkIdempotencyKey(executionId: string, nodeName: string, chunk: number): string {
	return [LINK_BULK.IDEMPOTENCY_PREFIX, executionId, nodeName, String(chunk)].join('-');
}

/** Map every input item to a row; an item whose mapping throws becomes a local failure and is not sent. */
export function prepareBulkRows<TRow>(
	count: number,
	mapItem: (itemIndex: number) => TRow,
): BulkPreparedRow<TRow>[] {
	const prepared: BulkPreparedRow<TRow>[] = [];
	for (let i = 0; i < count; i++) {
		try {
			prepared.push({ row: mapItem(i) });
		} catch (error) {
			prepared.push({ error: (error as Error).message });
		}
	}
	return prepared;
}

/** A failed row's output json. */
function failedRow(message: string): Partial<IBulkRowResult> {
	return { status: LINK_BULK.ROW_STATUS_FAILED, errors: [{ message }] };
}

/** A row result as the item's json: the API's result without its request-relative `row`. */
function toRowJson(result: IBulkRowResult | undefined): Partial<IBulkRowResult> {
	if (!result) return failedRow(LINK_BULK_MESSAGES.MISSING_ROW_RESULT);
	const json: Partial<IBulkRowResult> = { ...result };
	delete json.row;
	return json;
}

/** A failed row's errors as one line, for *Fail on Any Row Error*. */
function rowErrorText(json: Partial<IBulkRowResult>): string {
	return (json.errors || [])
		.map((error) => (error.field ? `${error.field}: ${error.message}` : error.message))
		.join('; ');
}

/**
 * Send the prepared rows in chunks and answer one output item per input item,
 * in input order. A whole-request error (403 gate, 400 credits) throws, or,
 * with `continueOnFail()`, becomes `{ error }` on every item of that chunk.
 */
export async function executeBulkCreate<TRow>(
	ctx: IExecuteFunctions,
	apiKey: string,
	route: IBulkRoute<TRow>,
	prepared: BulkPreparedRow<TRow>[],
	defaults: IBulkDefaults,
	options: IBulkNodeOptions,
): Promise<INodeExecutionData[]> {
	const output: INodeExecutionData[] = new Array(prepared.length);
	const sendable: { itemIndex: number; row: TRow }[] = [];

	prepared.forEach((entry, itemIndex) => {
		if ('row' in entry) sendable.push({ itemIndex, row: entry.row });
		else output[itemIndex] = { json: failedRow(entry.error), pairedItem: { item: itemIndex } };
	});

	const batchSize = readBatchSize(options.batchSize);
	const executionId = String(ctx.getExecutionId());
	const nodeName = ctx.getNode().name;

	for (let start = 0, chunk = 0; start < sendable.length; start += batchSize, chunk++) {
		const slice = sendable.slice(start, start + batchSize);
		try {
			const result = (await makeApiRequest.call(ctx, apiKey, {
				method: 'POST',
				endpoint: route.endpoint,
				body: route.toBody(
					slice.map((entry) => entry.row),
					defaults,
				),
				headers: {
					[LINK_BULK.IDEMPOTENCY_HEADER]: buildBulkIdempotencyKey(executionId, nodeName, chunk),
				},
			})) as IBulkCreateResult;

			// `row` is 1-based over this request's rows.
			const byRow = new Map<number, IBulkRowResult>();
			for (const item of result?.items || []) byRow.set(item.row, item);
			slice.forEach((entry, position) => {
				output[entry.itemIndex] = {
					json: toRowJson(byRow.get(position + 1)),
					pairedItem: { item: entry.itemIndex },
				};
			});
		} catch (error) {
			if (!ctx.continueOnFail()) throw error;
			for (const entry of slice) {
				output[entry.itemIndex] = {
					json: { error: (error as Error).message },
					pairedItem: { item: entry.itemIndex },
				};
			}
		}
	}

	if (options.failOnRowError) {
		const failedIndex = output.findIndex((item) => item.json.status === LINK_BULK.ROW_STATUS_FAILED);
		if (failedIndex >= 0) {
			throw new NodeOperationError(
				ctx.getNode(),
				`${LINK_BULK_MESSAGES.ROW_FAILED}: ${rowErrorText(output[failedIndex].json as Partial<IBulkRowResult>)}`,
				{ itemIndex: failedIndex },
			);
		}
	}

	return output;
}
