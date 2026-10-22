/**
 * *Created From Date* / *Created To Date*, the created-at window of the list
 * operations (Short Link, QR Code and HTML Hosting `list`, Social Publisher
 * Post `listPosts`), spread into each node's Filters collection. Read by
 * `createdAtRangeQuery` in `date.helpers.ts`.
 *
 * `type: 'string'`, as on the Store node, so n8n's date picker adds no time.
 */

import type { INodeProperties } from 'n8n-workflow';

export const CREATED_AT_RANGE_FILTERS: INodeProperties[] = [
	{
		displayName: 'Created From Date',
		name: 'fromDate',
		type: 'string',
		default: '',
		placeholder: '2026-10-01',
		description: 'YYYY-MM-DD. Applied only together with Created To Date.',
	},
	{
		displayName: 'Created To Date',
		name: 'toDate',
		type: 'string',
		default: '',
		placeholder: '2026-10-07',
		description: 'YYYY-MM-DD. Applied only together with Created From Date.',
	},
];
