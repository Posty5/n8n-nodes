import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { HtmlHostingFormSubmissionClient } from '@posty5/html-hosting-form-submission';

export class Posty5FormSubmission implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Posty5 Form Submission',
		name: 'posty5FormSubmission',
		icon: 'file:posty5.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Manage form submissions from HTML pages',
		defaults: {
			name: 'Posty5 Form Submission',
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
						name: 'Delete',
						value: 'delete',
						description: 'Delete a form submission',
						action: 'Delete a form submission',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a form submission',
						action: 'Get a form submission',
					},
					{
						name: 'Get Adjacent',
						value: 'getAdjacent',
						description: 'Get next/previous submissions',
						action: 'Get adjacent submissions',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List all form submissions',
						action: 'List form submissions',
					},
				],
				default: 'list',
			},

			// Get/Delete operation field
			{
				displayName: 'Submission ID',
				name: 'submissionId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['get', 'delete', 'getAdjacent'],
					},
				},
				default: '',
				description: 'The ID of the form submission',
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
						displayName: 'HTML Hosting ID',
						name: 'htmlHostingId',
						type: 'string',
						default: '',
						description: 'Filter by HTML page ID',
					},
					{
						displayName: 'Form ID',
						name: 'formId',
						type: 'string',
						default: '',
						description: 'Filter by form ID',
					},
					{
						displayName: 'Status',
						name: 'status',
						type: 'options',
						options: [
							{ name: 'New', value: 'new' },
							{ name: 'Read', value: 'read' },
							{ name: 'Archived', value: 'archived' },
						],
						default: '',
						description: 'Filter by submission status',
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
		const client = new HtmlHostingFormSubmissionClient(http);

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: any = {};

				if (operation === 'get') {
					const submissionId = this.getNodeParameter('submissionId', i) as string;
					responseData = await client.get(submissionId);
				} else if (operation === 'getAdjacent') {
					const submissionId = this.getNodeParameter('submissionId', i) as string;
					responseData = await client.getNextPrevious(submissionId);
				} else if (operation === 'delete') {
					const submissionId = this.getNodeParameter('submissionId', i) as string;
					responseData = await client.delete(submissionId);
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
