import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['supplierOrder'] };

export const supplierOrderOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show },
	options: [
		{
			name: 'Cancel',
			value: 'cancel',
			description: 'Withdraw the order at the supplier, where the supplier still allows it',
			action: 'Cancel a supplier order',
		},
		{
			name: 'Get',
			value: 'get',
			description: 'Get one supplier order with its history',
			action: 'Get a supplier order',
		},
		{
			name: 'Get Many',
			value: 'getMany',
			description: 'List supplier orders, newest first',
			action: 'Get many supplier orders',
		},
		{
			name: 'Pay',
			value: 'pay',
			description:
				"Pay a supplier order that was created but not paid. Spends the merchant's balance at the supplier; needs suppliers.orders.manage. An order already paid there is recorded, not paid again.",
			action: 'Pay a supplier order',
		},
		{
			name: 'Retry',
			value: 'retry',
			description:
				'Try a queued, paused or failed supplier order again. A paused order usually needs something changed first.',
			action: 'Retry a supplier order',
		},
	],
	default: 'getMany',
};

export const supplierOrderFields: INodeProperties[] = [
	{
		displayName: 'Supplier Order ID',
		name: 'supplierOrderId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { ...show, operation: ['cancel', 'get', 'pay', 'retry'] } },
	},
	{
		displayName: 'Accept New Cost',
		name: 'acceptCost',
		type: 'boolean',
		default: false,
		description: "Whether to accept the supplier's new price after a price change. Recorded as the caller's decision.",
		displayOptions: { show: { ...show, operation: ['retry'] } },
	},
	{
		displayName: 'Page',
		name: 'page',
		type: 'number',
		typeOptions: { minValue: 1 },
		default: 1,
		displayOptions: { show: { ...show, operation: ['getMany'] } },
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
			{ displayName: 'Order ID', name: 'orderId', type: 'string', default: '', description: 'Only the supplier orders of this store order' },
			{
				displayName: 'Needs Review',
				name: 'needsReview',
				type: 'boolean',
				default: true,
				description: 'Whether to return only paused supplier orders',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Cancelled', value: 'cancelled' },
					{ name: 'Confirmed', value: 'confirmed' },
					{ name: 'Delivered', value: 'delivered' },
					{ name: 'Failed', value: 'failed' },
					{ name: 'Needs Review', value: 'needsReview' },
					{ name: 'Processing', value: 'processing' },
					{ name: 'Queued', value: 'queued' },
					{ name: 'Shipped', value: 'shipped' },
					{ name: 'Submitted', value: 'submitted' },
				],
				default: 'needsReview',
			},
			{ displayName: 'Supplier Connection ID', name: 'integrationId', type: 'string', default: '' },
		],
	},
];
