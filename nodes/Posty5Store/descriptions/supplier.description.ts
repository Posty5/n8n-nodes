import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['supplier'] };

export const supplierOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show },
	options: [
		{
			name: 'Get Balance',
			value: 'getBalance',
			description: "Read the store's balance at the supplier, where the supplier reports one",
			action: 'Get a supplier balance',
		},
		{
			name: 'Get Catalogue',
			value: 'getCatalogue',
			description: 'List the suppliers this store can connect, with what each can do',
			action: 'Get the supplier catalogue',
		},
		{
			name: 'Get Many',
			value: 'getMany',
			description: "List the store's supplier connections. Credentials are never returned.",
			action: 'Get many supplier connections',
		},
		{
			name: 'Test',
			value: 'test',
			description: 'Check a connection now and record its health. Free; calls the supplier once.',
			action: 'Test a supplier connection',
		},
	],
	default: 'getMany',
};

export const supplierFields: INodeProperties[] = [
	{
		displayName: 'Supplier Connection ID',
		name: 'integrationId',
		type: 'string',
		required: true,
		default: '',
		description: 'The connection ID, from Supplier → Get Many',
		displayOptions: { show: { ...show, operation: ['getBalance', 'test'] } },
	},
];
