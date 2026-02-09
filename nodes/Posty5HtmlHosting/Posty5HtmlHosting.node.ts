import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { makeApiRequest, makePaginatedRequest, uploadFile } from '../../utils/api.helpers';
import { API_ENDPOINTS } from '../../utils/constants';
import type { IListParams } from '../../types/html-hosting.types';

export class Posty5HtmlHosting implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Posty5 HTML Hosting',
		name: 'posty5HtmlHosting',
		icon: 'file:posty5.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Host and manage HTML pages with Posty5',
		defaults: {
			name: 'Posty5 HTML Hosting',
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
						name: 'Create from File',
						value: 'createFromFile',
						description: 'Create HTML page from file upload',
						action: 'Create HTML page from file',
					},
					{
						name: 'Create from GitHub',
						value: 'createFromGithub',
						description: 'Create HTML page from GitHub URL',
						action: 'Create HTML page from GitHub',
					},
					{
						name: 'Update from File',
						value: 'updateFromFile',
						description: 'Update HTML page with new file',
						action: 'Update HTML page from file',
					},
					{
						name: 'Update from GitHub',
						value: 'updateFromGithub',
						description: 'Update HTML page from GitHub URL',
						action: 'Update HTML page from GitHub',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get HTML page details',
						action: 'Get HTML page',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List all HTML pages',
						action: 'List HTML pages',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete HTML page',
						action: 'Delete HTML page',
					},
					{
						name: 'Clear Cache',
						value: 'clearCache',
						description: 'Clear CDN cache for page',
						action: 'Clear page cache',
					},
					{
						name: 'Get Form IDs',
						value: 'getFormIds',
						description: 'Get all form IDs from a page',
						action: 'Get form IDs',
					},
				],
				default: 'createFromFile',
			},

			// Name field for create/update operations
			{
				displayName: 'Page Name',
				name: 'name',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['createFromFile', 'createFromGithub', 'updateFromFile', 'updateFromGithub'],
					},
				},
				default: '',
				description: 'A friendly name for the HTML page',
			},

			// File upload fields
			{
				displayName: 'HTML File',
				name: 'htmlFile',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['createFromFile', 'updateFromFile'],
					},
				},
				default: 'data',
				description:
					'Name of the binary property containing the HTML file. Use "data" if using HTTP Request node.',
			},
			{
				displayName: 'File Name',
				name: 'fileName',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['createFromFile', 'updateFromFile'],
					},
				},
				default: 'index.html',
				description: 'The filename for the HTML file',
			},

			// GitHub URL field
			{
				displayName: 'GitHub File URL',
				name: 'githubFileUrl',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['createFromGithub', 'updateFromGithub'],
					},
				},
				default: '',
				description: 'The GitHub raw file URL',
				placeholder: 'https://raw.githubusercontent.com/user/repo/main/index.html',
			},

			// HTML Hosting ID for update/get/delete operations
			{
				displayName: 'HTML Hosting ID',
				name: 'htmlHostingId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: [
							'updateFromFile',
							'updateFromGithub',
							'get',
							'delete',
							'clearCache',
							'getFormIds',
						],
					},
				},
				default: '',
				description: 'The ID of the HTML hosting page',
			},

			// Custom slug
			{
				displayName: 'Custom Slug',
				name: 'customLandingId',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createFromFile', 'createFromGithub', 'updateFromFile', 'updateFromGithub'],
					},
				},
				default: '',
				description: 'Custom slug for branded URLs (e.g., "my-page")',
			},

			// Additional fields
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						operation: ['createFromFile', 'createFromGithub', 'updateFromFile', 'updateFromGithub'],
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
				],
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
		const apiKey = credentials.apiKey as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: any = {};

				if (operation === 'createFromFile') {
					const name = this.getNodeParameter('name', i) as string;
					const fileName = this.getNodeParameter('fileName', i) as string;
					const binaryPropertyName = this.getNodeParameter('htmlFile', i) as string;
					const customLandingId = this.getNodeParameter('customLandingId', i, '') as string;
					const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;

					const fileBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

					const body: any = { name, fileName };
					if (customLandingId) body.customLandingId = customLandingId;
					if (additionalFields.tag) body.tag = additionalFields.tag;
					if (additionalFields.refId) body.refId = additionalFields.refId;

					const createResponse = await makeApiRequest.call(this, apiKey, {
						method: 'POST',
						endpoint: API_ENDPOINTS.HTML_HOSTING,
						body,
					});

					// Upload file to the pre-signed URL
					await uploadFile.call(this, createResponse.uploadFileConfig.uploadUrl, fileBuffer);

					responseData = createResponse.details;
				} else if (operation === 'createFromGithub') {
					const name = this.getNodeParameter('name', i) as string;
					const githubFileUrl = this.getNodeParameter('githubFileUrl', i) as string;
					const customLandingId = this.getNodeParameter('customLandingId', i, '') as string;
					const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;

					const body: any = {
						name,
						githubInfo: { fileURL: githubFileUrl },
					};
					if (customLandingId) body.customLandingId = customLandingId;
					if (additionalFields.tag) body.tag = additionalFields.tag;
					if (additionalFields.refId) body.refId = additionalFields.refId;

					responseData = await makeApiRequest.call(this, apiKey, {
						method: 'POST',
						endpoint: API_ENDPOINTS.HTML_HOSTING,
						body,
					});
				} else if (operation === 'updateFromFile') {
					const htmlHostingId = this.getNodeParameter('htmlHostingId', i) as string;
					const name = this.getNodeParameter('name', i) as string;
					const fileName = this.getNodeParameter('fileName', i) as string;
					const binaryPropertyName = this.getNodeParameter('htmlFile', i) as string;
					const customLandingId = this.getNodeParameter('customLandingId', i, '') as string;
					const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;

					const fileBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

					const body: any = { name, fileName };
					if (customLandingId) body.customLandingId = customLandingId;
					if (additionalFields.tag) body.tag = additionalFields.tag;
					if (additionalFields.refId) body.refId = additionalFields.refId;

					const updateResponse = await makeApiRequest.call(this, apiKey, {
						method: 'PUT',
						endpoint: `${API_ENDPOINTS.HTML_HOSTING}/${htmlHostingId}`,
						body,
					});

					// Upload file if new file URL is provided
					if (updateResponse.uploadFileConfig) {
						await uploadFile.call(
							this,
							updateResponse.uploadFileConfig.uploadUrl,
							fileBuffer,
						);
					}

					responseData = updateResponse.details;
				} else if (operation === 'updateFromGithub') {
					const htmlHostingId = this.getNodeParameter('htmlHostingId', i) as string;
					const name = this.getNodeParameter('name', i) as string;
					const githubFileUrl = this.getNodeParameter('githubFileUrl', i) as string;
					const customLandingId = this.getNodeParameter('customLandingId', i, '') as string;
					const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;

					const body: any = {
						name,
						githubInfo: { fileURL: githubFileUrl },
					};
					if (customLandingId) body.customLandingId = customLandingId;
					if (additionalFields.tag) body.tag = additionalFields.tag;
					if (additionalFields.refId) body.refId = additionalFields.refId;

					responseData = await makeApiRequest.call(this, apiKey, {
						method: 'PUT',
						endpoint: `${API_ENDPOINTS.HTML_HOSTING}/${htmlHostingId}`,
						body,
					});
				} else if (operation === 'get') {
					const htmlHostingId = this.getNodeParameter('htmlHostingId', i) as string;
					responseData = await makeApiRequest.call(this, apiKey, {
						method: 'GET',
						endpoint: `${API_ENDPOINTS.HTML_HOSTING}/${htmlHostingId}`,
					});
				} else if (operation === 'delete') {
					const htmlHostingId = this.getNodeParameter('htmlHostingId', i) as string;
					responseData = await makeApiRequest.call(this, apiKey, {
						method: 'DELETE',
						endpoint: `${API_ENDPOINTS.HTML_HOSTING}/${htmlHostingId}`,
					});
				} else if (operation === 'clearCache') {
					const htmlHostingId = this.getNodeParameter('htmlHostingId', i) as string;
					responseData = await makeApiRequest.call(this, apiKey, {
						method: 'POST',
						endpoint: `${API_ENDPOINTS.HTML_HOSTING}/${htmlHostingId}/clear-cache`,
					});
				} else if (operation === 'getFormIds') {
					const htmlHostingId = this.getNodeParameter('htmlHostingId', i) as string;
					responseData = await makeApiRequest.call(this, apiKey, {
						method: 'GET',
						endpoint: `${API_ENDPOINTS.HTML_HOSTING}/${htmlHostingId}/forms`,
					});
				} else if (operation === 'list') {
					const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
					const filters = this.getNodeParameter('filters', i, {}) as any;

					const qs: IListParams = {};
					if (filters.tag) qs.tag = filters.tag;
					if (filters.refId) qs.refId = filters.refId;
					if (filters.search) {
						qs.name = filters.search;
						qs.htmlHostingId = filters.search;
					}

					if (returnAll) {
						responseData = await makePaginatedRequest.call(
							this,
							apiKey,
							API_ENDPOINTS.HTML_HOSTING,
							qs,
						);
					} else {
						const limit = this.getNodeParameter('limit', i, 50) as number;
						const result = await makeApiRequest.call(this, apiKey, {
							method: 'GET',
							endpoint: API_ENDPOINTS.HTML_HOSTING,
							qs: {
								...qs,
								page: 1,
								pageSize: limit,
							},
						});
						responseData = result.items || [];
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
