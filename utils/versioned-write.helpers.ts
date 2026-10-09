/**
 * Versioned writes (optimistic-concurrency, D-18): the Version field of the v2
 * nodes, and the version each update/delete sends as `If-Match`.
 *
 * - v2: the Version field (default `{{ $json.__v }}`); when it is empty, the
 *   node fails, unless Version Options > On Unknown Version is Use Latest,
 *   which reads the item and uses its `__v` (an explicit opt-in to
 *   last-write-wins).
 * - v1: unchanged UI; the item is read first and its `__v` is sent, so a saved
 *   workflow keeps last-write-wins after enforcement (legacy, documented).
 */

import type { IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { makeApiRequest } from './api.helpers';
import { VERSIONED_WRITES } from './constants';

/** True when the running node is v2 or later. */
export function isVersionedNode(context: IExecuteFunctions): boolean {
	const typeVersion = Number(context.getNode()?.typeVersion ?? 1);
	return typeVersion >= VERSIONED_WRITES.FIRST_VERSIONED_NODE_VERSION;
}

/** A `__v` read from a stored item, when it is a number. */
export function readStoredVersion(item: unknown): number | undefined {
	const v = (item as { __v?: unknown } | null | undefined)?.__v;
	return typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : undefined;
}

function parseVersion(value: unknown): number | undefined {
	if (value === undefined || value === null || value === '') return undefined;
	const n = typeof value === 'number' ? value : Number(String(value).trim());
	return Number.isInteger(n) && n >= 0 ? n : undefined;
}

/**
 * The version a write sends.
 *
 * @param getEndpoint - the item's GET route, read for v1 and for Use Latest.
 * @param stored - an item the operation already read (its `__v` is reused, no
 *   second GET), for the operations that fetch-then-put.
 */
export async function resolveWriteVersion(
	context: IExecuteFunctions,
	apiKey: string,
	itemIndex: number,
	getEndpoint: string,
	stored?: unknown,
): Promise<number | undefined> {
	const readLatest = async (): Promise<number | undefined> => {
		// An item the operation already read is the latest: never read it twice.
		if (stored !== undefined && stored !== null) return readStoredVersion(stored);
		const item = await makeApiRequest.call(context, apiKey, { method: 'GET', endpoint: getEndpoint });
		return readStoredVersion(item);
	};

	if (!isVersionedNode(context)) return readLatest();

	const given = parseVersion(context.getNodeParameter(VERSIONED_WRITES.VERSION_PARAMETER, itemIndex, ''));
	if (given !== undefined) return given;

	const options = context.getNodeParameter(VERSIONED_WRITES.OPTIONS_PARAMETER, itemIndex, {}) as {
		onUnknownVersion?: string;
	};
	if (options?.onUnknownVersion === VERSIONED_WRITES.ON_UNKNOWN_USE_LATEST) return readLatest();

	throw new NodeOperationError(context.getNode(), VERSIONED_WRITES.UNKNOWN_VERSION_MESSAGE, { itemIndex });
}

/**
 * The v2-only Version field and Version Options for the given operations. A
 * v1 node shows neither (`@version` display rule): it shows only a notice,
 * not an input, that marks its write operations as legacy (D-18).
 */
export function buildVersionedWriteProperties(operations: string[]): INodeProperties[] {
	const show = {
		'@version': [VERSIONED_WRITES.FIRST_VERSIONED_NODE_VERSION],
		operation: operations,
	};
	return [
		{
			displayName: VERSIONED_WRITES.V1_DEPRECATION_NOTE,
			name: VERSIONED_WRITES.V1_NOTICE_PARAMETER,
			type: 'notice',
			default: '',
			displayOptions: { show: { '@version': [1], operation: operations } },
		},
		{
			displayName: 'Version',
			name: VERSIONED_WRITES.VERSION_PARAMETER,
			type: 'number',
			required: true,
			default: VERSIONED_WRITES.DEFAULT_VERSION_EXPRESSION,
			description:
				'The version (`__v`) of the item as you read it. Use the output of a Get step. If the item changed since, the node fails with a conflict instead of overwriting it.',
			displayOptions: { show },
		},
		{
			displayName: 'Version Options',
			name: VERSIONED_WRITES.OPTIONS_PARAMETER,
			type: 'collection',
			placeholder: 'Add Option',
			default: {},
			displayOptions: { show },
			options: [
				{
					displayName: 'On Unknown Version',
					name: 'onUnknownVersion',
					type: 'options',
					default: VERSIONED_WRITES.ON_UNKNOWN_FAIL,
					description: 'What to do when Version is empty',
					options: [
						{
							name: 'Fail',
							value: VERSIONED_WRITES.ON_UNKNOWN_FAIL,
							description: 'Stop with an error: map the __v of a Get step',
						},
						{
							name: 'Use Latest (Overwrite)',
							value: VERSIONED_WRITES.ON_UNKNOWN_USE_LATEST,
							description: 'Read the item and use its current version: the last write wins',
						},
					],
				},
			],
		},
	];
}
