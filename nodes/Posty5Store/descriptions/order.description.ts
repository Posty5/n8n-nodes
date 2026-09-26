import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['order'] };

export const orderOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show },
	options: [
		{
			name: 'Get',
			value: 'get',
			description: 'Get one order with its parts and, for a key holding suppliers.view, its supplier orders',
			action: 'Get an order',
		},
		{
			name: 'Get Many',
			value: 'getMany',
			description: "List the store's orders",
			action: 'Get many orders',
		},
	],
	default: 'get',
};

export const orderFields: INodeProperties[] = [
	{
		displayName: 'Order ID',
		name: 'orderId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { ...show, operation: ['get'] } },
	},
	{
		displayName: 'Split Parts',
		name: 'splitParts',
		type: 'boolean',
		default: false,
		description:
			'Whether to output one item per part of the order, each with the order number and its supplier order attached',
		displayOptions: { show: { ...show, operation: ['get'] } },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1 },
		default: 50,
		description: 'Max number of results to return',
		displayOptions: { show: { ...show, operation: ['getMany'] } },
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { ...show, operation: ['getMany'] } },
		options: [
			{ displayName: 'Created From Date', name: 'fromDate', type: 'string', default: '', description: 'Used together with Created To Date' },
			{ displayName: 'Created To Date', name: 'toDate', type: 'string', default: '' },
			{ displayName: 'Cursor', name: 'cursor', type: 'string', default: '', description: 'The nextCursor of the previous page' },
			{ displayName: 'Customer', name: 'customer', type: 'string', default: '', description: 'Matched across customer name, phone and email' },
			{
				displayName: 'Needs Attention',
				name: 'needsAttention',
				type: 'boolean',
				default: true,
				description: 'Whether to return only orders with a part that needs attention',
			},
			{ displayName: 'Order Number', name: 'orderNumber', type: 'string', default: '' },
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Cancelled', value: 'cancelled' },
					{ name: 'Confirmed', value: 'confirmed' },
					{ name: 'Delivered', value: 'delivered' },
					{ name: 'Pending', value: 'pending' },
					{ name: 'Processing', value: 'processing' },
					{ name: 'Refused', value: 'refused' },
					{ name: 'Shipped', value: 'shipped' },
				],
				default: 'processing',
			},
		],
	},
];
