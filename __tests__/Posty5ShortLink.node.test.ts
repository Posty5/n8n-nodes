import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { Posty5ShortLink } from '../nodes/Posty5ShortLink/Posty5ShortLink.node';
import { describeGetAnalyticsOperation } from './link-analytics.shared';
import { createMockExecuteFunctions, TEST_CONFIG } from './setup';

/** The body of the n-th request the node made. */
function requestBody(mockExecuteFunctions: IExecuteFunctions, callIndex = 0): any {
	return (mockExecuteFunctions.helpers.httpRequest as jest.Mock).mock.calls[callIndex][0].body;
}

/** Every property of the node with this name (a name may be declared once per operation). */
function propertiesNamed(node: Posty5ShortLink, name: string): any[] {
	return node.description.properties.filter((prop) => prop.name === name);
}

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
			expect(operationValues).toContain('getAnalytics');
			expect(operationValues).toContain('getStatistics');
		});

		it('should require posty5Api credentials', () => {
			const credentials = shortLinkNode.description.credentials || [];
			expect(credentials).toHaveLength(1);
			expect(credentials[0].name).toBe('posty5Api');
			expect(credentials[0].required).toBe(true);
		});

		it('should make Template a required dropdown on Create and an optional one on Update', () => {
			const templates = propertiesNamed(shortLinkNode, 'templateId');
			const onCreate = templates.find((prop) => prop.displayOptions.show.operation.includes('create'));
			const onUpdate = templates.find((prop) => prop.displayOptions.show.operation.includes('update'));

			expect(onCreate).toEqual(
				expect.objectContaining({
					type: 'options',
					required: true,
					typeOptions: { loadOptionsMethod: 'getQrTemplates' },
				}),
			);
			expect(onUpdate).toEqual(
				expect.objectContaining({
					type: 'options',
					typeOptions: { loadOptionsMethod: 'getQrTemplates' },
				}),
			);
			expect(onUpdate.required).toBeFalsy();
			expect(typeof shortLinkNode.methods.loadOptions.getQrTemplates).toBe('function');
		});

		it('should show Custom Slug on Create only', () => {
			const [customSlug] = propertiesNamed(shortLinkNode, 'customLandingId');
			expect(customSlug.displayOptions.show.operation).toEqual(['create', 'createMany']);
		});

		it('should not offer monetization anywhere', () => {
			expect(JSON.stringify(shortLinkNode.description.properties)).not.toMatch(/onetiz/i);
		});

		it('should show page title and description only when the landing page is on', () => {
			const [additionalFields] = propertiesNamed(shortLinkNode, 'additionalFields');
			const options = additionalFields.options as any[];
			for (const name of ['pageTitle', 'pageDescription']) {
				const option = options.find((item) => item.name === name);
				expect(option.displayOptions.show.isEnableLandingPage).toEqual([true]);
			}
			const names = options.map((item) => item.name);
			expect(names).toEqual(expect.arrayContaining(['isEnableLandingPage', 'androidUrl', 'iosUrl']));
		});
	});

	describe('Create Operation', () => {
		it('should create short link with minimal fields (url + template)', async () => {
			const mockResponse = {
				id: 'sl123',
				baseUrl: 'https://example.com',
				shortUrl: 'https://posty5.com/abc123',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'create',
					url: 'https://example.com',
					templateId: 'tpl-123',
					name: '',
					customLandingId: '',
					additionalFields: {},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await shortLinkNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledTimes(1);
			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					url: expect.stringMatching(/\/api\/short-link$/),
				}),
			);
			expect(requestBody(mockExecuteFunctions)).toEqual({
				baseUrl: 'https://example.com',
				templateId: 'tpl-123',
				createdFrom: 'n8n',
			});

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
					templateId: 'tpl-123',
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
						templateId: 'tpl-123',
						name: 'My Campaign',
						customLandingId: 'my-link',
						createdFrom: 'n8n',
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockResponse);
		});

		it('should create short link with tag and refId and never send isEnableMonetization', async () => {
			const mockResponse = {
				id: 'sl125',
				name: 'Full Featured Link',
				baseUrl: 'https://example.com/full',
				tag: 'campaign-2024',
				refId: 'ref-001',
				templateId: 'tpl-123',
				shortUrl: 'https://posty5.com/xyz789',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'create',
					url: 'https://example.com/full',
					templateId: 'tpl-123',
					name: 'Full Featured Link',
					customLandingId: '',
					additionalFields: {
						tag: 'campaign-2024',
						refId: 'ref-001',
						// A workflow saved by 4.4.0 may still carry it; it is never sent.
						isEnableMonetization: true,
					},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await shortLinkNode.execute.call(mockExecuteFunctions);

			const body = requestBody(mockExecuteFunctions);
			expect(body).toEqual({
				baseUrl: 'https://example.com/full',
				templateId: 'tpl-123',
				name: 'Full Featured Link',
				tag: 'campaign-2024',
				refId: 'ref-001',
				createdFrom: 'n8n',
			});
			expect(body).not.toHaveProperty('isEnableMonetization');

			expect(result[0][0].json).toEqual(mockResponse);
		});

		it('should honour a legacy templateId saved under Additional Fields', async () => {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'create',
					url: 'https://example.com',
					templateId: '',
					additionalFields: { templateId: 'tpl-legacy' },
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				{ id: 'sl1' },
			);

			await shortLinkNode.execute.call(mockExecuteFunctions);

			expect(requestBody(mockExecuteFunctions).templateId).toBe('tpl-legacy');
		});

		it('should prefer the Template field over the legacy Additional Fields value', async () => {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'create',
					url: 'https://example.com',
					templateId: 'tpl-new',
					additionalFields: { templateId: 'tpl-legacy' },
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				{ id: 'sl1' },
			);

			await shortLinkNode.execute.call(mockExecuteFunctions);

			expect(requestBody(mockExecuteFunctions).templateId).toBe('tpl-new');
		});

		it('should refuse a create without a template before calling the API', async () => {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'create',
					url: 'https://example.com',
					templateId: '',
					additionalFields: {},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				{ id: 'sl1' },
			);

			await expect(shortLinkNode.execute.call(mockExecuteFunctions)).rejects.toThrow(
				'Template is required',
			);
			expect(mockExecuteFunctions.helpers.httpRequest).not.toHaveBeenCalled();
		});

		it('should create short link with the landing page on, its title and description', async () => {
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
					templateId: 'tpl-123',
					name: 'Link with Page Info',
					customLandingId: '',
					additionalFields: {
						isEnableLandingPage: true,
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
						isEnableLandingPage: true,
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

		it('should not send an empty page description when only the title is set', async () => {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'create',
					url: 'https://example.com/page',
					templateId: 'tpl-123',
					additionalFields: { isEnableLandingPage: true, pageTitle: 'Only a title' },
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				{ id: 'sl1' },
			);

			await shortLinkNode.execute.call(mockExecuteFunctions);

			expect(requestBody(mockExecuteFunctions).pageInfo).toEqual({ title: 'Only a title' });
		});

		it('should send Android and iOS URLs only when they are filled in', async () => {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'create',
					url: 'https://example.com/item/1',
					templateId: 'tpl-123',
					additionalFields: { androidUrl: 'myapp://item/1', iosUrl: '' },
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				{ id: 'sl1' },
			);

			await shortLinkNode.execute.call(mockExecuteFunctions);

			const body = requestBody(mockExecuteFunctions);
			expect(body.androidUrl).toBe('myapp://item/1');
			expect(body).not.toHaveProperty('iosUrl');
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

	describeGetAnalyticsOperation({
		createNode: () => new Posty5ShortLink(),
		idParameter: 'shortLinkId',
		basePath: '/api/short-link',
		notFoundMessage: 'The Short Link Is Not Found',
	});

	describe('Update Operation (fetch-then-put)', () => {
		const storedLink = {
			_id: 'sl123',
			name: 'Old Name',
			baseUrl: 'https://example.com/current',
			templateId: 'tpl-stored',
			templateType: 'user',
			tag: 'stored-tag',
			refId: 'stored-ref',
			subCategory: 4,
			createdFrom: 'n8n',
			isEnableLandingPage: true,
			pageInfo: {
				title: 'Stored title',
				description: 'Stored description',
				descriptionIsHtmlFile: false,
				image: 'https://cdn.example.com/og.png',
			},
			androidUrl: 'myapp://old',
			iosUrl: 'myapp://old-ios',
			shortLinkId: 'abc123',
		};

		/** An update whose GET answers `storedLink` and whose PUT answers `updated`. */
		function mockUpdate(parameters: Record<string, any>, updated: any = { _id: 'sl123' }) {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{ operation: 'update', shortLinkId: 'sl123', ...parameters },
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
			);
			(mockExecuteFunctions.helpers.httpRequest as jest.Mock)
				.mockResolvedValueOnce({ result: storedLink })
				.mockResolvedValueOnce({ result: updated });
			return mockExecuteFunctions;
		}

		it('should GET the link, then PUT it with baseUrl when only the id and a new name are set', async () => {
			const updated = { _id: 'sl123', name: 'Updated Name' };
			const mockExecuteFunctions = mockUpdate({ name: 'Updated Name' }, updated);

			const result = await shortLinkNode.execute.call(mockExecuteFunctions);

			const calls = (mockExecuteFunctions.helpers.httpRequest as jest.Mock).mock.calls;
			expect(calls).toHaveLength(2);
			expect(calls[0][0]).toEqual(
				expect.objectContaining({
					method: 'GET',
					url: expect.stringMatching(/\/api\/short-link\/sl123$/),
				}),
			);
			expect(calls[1][0]).toEqual(
				expect.objectContaining({
					method: 'PUT',
					url: expect.stringMatching(/\/api\/short-link\/sl123$/),
				}),
			);
			expect(calls[1][0].body).toEqual({
				name: 'Updated Name',
				baseUrl: 'https://example.com/current',
				templateId: 'tpl-stored',
				templateType: 'user',
				tag: 'stored-tag',
				refId: 'stored-ref',
				subCategory: 4,
				createdFrom: 'n8n',
				isEnableLandingPage: true,
				pageInfo: {
					title: 'Stored title',
					description: 'Stored description',
					descriptionIsHtmlFile: false,
				},
			});

			expect(result[0][0].json).toEqual(updated);
		});

		it('should never send customLandingId, isEnableMonetization or untouched deep links on update', async () => {
			const mockExecuteFunctions = mockUpdate({
				name: 'Test Link',
				// A workflow saved by 4.4.0 may still carry these; none of them is sent.
				customLandingId: 'new-custom-slug',
				additionalFields: { isEnableMonetization: false },
			});

			await shortLinkNode.execute.call(mockExecuteFunctions);

			const body = requestBody(mockExecuteFunctions, 1);
			expect(body).not.toHaveProperty('customLandingId');
			expect(body).not.toHaveProperty('isEnableMonetization');
			expect(body).not.toHaveProperty('androidUrl');
			expect(body).not.toHaveProperty('iosUrl');
		});

		it('should put the user fields over the stored ones', async () => {
			const mockExecuteFunctions = mockUpdate({
				name: '',
				templateId: 'tpl-456',
				additionalFields: {
					baseUrl: 'https://example.com/new',
					tag: '',
					refId: 'ref-002',
					isEnableLandingPage: true,
					pageTitle: 'New Title',
					androidUrl: '',
					iosUrl: 'myapp://new-ios',
				},
			});

			await shortLinkNode.execute.call(mockExecuteFunctions);

			expect(requestBody(mockExecuteFunctions, 1)).toEqual({
				name: 'Old Name',
				baseUrl: 'https://example.com/new',
				templateId: 'tpl-456',
				templateType: 'user',
				tag: '',
				refId: 'ref-002',
				subCategory: 4,
				createdFrom: 'n8n',
				isEnableLandingPage: true,
				pageInfo: {
					title: 'New Title',
					description: 'Stored description',
					descriptionIsHtmlFile: false,
				},
				androidUrl: '',
				iosUrl: 'myapp://new-ios',
			});
		});

		it('should turn the landing page off when the user sets it to false', async () => {
			const mockExecuteFunctions = mockUpdate({
				additionalFields: { isEnableLandingPage: false },
			});

			await shortLinkNode.execute.call(mockExecuteFunctions);

			expect(requestBody(mockExecuteFunctions, 1).isEnableLandingPage).toBe(false);
		});

		it('should surface a refused GET and not PUT', async () => {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{ operation: 'update', shortLinkId: 'sl-other-key', name: 'x' },
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
			);
			(mockExecuteFunctions.helpers.httpRequest as jest.Mock).mockRejectedValueOnce({
				response: { body: { message: 'You Have Not Permission' } },
			});

			await expect(shortLinkNode.execute.call(mockExecuteFunctions)).rejects.toThrow(
				'You Have Not Permission',
			);
			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledTimes(1);
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

		it('should match Search against the name only', async () => {
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
				{ items: [{ id: 'sl1', name: 'Search Result' }] },
			);

			const result = await shortLinkNode.execute.call(mockExecuteFunctions);

			const { qs } = (mockExecuteFunctions.helpers.httpRequest as jest.Mock).mock.calls[0][0];
			expect(qs.name).toBe('Search Result');
			expect(qs).not.toHaveProperty('baseUrl');
			expect(result[0]).toHaveLength(1);
		});

		it('should send the destination URL and landing page filters on their own', async () => {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'list',
					returnAll: false,
					limit: 50,
					filters: {
						baseUrl: 'example.com/promo',
						isEnableLandingPage: false,
					},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				{ items: [] },
			);

			await shortLinkNode.execute.call(mockExecuteFunctions);

			const { qs } = (mockExecuteFunctions.helpers.httpRequest as jest.Mock).mock.calls[0][0];
			expect(qs).toEqual(
				expect.objectContaining({ baseUrl: 'example.com/promo', isEnableLandingPage: false }),
			);
			expect(qs).not.toHaveProperty('name');
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
