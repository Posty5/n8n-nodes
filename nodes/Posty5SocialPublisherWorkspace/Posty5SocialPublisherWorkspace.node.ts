import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { makeApiRequest, makePaginatedRequest } from '../../utils/api.helpers';
import { API_ENDPOINTS } from '../../utils/constants';

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
						name: 'Get For New Post',
						value: 'getForNewPost',
						description: 'Get workspace details for creating new post',
						action: 'Get workspace for new post',
					},
				],
				default: 'list',
			},

			// Workspace ID for get/getForNewPost operations
			{
				displayName: 'Workspace ID',
				name: 'workspaceId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['get', 'getForNewPost'],
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
		const apiKey = credentials.apiKey as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: any = {};

				if (operation === 'get') {
					const workspaceId = this.getNodeParameter('workspaceId', i) as string;
					responseData = await makeApiRequest.call(this, apiKey, {
						method: 'GET',
						endpoint: `${API_ENDPOINTS.SOCIAL_PUBLISHER_WORKSPACE}/${workspaceId}`,
					});
				} else if (operation === 'getForNewPost') {
					const workspaceId = this.getNodeParameter('workspaceId', i) as string;
					responseData = await makeApiRequest.call(this, apiKey, {
						method: 'GET',
						endpoint: `${API_ENDPOINTS.SOCIAL_PUBLISHER_WORKSPACE}/${workspaceId}/for-new-post`,
					});
				} else if (operation === 'list') {
					const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;

					if (returnAll) {
						responseData = await makePaginatedRequest.call(
							this,
							apiKey,
							API_ENDPOINTS.SOCIAL_PUBLISHER_WORKSPACE,
							{},
						);
					} else {
						const limit = this.getNodeParameter('limit', i, 50) as number;
						const result = await makeApiRequest.call(this, apiKey, {
							method: 'GET',
							endpoint: API_ENDPOINTS.SOCIAL_PUBLISHER_WORKSPACE,
							qs: {
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
