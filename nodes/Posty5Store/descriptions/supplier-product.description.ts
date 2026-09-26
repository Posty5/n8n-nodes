import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['supplierProduct'] };

export const supplierProductOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show },
	options: [
		{
			name: 'Get',
			value: 'get',
			description: 'Get one supplier product with its variants, costs and stock',
			action: 'Get a supplier product',
		},
		{
			name: 'Get Import Status',
			value: 'getImportStatus',
			description: 'Read the progress of a background import',
			action: 'Get an import status',
		},
		{
			name: 'Get Many',
			value: 'getMany',
			description: "Browse or search the supplier's catalogue",
			action: 'Get many supplier products',
		},
		{
			name: 'Import',
			value: 'import',
			description:
				'Import up to 50 products into the store. Charged like adding products. Large imports answer a job ID to poll.',
			action: 'Import supplier products',
		},
		{
			name: 'Preview Import',
			value: 'previewImport',
			description: 'Price the chosen products and name duplicates. Nothing is created or charged.',
			action: 'Preview a supplier import',
		},
		{
			name: 'Resolve URL',
			value: 'resolveUrl',
			description: 'Turn a pasted product link into the supplier product',
			action: 'Resolve a supplier product URL',
		},
	],
	default: 'getMany',
};

export const supplierProductFields: INodeProperties[] = [
	{
		displayName: 'Supplier Connection ID',
		name: 'integrationId',
		type: 'string',
		required: true,
		default: '',
		description: 'The connection ID, from Supplier → Get Many',
		displayOptions: { show: { ...show, operation: ['get', 'getMany', 'import', 'previewImport', 'resolveUrl'] } },
	},
	{
		displayName: 'Supplier Product ID',
		name: 'supplierProductId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { ...show, operation: ['get'] } },
	},
	{
		displayName: 'Product URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://…',
		description: 'A full product link from the supplier. Shortened links are refused.',
		displayOptions: { show: { ...show, operation: ['resolveUrl'] } },
	},
	{
		displayName: 'Supplier Product IDs',
		name: 'supplierProductIds',
		type: 'string',
		required: true,
		default: '',
		description: 'Comma-separated supplier product IDs, up to 50. Every variant of each is imported.',
		displayOptions: { show: { ...show, operation: ['import', 'previewImport'] } },
	},
	{
		displayName: 'Job ID',
		name: 'jobId',
		type: 'string',
		required: true,
		default: '',
		description: 'The job ID an Import answered',
		displayOptions: { show: { ...show, operation: ['getImportStatus'] } },
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
			{ displayName: 'Category ID', name: 'categoryId', type: 'string', default: '' },
			{ displayName: 'Search', name: 'q', type: 'string', default: '', description: 'Search text' },
		],
	},
	{
		displayName: 'Import Options',
		name: 'importOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { ...show, operation: ['import', 'previewImport'] } },
		options: [
			{
				displayName: 'Allow Duplicate',
				name: 'allowDuplicate',
				type: 'boolean',
				default: false,
				description: 'Whether to import a supplier product the store already has, as a second copy',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Active', value: 'active' },
					{ name: 'Draft', value: 'draft' },
					{ name: 'Hidden', value: 'hidden' },
				],
				default: 'draft',
				description: 'Status of the imported products',
			},
			{
				displayName: 'Tag Names',
				name: 'tagNames',
				type: 'string',
				default: '',
				description: 'Comma-separated tags to add to the imported products',
			},
		],
	},
];
