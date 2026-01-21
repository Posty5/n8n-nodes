import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { HtmlHostingVariablesClient } from '@posty5/html-hosting-variables';

export class Posty5HtmlHostingVariables implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Posty5 HTML Variables',
		name: 'posty5HtmlHostingVariables',
		icon: 'file:posty5.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Manage dynamic variables for HTML pages',
		defaults: {
			name: 'Posty5 HTML Variables',
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
						description: 'Create a new variable',
						action: 'Create a variable',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a variable',
						action: 'Delete a variable',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a variable',
						action: 'Get a variable',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List all variables',
						action: 'List variables',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a variable',
						action: 'Update a variable',
					},
				],
				default: 'create',
			},

			// Create operation fields
			{
				displayName: 'Variable Name',
				name: 'name',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				default: '',
				description: 'A friendly name for the variable',
			},
			{
				displayName: 'Variable Key',
				name: 'key',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				default: 'pst5_',
				description: 'Variable key (must start with "pst5_")',
				placeholder: 'pst5_my_variable',
			},
			{
				displayName: 'Variable Value',
				name: 'value',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				default: '',
				description: 'The value of the variable',
			},

			// Variable ID for get/update/delete operations
			{
				displayName: 'Variable ID',
				name: 'variableId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['get', 'update', 'delete'],
					},
				},
				default: '',
				description: 'The ID of the variable',
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
			baseUrl: 'https://api.posty5.com',
		});
		const client = new HtmlHostingVariablesClient(http);

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: any = {};

				if (operation === 'create') {
					const name = this.getNodeParameter('name', i) as string;
					const key = this.getNodeParameter('key', i) as string;
					const value = this.getNodeParameter('value', i) as string;

					responseData = await client.create({ name, key, value });
				} else if (operation === 'get') {
					const variableId = this.getNodeParameter('variableId', i) as string;
					responseData = await client.get(variableId);
				} else if (operation === 'update') {
					const variableId = this.getNodeParameter('variableId', i) as string;
					const name = this.getNodeParameter('name', i) as string;
					const key = this.getNodeParameter('key', i) as string;
					const value = this.getNodeParameter('value', i) as string;

					responseData = await client.update(variableId, { name, key, value });
				} else if (operation === 'delete') {
					const variableId = this.getNodeParameter('variableId', i) as string;
					responseData = await client.delete(variableId);
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
							const result = await client.list({ ...filters }, { page, pageSize: params.pageSize });
							allResults = allResults.concat(result.items);
							hasMore = result.items.length === params.pageSize;
							page++;
						}

						responseData = allResults;
					} else {
						const result = await client.list(
							{ ...filters },
							{ page: 1, pageSize: params.pageSize },
						);
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
