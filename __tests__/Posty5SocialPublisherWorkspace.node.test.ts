import type { INodeExecutionData } from 'n8n-workflow';
import { Posty5SocialPublisherWorkspace } from '../nodes/Posty5SocialPublisherWorkspace/Posty5SocialPublisherWorkspace.node';
import { createMockExecuteFunctions, TEST_CONFIG } from './setup';

describe('Posty5SocialPublisherWorkspace', () => {
	let workspaceNode: Posty5SocialPublisherWorkspace;

	beforeEach(() => {
		workspaceNode = new Posty5SocialPublisherWorkspace();
		jest.clearAllMocks();
	});

	describe('Node Structure', () => {
		it('should have correct display name', () => {
			expect(workspaceNode.description.displayName).toBe('Posty5 Social Publisher Workspace');
		});

		it('should have correct node name', () => {
			expect(workspaceNode.description.name).toBe('posty5SocialPublisherWorkspace');
		});

		it('should define all operations', () => {
			const operationProperty = workspaceNode.description.properties.find(
				(prop) => prop.name === 'operation',
			);
			expect(operationProperty).toBeDefined();
			expect(operationProperty?.type).toBe('options');

			const operations = (operationProperty as any)?.options || [];
			const operationValues = operations.map((op: any) => op.value);

			expect(operationValues).toContain('get');
			expect(operationValues).toContain('list');
			expect(operationValues).toContain('getForNewPost');
			expect(operations).toHaveLength(3);
		});

		it('should require posty5Api credentials', () => {
			const credentials = workspaceNode.description.credentials;
			expect(credentials).toBeDefined();
			expect(credentials).toHaveLength(1);
			expect(credentials?.[0].name).toBe('posty5Api');
			expect(credentials?.[0].required).toBe(true);
		});
	});

	describe('GET Operation', () => {
		it('should get workspace by workspaceId', async () => {
			const mockResponse = {
				id: 'ws123',
				name: 'Test Workspace',
				description: 'Test workspace description',
				createdAt: '2024-01-01T00:00:00.000Z',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'get',
					workspaceId: 'ws123',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await workspaceNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'GET',
					url: expect.stringMatching(/\/api\/social-publisher-workspace\/ws123$/),
				}),
			);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toEqual(mockResponse);
		});
	});

	describe('GET FOR NEW TASK Operation', () => {
		it('should get workspace details for creating new post by workspaceId', async () => {
			const mockResponse = {
				id: 'ws123',
				name: 'Test Workspace',
				description: 'Test workspace description',
				channels: [
					{
						id: 'ch1',
						provider: 'twitter',
						name: 'Twitter Channel',
					},
					{
						id: 'ch2',
						provider: 'facebook',
						name: 'Facebook Channel',
					},
				],
				defaultSettings: {
					timezone: 'UTC',
					language: 'en',
				},
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'getForNewPost',
					workspaceId: 'ws123',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await workspaceNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'GET',
					url: expect.stringMatching(/\/api\/social-publisher-workspace\/ws123\/for-new-post$/),
				}),
			);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toEqual(mockResponse);
		});
	});

	describe('LIST Operation', () => {
		it('should list workspaces with limit', async () => {
			const mockResponse = {
				items: [
					{
						id: 'ws1',
						name: 'Workspace 1',
						description: 'First workspace',
					},
					{
						id: 'ws2',
						name: 'Workspace 2',
						description: 'Second workspace',
					},
				],
				pagination: {
					page: 1,
					pageSize: 10,
					totalItems: 2,
					totalPages: 1,
				},
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'list',
					returnAll: false,
					limit: 10,
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await workspaceNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'GET',
					url: expect.stringMatching(/\/api\/social-publisher-workspace$/),
					qs: expect.objectContaining({
						page: 1,
						pageSize: 10,
					}),
				}),
			);

			expect(result[0]).toHaveLength(2);
			expect(result[0][0].json).toEqual(mockResponse.items[0]);
			expect(result[0][1].json).toEqual(mockResponse.items[1]);
		});

		it('should list all workspaces when returnAll is true', async () => {
			const mockResponse = [
				{
					id: 'ws1',
					name: 'Workspace 1',
					description: 'First workspace',
				},
				{
					id: 'ws2',
					name: 'Workspace 2',
					description: 'Second workspace',
				},
				{
					id: 'ws3',
					name: 'Workspace 3',
					description: 'Third workspace',
				},
			];

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'list',
					returnAll: true,
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await workspaceNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalled();

			expect(result[0]).toHaveLength(3);
			expect(result[0][0].json).toEqual(mockResponse[0]);
			expect(result[0][1].json).toEqual(mockResponse[1]);
			expect(result[0][2].json).toEqual(mockResponse[2]);
		});
	});

	describe('Error Handling', () => {
		it('should throw error when continueOnFail is false', async () => {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'get',
					workspaceId: 'invalid-id',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
			);

			(mockExecuteFunctions.helpers.httpRequest as jest.Mock).mockRejectedValue(
				new Error('Workspace not found'),
			);

			(mockExecuteFunctions.continueOnFail as jest.Mock).mockReturnValue(false);

			await expect(workspaceNode.execute.call(mockExecuteFunctions)).rejects.toThrow(
				'Workspace not found',
			);
		});

		it('should continue on error when continueOnFail is true', async () => {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'get',
					workspaceId: 'invalid-id',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
			);

			(mockExecuteFunctions.helpers.httpRequest as jest.Mock).mockRejectedValue(
				new Error('Workspace not found'),
			);

			(mockExecuteFunctions.continueOnFail as jest.Mock).mockReturnValue(true);

			const result = await workspaceNode.execute.call(mockExecuteFunctions);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toHaveProperty('error');
			expect(result[0][0].json.error).toContain('Workspace not found');
		});
	});

	describe('Multiple Items Processing', () => {
		it('should process multiple items in batch', async () => {
			const inputData: INodeExecutionData[] = [
				{ json: { workspaceId: 'ws1' } },
				{ json: { workspaceId: 'ws2' } },
			];

			const mockResponse1 = {
				id: 'ws1',
				name: 'Workspace 1',
				description: 'First workspace',
			};

			const mockResponse2 = {
				id: 'ws2',
				name: 'Workspace 2',
				description: 'Second workspace',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'get',
					workspaceId: 'ws1',
				},
				inputData,
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse1,
			);

			(mockExecuteFunctions.helpers.httpRequest as jest.Mock)
				.mockResolvedValueOnce(mockResponse1)
				.mockResolvedValueOnce(mockResponse2);

			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
				(paramName: string, itemIndex: number) => {
					if (paramName === 'operation') return 'get';
					if (paramName === 'workspaceId') {
						if (itemIndex === 0) return 'ws1';
						if (itemIndex === 1) return 'ws2';
					}
					return undefined;
				},
			);

			const result = await workspaceNode.execute.call(mockExecuteFunctions);

			expect(result[0]).toHaveLength(2);
			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledTimes(2);
			expect(result[0][0].json).toEqual(mockResponse1);
			expect(result[0][1].json).toEqual(mockResponse2);
		});
	});
});
