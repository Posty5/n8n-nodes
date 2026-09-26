import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['productLink'] };

export const productLinkOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show },
	options: [
		{
			name: 'Get Many',
			value: 'getMany',
			description: "List the store's product links to suppliers",
			action: 'Get many product links',
		},
		{
			name: 'Sync',
			value: 'sync',
			description: 'Sync one link with its supplier now. Refused within a minute of the last sync.',
			action: 'Sync a product link',
		},
	],
	default: 'getMany',
};

export const productLinkFields: INodeProperties[] = [
	{
		displayName: 'Link ID',
		name: 'linkId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { ...show, operation: ['sync'] } },
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { ...show, operation: ['getMany'] } },
		options: [
			{ displayName: 'Product ID', name: 'productId', type: 'string', default: '', description: 'Only the link of this store product' },
		],
	},
];
