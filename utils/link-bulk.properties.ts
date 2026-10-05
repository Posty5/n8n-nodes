/**
 * *Create Many* fields shared by the Short Link and QR Code nodes: the row's
 * optional Template, Tag and Reference ID, the *Defaults* collection and the
 * *Options* collection. Row content fields are the nodes' own *Create* fields.
 */

import type { INodeProperties } from 'n8n-workflow';
import { LINK_BULK } from './constants';

const SHOW_CREATE_MANY = { show: { operation: ['createMany'] } };

/** *Fetch Page Metadata* applies to short links only. */
export function buildLinkBulkProperties(withFetchMetadata: boolean): INodeProperties[] {
	const options: INodeProperties[] = [
		{
			displayName: 'Batch Size',
			name: 'batchSize',
			type: 'number',
			typeOptions: { minValue: 1, maxValue: LINK_BULK.MAX_BATCH_SIZE },
			default: 100,
			description: 'Rows sent per API request (at most 100)',
		},
		{
			displayName: 'Fail on Any Row Error',
			name: 'failOnRowError',
			type: 'boolean',
			default: false,
			description:
				'Whether to stop the workflow when Posty5 refuses a row. Off: a refused row is an output item with status "failed". Rows already created stay created.',
		},
	];
	if (withFetchMetadata) {
		options.push({
			displayName: 'Fetch Page Metadata',
			name: 'fetchMetadata',
			type: 'boolean',
			default: true,
			description: 'Whether Posty5 reads the title and image of each destination page in the background',
		});
	}

	return [
		{
			displayName: 'Template Name or ID',
			name: 'templateId',
			type: 'options',
			typeOptions: { loadOptionsMethod: 'getQrTemplates' },
			displayOptions: SHOW_CREATE_MANY,
			default: '',
			description:
				'The design of this row. Leave empty to use Defaults > Template ID; one of the two is required. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		},
		{
			displayName: 'Row Fields',
			name: 'rowFields',
			type: 'collection',
			placeholder: 'Add Field',
			default: {},
			displayOptions: SHOW_CREATE_MANY,
			options: [
				{
					displayName: 'Reference ID',
					name: 'refId',
					type: 'string',
					default: '',
					description: 'External reference ID of this row',
				},
				{
					displayName: 'Tag',
					name: 'tag',
					type: 'string',
					default: '',
					description: 'Organization tag of this row',
				},
			],
		},
		{
			displayName: 'Defaults',
			name: 'bulkDefaults',
			type: 'collection',
			placeholder: 'Add Default',
			default: {},
			displayOptions: SHOW_CREATE_MANY,
			description: 'Applied to every row that does not set the field itself',
			options: [
				{
					displayName: 'Reference ID',
					name: 'refId',
					type: 'string',
					default: '',
				},
				{
					displayName: 'Tag',
					name: 'tag',
					type: 'string',
					default: '',
				},
				{
					displayName: 'Template ID',
					name: 'templateId',
					type: 'string',
					default: '',
				},
			],
		},
		{
			displayName: 'Options',
			name: 'bulkOptions',
			type: 'collection',
			placeholder: 'Add Option',
			default: {},
			displayOptions: SHOW_CREATE_MANY,
			options,
		},
	];
}
