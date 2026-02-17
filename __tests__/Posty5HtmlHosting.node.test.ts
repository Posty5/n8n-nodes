import type { INodeExecutionData } from 'n8n-workflow';
import { Posty5HtmlHosting } from '../nodes/Posty5HtmlHosting/Posty5HtmlHosting.node';
import { createMockExecuteFunctions, TEST_CONFIG } from './setup';

describe('Posty5HtmlHosting', () => {
	let htmlHostingNode: Posty5HtmlHosting;

	beforeEach(() => {
		htmlHostingNode = new Posty5HtmlHosting();
		jest.clearAllMocks();
	});

	describe('Node Structure', () => {
		it('should have correct display name', () => {
			expect(htmlHostingNode.description.displayName).toBe('Posty5 HTML Hosting');
		});

		it('should have correct node name', () => {
			expect(htmlHostingNode.description.name).toBe('posty5HtmlHosting');
		});

		it('should define all 9 operations', () => {
			const operationProperty = htmlHostingNode.description.properties.find(
				(prop) => prop.name === 'operation',
			);
			expect(operationProperty).toBeDefined();
			expect(operationProperty?.type).toBe('options');

			const operations = (operationProperty as any)?.options || [];
			const operationValues = operations.map((op: any) => op.value);

			expect(operationValues).toContain('createFromFile');
			expect(operationValues).toContain('createFromGithub');
			expect(operationValues).toContain('updateFromFile');
			expect(operationValues).toContain('updateFromGithub');
			expect(operationValues).toContain('get');
			expect(operationValues).toContain('list');
			expect(operationValues).toContain('delete');
			expect(operationValues).toContain('clearCache');
			expect(operationValues).toContain('getFormIds');
			expect(operationValues.length).toBe(9);
		});

		it('should require posty5Api credentials', () => {
			const credentials = htmlHostingNode.description.credentials || [];
			expect(credentials).toHaveLength(1);
			expect(credentials[0].name).toBe('posty5Api');
			expect(credentials[0].required).toBe(true);
		});
	});

	describe('Create from File Operation', () => {
		it('should create with minimal fields (name, fileName, htmlFile binary)', async () => {
			const mockResponse = {
				details: {
					id: 'hh123',
					name: 'Test Page',
					htmlUrl: 'https://posty5.com/hh123',
				},
				uploadFileConfig: {
					uploadUrl: 'https://upload.example.com/presigned-url',
				},
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'createFromFile',
					name: 'Test Page',
					fileName: 'index.html',
					htmlFile: 'data',
					customLandingId: '',
					additionalFields: {},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			(mockExecuteFunctions.helpers.getBinaryDataBuffer as jest.Mock).mockResolvedValue(
				Buffer.from('<html>test</html>'),
			);

			(mockExecuteFunctions.helpers.httpRequest as jest.Mock)
				.mockResolvedValueOnce(mockResponse)
				.mockResolvedValueOnce({});

			const result = await htmlHostingNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					url: expect.stringMatching(/\/api\/html-hosting\/file$/),
					body: expect.objectContaining({
						name: 'Test Page',
						fileName: 'index.html',
					}),
				}),
			);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'PUT',
					url: 'https://upload.example.com/presigned-url',
					body: expect.any(Buffer),
				}),
			);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toEqual(mockResponse.details);
		});

		it('should create with customLandingId', async () => {
			const mockResponse = {
				details: {
					id: 'hh124',
					name: 'Custom Page',
					customLandingId: 'my-page',
					htmlUrl: 'https://posty5.com/my-page',
				},
				uploadFileConfig: {
					uploadUrl: 'https://upload.example.com/presigned-url',
				},
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'createFromFile',
					name: 'Custom Page',
					fileName: 'index.html',
					htmlFile: 'data',
					customLandingId: 'my-page',
					additionalFields: {},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			(mockExecuteFunctions.helpers.getBinaryDataBuffer as jest.Mock).mockResolvedValue(
				Buffer.from('<html>test</html>'),
			);

			(mockExecuteFunctions.helpers.httpRequest as jest.Mock)
				.mockResolvedValueOnce(mockResponse)
				.mockResolvedValueOnce({});

			const result = await htmlHostingNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					body: expect.objectContaining({
						name: 'Custom Page',
						fileName: 'index.html',
						customLandingId: 'my-page',
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockResponse.details);
		});

		it('should create with all additionalFields (tag, refId)', async () => {
			const mockResponse = {
				details: {
					id: 'hh125',
					name: 'Tagged Page',
					tag: 'marketing',
					refId: 'campaign-001',
					htmlUrl: 'https://posty5.com/hh125',
				},
				uploadFileConfig: {
					uploadUrl: 'https://upload.example.com/presigned-url',
				},
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'createFromFile',
					name: 'Tagged Page',
					fileName: 'index.html',
					htmlFile: 'data',
					customLandingId: '',
					additionalFields: {
						tag: 'marketing',
						refId: 'campaign-001',
					},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			(mockExecuteFunctions.helpers.getBinaryDataBuffer as jest.Mock).mockResolvedValue(
				Buffer.from('<html>test</html>'),
			);

			(mockExecuteFunctions.helpers.httpRequest as jest.Mock)
				.mockResolvedValueOnce(mockResponse)
				.mockResolvedValueOnce({});

			const result = await htmlHostingNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					body: expect.objectContaining({
						name: 'Tagged Page',
						fileName: 'index.html',
						tag: 'marketing',
						refId: 'campaign-001',
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockResponse.details);
		});
	});

	describe('Create from GitHub Operation', () => {
		it('should create with minimal fields (name, githubFileUrl)', async () => {
			const mockResponse = {
				id: 'hh126',
				name: 'GitHub Page',
				githubInfo: {
					fileURL: 'https://raw.githubusercontent.com/user/repo/main/index.html',
				},
				htmlUrl: 'https://posty5.com/hh126',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'createFromGithub',
					name: 'GitHub Page',
					githubFileUrl: 'https://raw.githubusercontent.com/user/repo/main/index.html',
					customLandingId: '',
					additionalFields: {},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await htmlHostingNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					url: expect.stringMatching(/\/api\/html-hosting\/github$/),
					body: expect.objectContaining({
						name: 'GitHub Page',
						githubInfo: {
							fileURL: 'https://raw.githubusercontent.com/user/repo/main/index.html',
						},
					}),
				}),
			);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toEqual(mockResponse);
		});

		it('should create with customLandingId and additionalFields', async () => {
			const mockResponse = {
				id: 'hh127',
				name: 'GitHub Custom Page',
				customLandingId: 'github-page',
				tag: 'github',
				refId: 'repo-123',
				githubInfo: {
					fileURL: 'https://raw.githubusercontent.com/user/repo/main/page.html',
				},
				htmlUrl: 'https://posty5.com/github-page',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'createFromGithub',
					name: 'GitHub Custom Page',
					githubFileUrl: 'https://raw.githubusercontent.com/user/repo/main/page.html',
					customLandingId: 'github-page',
					additionalFields: {
						tag: 'github',
						refId: 'repo-123',
					},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await htmlHostingNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					body: expect.objectContaining({
						name: 'GitHub Custom Page',
						customLandingId: 'github-page',
						tag: 'github',
						refId: 'repo-123',
						githubInfo: {
							fileURL: 'https://raw.githubusercontent.com/user/repo/main/page.html',
						},
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockResponse);
		});
	});

	describe('Update from File Operation', () => {
		it('should update with file (htmlHostingId, name, fileName, htmlFile binary)', async () => {
			const mockResponse = {
				details: {
					id: 'hh123',
					name: 'Updated Page',
					htmlUrl: 'https://posty5.com/hh123',
				},
				uploadFileConfig: {
					uploadUrl: 'https://upload.example.com/presigned-url-update',
				},
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'updateFromFile',
					htmlHostingId: 'hh123',
					name: 'Updated Page',
					fileName: 'index.html',
					htmlFile: 'data',
					customLandingId: '',
					additionalFields: {},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			(mockExecuteFunctions.helpers.getBinaryDataBuffer as jest.Mock).mockResolvedValue(
				Buffer.from('<html>updated</html>'),
			);

			(mockExecuteFunctions.helpers.httpRequest as jest.Mock)
				.mockResolvedValueOnce(mockResponse)
				.mockResolvedValueOnce({});

			const result = await htmlHostingNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'PUT',
					url: expect.stringMatching(/\/api\/html-hosting\/hh123\/file$/),
					body: expect.objectContaining({
						name: 'Updated Page',
						fileName: 'index.html',
					}),
				}),
			);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'PUT',
					url: 'https://upload.example.com/presigned-url-update',
					body: expect.any(Buffer),
				}),
			);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toEqual(mockResponse.details);
		});

		it('should update with customLandingId and additionalFields', async () => {
			const mockResponse = {
				details: {
					id: 'hh123',
					name: 'Updated Custom Page',
					customLandingId: 'updated-page',
					tag: 'updated',
					refId: 'ref-002',
					htmlUrl: 'https://posty5.com/updated-page',
				},
				uploadFileConfig: {
					uploadUrl: 'https://upload.example.com/presigned-url-update',
				},
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'updateFromFile',
					htmlHostingId: 'hh123',
					name: 'Updated Custom Page',
					fileName: 'index.html',
					htmlFile: 'data',
					customLandingId: 'updated-page',
					additionalFields: {
						tag: 'updated',
						refId: 'ref-002',
					},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			(mockExecuteFunctions.helpers.getBinaryDataBuffer as jest.Mock).mockResolvedValue(
				Buffer.from('<html>updated</html>'),
			);

			(mockExecuteFunctions.helpers.httpRequest as jest.Mock)
				.mockResolvedValueOnce(mockResponse)
				.mockResolvedValueOnce({});

			const result = await htmlHostingNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'PUT',
					url: expect.stringMatching(/\/api\/html-hosting\/hh123\/file$/),
					body: expect.objectContaining({
						name: 'Updated Custom Page',
						fileName: 'index.html',
						customLandingId: 'updated-page',
						tag: 'updated',
						refId: 'ref-002',
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockResponse.details);
		});
	});

	describe('Update from GitHub Operation', () => {
		it('should update from GitHub (htmlHostingId, name, githubFileUrl)', async () => {
			const mockResponse = {
				id: 'hh128',
				name: 'Updated GitHub Page',
				githubInfo: {
					fileURL: 'https://raw.githubusercontent.com/user/repo/main/updated.html',
				},
				htmlUrl: 'https://posty5.com/hh128',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'updateFromGithub',
					htmlHostingId: 'hh128',
					name: 'Updated GitHub Page',
					githubFileUrl: 'https://raw.githubusercontent.com/user/repo/main/updated.html',
					customLandingId: '',
					additionalFields: {},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await htmlHostingNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'PUT',
					url: expect.stringMatching(/\/api\/html-hosting\/hh128\/github$/),
					body: expect.objectContaining({
						name: 'Updated GitHub Page',
						githubInfo: {
							fileURL: 'https://raw.githubusercontent.com/user/repo/main/updated.html',
						},
					}),
				}),
			);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toEqual(mockResponse);
		});

		it('should update with customLandingId and additionalFields', async () => {
			const mockResponse = {
				id: 'hh129',
				name: 'Updated GitHub Custom',
				customLandingId: 'github-updated',
				tag: 'github-tag',
				refId: 'github-ref',
				githubInfo: {
					fileURL: 'https://raw.githubusercontent.com/user/repo/main/custom.html',
				},
				htmlUrl: 'https://posty5.com/github-updated',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'updateFromGithub',
					htmlHostingId: 'hh129',
					name: 'Updated GitHub Custom',
					githubFileUrl: 'https://raw.githubusercontent.com/user/repo/main/custom.html',
					customLandingId: 'github-updated',
					additionalFields: {
						tag: 'github-tag',
						refId: 'github-ref',
					},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await htmlHostingNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'PUT',
					url: expect.stringMatching(/\/api\/html-hosting\/hh129\/github$/),
					body: expect.objectContaining({
						name: 'Updated GitHub Custom',
						customLandingId: 'github-updated',
						tag: 'github-tag',
						refId: 'github-ref',
						githubInfo: {
							fileURL: 'https://raw.githubusercontent.com/user/repo/main/custom.html',
						},
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockResponse);
		});
	});

	describe('Get Operation', () => {
		it('should get HTML hosting by ID', async () => {
			const mockResponse = {
				id: 'hh123',
				name: 'Test Page',
				htmlUrl: 'https://posty5.com/hh123',
				createdAt: '2026-01-01T00:00:00Z',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'get',
					htmlHostingId: 'hh123',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await htmlHostingNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'GET',
					url: expect.stringMatching(/\/api\/html-hosting\/hh123$/),
				}),
			);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toEqual(mockResponse);
		});
	});

	describe('Delete Operation', () => {
		it('should delete HTML hosting by ID', async () => {
			const mockResponse = {
				success: true,
				message: 'HTML hosting deleted successfully',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'delete',
					htmlHostingId: 'hh123',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await htmlHostingNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'DELETE',
					url: expect.stringMatching(/\/api\/html-hosting\/hh123$/),
				}),
			);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toEqual(mockResponse);
		});
	});

	describe('Clear Cache Operation', () => {
		it('should clear cache by htmlHostingId', async () => {
			const mockResponse = {
				success: true,
				message: 'Cache cleared successfully',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'clearCache',
					htmlHostingId: 'hh123',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await htmlHostingNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'PUT',
					url: expect.stringMatching(/\/api\/html-hosting\/hh123\/clean-cache$/),
				}),
			);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toEqual(mockResponse);
		});
	});

	describe('Get Form IDs Operation', () => {
		it('should get form IDs by htmlHostingId', async () => {
			const mockResponse = {
				formIds: ['form-1', 'form-2', 'contact-form'],
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'getFormIds',
					htmlHostingId: 'hh123',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await htmlHostingNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'GET',
					url: expect.stringMatching(/\/api\/html-hosting\/lookup-froms\/hh123$/),
				}),
			);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toEqual(mockResponse);
		});
	});

	describe('List Operation', () => {
		it('should list with limit', async () => {
			const mockResponse = {
				items: [
					{ id: 'hh1', name: 'Page 1' },
					{ id: 'hh2', name: 'Page 2' },
					{ id: 'hh3', name: 'Page 3' },
				],
				total: 10,
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'list',
					returnAll: false,
					limit: 3,
					filters: {},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await htmlHostingNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'GET',
					url: expect.stringMatching(/\/api\/html-hosting$/),
					qs: expect.objectContaining({
						page: 1,
						pageSize: 3,
					}),
				}),
			);

			expect(result[0]).toHaveLength(3);
		});

		it('should list with returnAll=true', async () => {
			const mockResponse = [
				{ id: 'hh1', name: 'Page 1' },
				{ id: 'hh2', name: 'Page 2' },
				{ id: 'hh3', name: 'Page 3' },
				{ id: 'hh4', name: 'Page 4' },
				{ id: 'hh5', name: 'Page 5' },
			];

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'list',
					returnAll: true,
					filters: {},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			// Mock makePaginatedRequest by intercepting httpRequest
			(mockExecuteFunctions.helpers.httpRequest as jest.Mock).mockResolvedValueOnce(mockResponse);

			const result = await htmlHostingNode.execute.call(mockExecuteFunctions);

			expect(result[0]).toHaveLength(5);
		});

		it('should list with tag filter', async () => {
			const mockResponse = {
				items: [
					{ id: 'hh1', name: 'Marketing Page 1', tag: 'marketing' },
					{ id: 'hh2', name: 'Marketing Page 2', tag: 'marketing' },
				],
				total: 2,
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'list',
					returnAll: false,
					limit: 50,
					filters: {
						tag: 'marketing',
					},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await htmlHostingNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'GET',
					qs: expect.objectContaining({
						tag: 'marketing',
					}),
				}),
			);

			expect(result[0]).toHaveLength(2);
		});

		it('should list with search filter (name and htmlHostingId)', async () => {
			const mockResponse = {
				items: [
					{ id: 'hh123', name: 'Campaign Landing Page' },
					{ id: 'hh456', name: 'Campaign Promo Page' },
				],
				total: 2,
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'list',
					returnAll: false,
					limit: 50,
					filters: {
						search: 'campaign',
					},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await htmlHostingNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'GET',
					qs: expect.objectContaining({
						name: 'campaign',
						htmlHostingId: 'campaign',
					}),
				}),
			);

			expect(result[0]).toHaveLength(2);
		});
	});

	describe('Error Handling', () => {
		it('should throw error when continueOnFail is false', async () => {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'get',
					htmlHostingId: 'invalid-id',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
			);

			(mockExecuteFunctions.helpers.httpRequest as jest.Mock).mockRejectedValue(
				new Error('HTML hosting not found'),
			);

			(mockExecuteFunctions.continueOnFail as jest.Mock).mockReturnValue(false);

			await expect(htmlHostingNode.execute.call(mockExecuteFunctions)).rejects.toThrow(
				'HTML hosting not found',
			);
		});

		it('should return error in JSON when continueOnFail is true', async () => {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'get',
					htmlHostingId: 'invalid-id',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
			);

			(mockExecuteFunctions.helpers.httpRequest as jest.Mock).mockRejectedValue(
				new Error('HTML hosting not found'),
			);

			(mockExecuteFunctions.continueOnFail as jest.Mock).mockReturnValue(true);

			const result = await htmlHostingNode.execute.call(mockExecuteFunctions);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toHaveProperty('error');
			expect(result[0][0].json.error).toContain('HTML hosting not found');
		});
	});

	describe('Multiple Items Processing', () => {
		it('should process 2 items in batch', async () => {
			const inputData: INodeExecutionData[] = [
				{ json: { pageId: 'hh1' } },
				{ json: { pageId: 'hh2' } },
			];

			const mockResponse1 = {
				id: 'hh1',
				name: 'Page 1',
				htmlUrl: 'https://posty5.com/hh1',
			};

			const mockResponse2 = {
				id: 'hh2',
				name: 'Page 2',
				htmlUrl: 'https://posty5.com/hh2',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'get',
					htmlHostingId: 'hh1',
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
					if (paramName === 'htmlHostingId') {
						if (itemIndex === 0) return 'hh1';
						if (itemIndex === 1) return 'hh2';
					}
					return undefined;
				},
			);

			const result = await htmlHostingNode.execute.call(mockExecuteFunctions);

			expect(result[0]).toHaveLength(2);
			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledTimes(2);
		});
	});
});
