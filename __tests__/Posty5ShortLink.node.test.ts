import type { INodeExecutionData } from 'n8n-workflow';
import { Posty5ShortLink } from '../nodes/Posty5ShortLink/Posty5ShortLink.node';
import { createMockExecuteFunctions, TEST_CONFIG } from './setup';

describe('Posty5ShortLink', () => {
	let shortLinkNode: Posty5ShortLink;

	beforeEach(() => {
		shortLinkNode = new Posty5ShortLink();
		jest.clearAllMocks();
	});

	describe('Node Structure', () => {
		it('should have correct display name', () => {
			expect(shortLinkNode.description.displayName).toBe('Posty5 Short Link');
		});

		it('should have correct node name', () => {
			expect(shortLinkNode.description.name).toBe('posty5ShortLink');
		});

		it('should define all operations', () => {
			const operationProperty = shortLinkNode.description.properties.find(
				(prop) => prop.name === 'operation',
			);
			expect(operationProperty).toBeDefined();
			expect(operationProperty?.type).toBe('options');

			const operations = (operationProperty as any)?.options || [];
			const operationValues = operations.map((op: any) => op.value);

			expect(operationValues).toContain('create');
			expect(operationValues).toContain('get');
			expect(operationValues).toContain('update');
			expect(operationValues).toContain('delete');
			expect(operationValues).toContain('list');
		});

		it('should require posty5Api credentials', () => {
			const credentials = shortLinkNode.description.credentials || [];
			expect(credentials).toHaveLength(1);
			expect(credentials[0].name).toBe('posty5Api');
			expect(credentials[0].required).toBe(true);
		});
	});

	describe('Create Operation', () => {
		it('should create short link with minimal fields (url only)', async () => {
			const mockResponse = {
				id: 'sl123',
				baseUrl: 'https://example.com',
				shortUrl: 'https://posty5.com/abc123',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'create',
					url: 'https://example.com',
					name: '',
					customLandingId: '',
					additionalFields: {},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await shortLinkNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					url: expect.stringMatching(/\/api\/short-link$/),
					body: expect.objectContaining({
						baseUrl: 'https://example.com',
						createdFrom: 'n8n',
					}),
				}),
			);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toEqual(mockResponse);
		});

		it('should create short link with name and customLandingId', async () => {
			const mockResponse = {
				id: 'sl124',
				name: 'My Campaign',
				baseUrl: 'https://example.com/promo',
				customLandingId: 'my-link',
				shortUrl: 'https://posty5.com/my-link',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'create',
					url: 'https://example.com/promo',
					name: 'My Campaign',
					customLandingId: 'my-link',
					additionalFields: {},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await shortLinkNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					body: expect.objectContaining({
						baseUrl: 'https://example.com/promo',
						name: 'My Campaign',
						customLandingId: 'my-link',
						createdFrom: 'n8n',
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockResponse);
		});

		it('should create short link with all additionalFields', async () => {
			const mockResponse = {
				id: 'sl125',
				name: 'Full Featured Link',
				baseUrl: 'https://example.com/full',
				tag: 'campaign-2024',
				refId: 'ref-001',
				templateId: 'tpl-123',
				isEnableMonetization: true,
				shortUrl: 'https://posty5.com/xyz789',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'create',
					url: 'https://example.com/full',
					name: 'Full Featured Link',
					customLandingId: '',
					additionalFields: {
						tag: 'campaign-2024',
						refId: 'ref-001',
						templateId: 'tpl-123',
						isEnableMonetization: true,
					},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await shortLinkNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					body: expect.objectContaining({
						baseUrl: 'https://example.com/full',
						name: 'Full Featured Link',
						tag: 'campaign-2024',
						refId: 'ref-001',
						templateId: 'tpl-123',
						isEnableMonetization: true,
						createdFrom: 'n8n',
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockResponse);
		});

		it('should create short link with pageInfo', async () => {
			const mockResponse = {
				id: 'sl126',
				name: 'Link with Page Info',
				baseUrl: 'https://example.com/page',
				pageInfo: {
					title: 'Landing Page Title',
					description: 'Landing Page Description',
				},
				shortUrl: 'https://posty5.com/page123',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'create',
					url: 'https://example.com/page',
					name: 'Link with Page Info',
					customLandingId: '',
					additionalFields: {
						pageTitle: 'Landing Page Title',
						pageDescription: 'Landing Page Description',
					},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await shortLinkNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					body: expect.objectContaining({
						baseUrl: 'https://example.com/page',
						name: 'Link with Page Info',
						pageInfo: {
							title: 'Landing Page Title',
							description: 'Landing Page Description',
						},
						createdFrom: 'n8n',
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockResponse);
		});
	});

	describe('Get Operation', () => {
		it('should get short link by ID', async () => {
			const mockResponse = {
				id: 'sl123',
				name: 'Test Link',
				baseUrl: 'https://example.com',
				shortUrl: 'https://posty5.com/abc123',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'get',
					shortLinkId: 'sl123',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await shortLinkNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'GET',
					url: expect.stringMatching(/\/api\/short-link\/sl123$/),
				}),
			);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toEqual(mockResponse);
		});
	});

	describe('Update Operation', () => {
		it('should update short link name', async () => {
			const mockResponse = {
				id: 'sl123',
				name: 'Updated Name',
				baseUrl: 'https://example.com',
				shortUrl: 'https://posty5.com/abc123',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'update',
					shortLinkId: 'sl123',
					name: 'Updated Name',
					customLandingId: '',
					additionalFields: {},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await shortLinkNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'PUT',
					url: expect.stringMatching(/\/api\/short-link\/sl123$/),
					body: expect.objectContaining({
						name: 'Updated Name',
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockResponse);
		});

		it('should update short link customLandingId', async () => {
			const mockResponse = {
				id: 'sl123',
				name: 'Test Link',
				baseUrl: 'https://example.com',
				customLandingId: 'new-custom-slug',
				shortUrl: 'https://posty5.com/new-custom-slug',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'update',
					shortLinkId: 'sl123',
					name: 'Test Link',
					customLandingId: 'new-custom-slug',
					additionalFields: {},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await shortLinkNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'PUT',
					body: expect.objectContaining({
						name: 'Test Link',
						customLandingId: 'new-custom-slug',
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockResponse);
		});

		it('should update short link with all additionalFields and pageInfo', async () => {
			const mockResponse = {
				id: 'sl123',
				name: 'Fully Updated Link',
				baseUrl: 'https://example.com',
				customLandingId: 'updated-slug',
				tag: 'new-tag',
				refId: 'ref-002',
				templateId: 'tpl-456',
				isEnableMonetization: false,
				pageInfo: {
					title: 'New Title',
					description: 'New Description',
				},
				shortUrl: 'https://posty5.com/updated-slug',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'update',
					shortLinkId: 'sl123',
					name: 'Fully Updated Link',
					customLandingId: 'updated-slug',
					additionalFields: {
						tag: 'new-tag',
						refId: 'ref-002',
						templateId: 'tpl-456',
						isEnableMonetization: false,
						pageTitle: 'New Title',
						pageDescription: 'New Description',
					},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await shortLinkNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'PUT',
					body: expect.objectContaining({
						name: 'Fully Updated Link',
						customLandingId: 'updated-slug',
						tag: 'new-tag',
						refId: 'ref-002',
						templateId: 'tpl-456',
						isEnableMonetization: false,
						pageInfo: {
							title: 'New Title',
							description: 'New Description',
						},
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockResponse);
		});
	});

	describe('Delete Operation', () => {
		it('should delete short link by ID', async () => {
			const mockResponse = {
				success: true,
				message: 'Short link deleted successfully',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'delete',
					shortLinkId: 'sl123',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await shortLinkNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'DELETE',
					url: expect.stringMatching(/\/api\/short-link\/sl123$/),
				}),
			);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toEqual(mockResponse);
		});
	});

	describe('List Operation', () => {
		it('should list short links with limit', async () => {
			const mockResponse = {
				items: [
					{
						id: 'sl1',
						name: 'Link 1',
						baseUrl: 'https://example.com/1',
						shortUrl: 'https://posty5.com/abc1',
					},
					{
						id: 'sl2',
						name: 'Link 2',
						baseUrl: 'https://example.com/2',
						shortUrl: 'https://posty5.com/abc2',
					},
				],
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'list',
					returnAll: false,
					limit: 2,
					filters: {},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await shortLinkNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'GET',
					url: expect.stringMatching(/\/api\/short-link$/),
					qs: expect.objectContaining({
						page: 1,
						pageSize: 2,
					}),
				}),
			);

			expect(result[0]).toHaveLength(2);
		});

		it('should list all short links with returnAll=true', async () => {
			const mockResponse = [
				{
					id: 'sl1',
					name: 'Link 1',
					baseUrl: 'https://example.com/1',
					shortUrl: 'https://posty5.com/abc1',
				},
				{
					id: 'sl2',
					name: 'Link 2',
					baseUrl: 'https://example.com/2',
					shortUrl: 'https://posty5.com/abc2',
				},
				{
					id: 'sl3',
					name: 'Link 3',
					baseUrl: 'https://example.com/3',
					shortUrl: 'https://posty5.com/abc3',
				},
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

			const result = await shortLinkNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalled();
			expect(result[0]).toHaveLength(3);
		});

		it('should list short links with tag filter', async () => {
			const mockResponse = {
				items: [
					{
						id: 'sl1',
						name: 'Tagged Link',
						baseUrl: 'https://example.com',
						tag: 'campaign-2024',
						shortUrl: 'https://posty5.com/tagged',
					},
				],
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'list',
					returnAll: false,
					limit: 50,
					filters: {
						tag: 'campaign-2024',
					},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await shortLinkNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					qs: expect.objectContaining({
						tag: 'campaign-2024',
					}),
				}),
			);

			expect(result[0]).toHaveLength(1);
		});

		it('should list short links with search filter (name and baseUrl)', async () => {
			const mockResponse = {
				items: [
					{
						id: 'sl1',
						name: 'Search Result',
						baseUrl: 'https://example.com/search',
						shortUrl: 'https://posty5.com/search',
					},
				],
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'list',
					returnAll: false,
					limit: 50,
					filters: {
						search: 'Search Result',
					},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await shortLinkNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					qs: expect.objectContaining({
						name: 'Search Result',
						baseUrl: 'Search Result',
					}),
				}),
			);

			expect(result[0]).toHaveLength(1);
		});
	});

	describe('Error Handling', () => {
		it('should throw error when continueOnFail is false', async () => {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'get',
					shortLinkId: 'invalid-id',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
			);

			(mockExecuteFunctions.helpers.httpRequest as jest.Mock).mockRejectedValue(
				new Error('Short link not found'),
			);

			(mockExecuteFunctions.continueOnFail as jest.Mock).mockReturnValue(false);

			await expect(shortLinkNode.execute.call(mockExecuteFunctions)).rejects.toThrow(
				'Short link not found',
			);
		});

		it('should return error in JSON when continueOnFail is true', async () => {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'get',
					shortLinkId: 'invalid-id',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
			);

			(mockExecuteFunctions.helpers.httpRequest as jest.Mock).mockRejectedValue(
				new Error('Short link not found'),
			);

			(mockExecuteFunctions.continueOnFail as jest.Mock).mockReturnValue(true);

			const result = await shortLinkNode.execute.call(mockExecuteFunctions);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toHaveProperty('error');
			expect(result[0][0].json.error).toContain('Short link not found');
		});
	});

	describe('Multiple Items Processing', () => {
		it('should process 2 items in batch', async () => {
			const inputData: INodeExecutionData[] = [
				{ json: { linkId: 'sl1' } },
				{ json: { linkId: 'sl2' } },
			];

			const mockResponse1 = {
				id: 'sl1',
				name: 'Link 1',
				baseUrl: 'https://example.com/1',
				shortUrl: 'https://posty5.com/abc1',
			};

			const mockResponse2 = {
				id: 'sl2',
				name: 'Link 2',
				baseUrl: 'https://example.com/2',
				shortUrl: 'https://posty5.com/abc2',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'get',
					shortLinkId: 'sl1',
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
					if (paramName === 'shortLinkId') {
						if (itemIndex === 0) return 'sl1';
						if (itemIndex === 1) return 'sl2';
					}
					return undefined;
				},
			);

			const result = await shortLinkNode.execute.call(mockExecuteFunctions);

			expect(result[0]).toHaveLength(2);
			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledTimes(2);
		});
	});
});
