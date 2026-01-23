import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { ShortLinkClient } from '@posty5/short-link';

export class Posty5ShortLink implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Posty5 Short Link',
		name: 'posty5ShortLink',
		icon: 'file:posty5.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Create and manage short links with Posty5',
		defaults: {
			name: 'Posty5 Short Link',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'posty5Api',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new short link',
						action: 'Create a short link',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a short link',
						action: 'Delete a short link',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a short link by ID',
						action: 'Get a short link',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List all short links',
						action: 'List short links',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a short link',
						action: 'Update a short link',
					},
				],
				default: 'create',
			},

			// Create operation fields
			{
				displayName: 'Destination URL',
				name: 'url',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['create'],
					},
				},
				default: '',
				description: 'The destination URL to shorten',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				default: '',
				description: 'A friendly name for the short link',
			},
			{
				displayName: 'Custom Slug',
				name: 'customLandingId',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				default: '',
				description: 'Custom slug for branded short links (e.g., "my-link")',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				options: [
					{
						displayName: 'Tag',
						name: 'tag',
						type: 'string',
						default: '',
						description: 'Organization tag for filtering',
					},
					{
						displayName: 'Reference ID',
						name: 'refId',
						type: 'string',
						default: '',
						description: 'External reference ID',
					},
					{
						displayName: 'Template ID',
						name: 'templateId',
						type: 'string',
						default: '',
						description: 'QR code template ID',
					},
					{
						displayName: 'Enable Monetization',
						name: 'isEnableMonetization',
						type: 'boolean',
						default: false,
						description: 'Whether to enable monetization for this link',
					},
					{
						displayName: 'Page Title',
						name: 'pageTitle',
						type: 'string',
						default: '',
						description: 'Landing page title',
					},
					{
						displayName: 'Page Description',
						name: 'pageDescription',
						type: 'string',
						default: '',
						description: 'Landing page description',
					},
				],
			},

			// Get, Update, Delete operation fields
			{
				displayName: 'Short Link ID',
				name: 'shortLinkId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['get', 'update', 'delete'],
					},
				},
				default: '',
				description: 'The ID of the short link',
			},

			// List operation fields
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['list'],
					},
				},
				default: false,
				description: 'Whether to return all results or only up to a given limit',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['list'],
						returnAll: [false],
					},
				},
				typeOptions: {
					minValue: 1,
					maxValue: 100,
				},
				default: 50,
				description: 'Max number of results to return',
			},
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: {
					show: {
						operation: ['list'],
					},
				},
				options: [
					{
						displayName: 'Tag',
						name: 'tag',
						type: 'string',
						default: '',
						description: 'Filter by tag',
					},
					{
						displayName: 'Reference ID',
						name: 'refId',
						type: 'string',
						default: '',
						description: 'Filter by reference ID',
					},
					{
						displayName: 'Search',
						name: 'search',
						type: 'string',
						default: '',
						description: 'Search term',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		const credentials = await this.getCredentials('posty5Api');
		const { HttpClient } = await import('@posty5/core');
		const http = new HttpClient({
			apiKey: credentials.apiKey as string,
		});
		const client = new ShortLinkClient(http);

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: any = {};

				if (operation === 'create') {
					const url = this.getNodeParameter('url', i) as string;
					const name = this.getNodeParameter('name', i, '') as string;
					const customLandingId = this.getNodeParameter('customLandingId', i, '') as string;
					const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;

					const params: any = { url };
					if (name) params.name = name;
					if (customLandingId) params.customLandingId = customLandingId;
					if (additionalFields.tag) params.tag = additionalFields.tag;
					if (additionalFields.refId) params.refId = additionalFields.refId;
					if (additionalFields.templateId) params.templateId = additionalFields.templateId;
					if (additionalFields.isEnableMonetization !== undefined) {
						params.isEnableMonetization = additionalFields.isEnableMonetization;
					}
					if (additionalFields.pageTitle || additionalFields.pageDescription) {
						params.pageInfo = {
							title: additionalFields.pageTitle || '',
							description: additionalFields.pageDescription || '',
						};
					}

					responseData = await client.create(params);
				} else if (operation === 'get') {
					const shortLinkId = this.getNodeParameter('shortLinkId', i) as string;
					responseData = await client.get(shortLinkId);
				} else if (operation === 'update') {
					const shortLinkId = this.getNodeParameter('shortLinkId', i) as string;
					const name = this.getNodeParameter('name', i, '') as string;
					const customLandingId = this.getNodeParameter('customLandingId', i, '') as string;
					const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;

					const params: any = { id: shortLinkId };
					if (name) params.name = name;
					if (customLandingId) params.customLandingId = customLandingId;
					if (additionalFields.tag) params.tag = additionalFields.tag;
					if (additionalFields.refId) params.refId = additionalFields.refId;
					if (additionalFields.templateId) params.templateId = additionalFields.templateId;
					if (additionalFields.isEnableMonetization !== undefined) {
						params.isEnableMonetization = additionalFields.isEnableMonetization;
					}
					if (additionalFields.pageTitle || additionalFields.pageDescription) {
						params.pageInfo = {
							title: additionalFields.pageTitle || '',
							description: additionalFields.pageDescription || '',
						};
					}

					responseData = await client.update(shortLinkId, params);
				} else if (operation === 'delete') {
					const shortLinkId = this.getNodeParameter('shortLinkId', i) as string;
					responseData = await client.delete(shortLinkId);
				} else if (operation === 'list') {
					const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
					const filters = this.getNodeParameter('filters', i, {}) as any;

					const params: any = {
						page: 1,
						pageSize: returnAll ? 100 : this.getNodeParameter('limit', i, 50),
						...filters,
					};

					if (returnAll) {
						let allResults: any[] = [];
						let page = 1;
						let hasMore = true;

						while (hasMore) {
							const result = await client.list(params, { page, pageSize: params.pageSize });
							allResults = allResults.concat(result.items);
							hasMore = result.items.length === params.pageSize;
							page++;
						}

						responseData = allResults;
					} else {
						const result = await client.list(params, {
							page: params.page,
							pageSize: params.pageSize,
						});
						responseData = result.items;
					}
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
