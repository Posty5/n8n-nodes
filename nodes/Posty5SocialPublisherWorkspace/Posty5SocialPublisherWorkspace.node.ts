import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { SocialPublisherWorkspaceClient } from '@posty5/social-publisher-workspace';

export class Posty5SocialPublisherWorkspace implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Posty5 Social Publisher Workspace',
		name: 'posty5SocialPublisherWorkspace',
		icon: 'file:posty5.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Manage social media publishing workspaces',
		defaults: {
			name: 'Posty5 Social Publisher Workspace',
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
						description: 'Create a new workspace',
						action: 'Create a workspace',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a workspace',
						action: 'Delete a workspace',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a workspace',
						action: 'Get a workspace',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List all workspaces',
						action: 'List workspaces',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a workspace',
						action: 'Update a workspace',
					},
				],
				default: 'create',
			},

			// Create/Update operation fields
			{
				displayName: 'Workspace Name',
				name: 'name',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				default: '',
				description: 'Name of the workspace',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				default: '',
				description: 'Description of the workspace',
			},
			{
				displayName: 'Logo',
				name: 'logo',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				default: 'data',
				description: 'Name of the binary property containing the logo image (optional)',
			},

			// Workspace ID for get/update/delete operations
			{
				displayName: 'Workspace ID',
				name: 'workspaceId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['get', 'update', 'delete'],
					},
				},
				default: '',
				description: 'The ID of the workspace',
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
		const client = new SocialPublisherWorkspaceClient(http);

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: any = {};

				if (operation === 'create') {
					const name = this.getNodeParameter('name', i) as string;
					const description = this.getNodeParameter('description', i, '') as string;
					const logoBinaryProperty = this.getNodeParameter('logo', i, '') as string;

					const params: any = { name };
					if (description) params.description = description;

					// Handle optional logo upload
					let logoFile: File | undefined;
					if (logoBinaryProperty && items[i].binary?.[logoBinaryProperty]) {
						const logoBuffer = await this.helpers.getBinaryDataBuffer(i, logoBinaryProperty);
						const logoBlob = new Blob([logoBuffer], { type: 'image/png' });
						logoFile = new File([logoBlob], 'logo.png', { type: 'image/png' });
					}

					responseData = await client.create(params, logoFile);
				} else if (operation === 'get') {
					const workspaceId = this.getNodeParameter('workspaceId', i) as string;
					responseData = await client.get(workspaceId);
				} else if (operation === 'update') {
					const workspaceId = this.getNodeParameter('workspaceId', i) as string;
					const name = this.getNodeParameter('name', i) as string;
					const description = this.getNodeParameter('description', i, '') as string;
					const logoBinaryProperty = this.getNodeParameter('logo', i, '') as string;

					const params: any = { name };
					if (description) params.description = description;

					// Handle optional logo upload
					let logoFile: File | undefined;
					if (logoBinaryProperty && items[i].binary?.[logoBinaryProperty]) {
						const logoBuffer = await this.helpers.getBinaryDataBuffer(i, logoBinaryProperty);
						const logoBlob = new Blob([logoBuffer], { type: 'image/png' });
						logoFile = new File([logoBlob], 'logo.png', { type: 'image/png' });
					}

					responseData = await client.update(workspaceId, params, logoFile);
				} else if (operation === 'delete') {
					const workspaceId = this.getNodeParameter('workspaceId', i) as string;
					responseData = await client.delete(workspaceId);
				} else if (operation === 'list') {
					const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;

					const params: any = {
						page: 1,
						pageSize: returnAll ? 100 : this.getNodeParameter('limit', i, 50),
					};

					if (returnAll) {
						let allResults: any[] = [];
						let page = 1;
						let hasMore = true;

						while (hasMore) {
							const result = await client.list({}, { page, pageSize: params.pageSize });
							allResults = allResults.concat(result.items);
							hasMore = result.items.length === params.pageSize;
							page++;
						}

						responseData = allResults;
					} else {
						const result = await client.list({}, { page: 1, pageSize: params.pageSize });
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
