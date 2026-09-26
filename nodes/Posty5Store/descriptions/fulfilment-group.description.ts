import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['fulfilmentGroup'] };

export const fulfilmentGroupOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show },
	options: [
		{
			name: 'Fulfil Manually',
			value: 'fulfilManually',
			description: 'Take a part over, so the store ships it itself',
			action: 'Fulfil an order part manually',
		},
		{
			name: 'Submit',
			value: 'submit',
			description:
				'Send one part of an order to its supplier now. A second Submit finds the first supplier order instead of creating another.',
			action: 'Submit an order part to its supplier',
		},
	],
	default: 'submit',
};

export const fulfilmentGroupFields: INodeProperties[] = [
	{
		displayName: 'Order ID',
		name: 'orderId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show },
	},
	{
		displayName: 'Part Key',
		name: 'groupKey',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'supplier:…',
		description: "The part's key, from Order → Get (fulfilmentGroups[].key)",
		displayOptions: { show },
	},
	{
		displayName: 'Pay Now',
		name: 'payNow',
		type: 'boolean',
		default: false,
		description:
			"Whether to pay the supplier as soon as the order is created, even when the shopper has not paid. Spends the merchant's balance at the supplier; needs suppliers.orders.manage.",
		displayOptions: { show: { ...show, operation: ['submit'] } },
	},
];
