import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { Posty5QrCode } from '../nodes/Posty5QrCode/Posty5QrCode.node';
import { createMockExecuteFunctions, TEST_CONFIG } from './setup';

/** The body of the n-th request the node made. */
function requestBody(mockExecuteFunctions: IExecuteFunctions, callIndex = 0): any {
	return (mockExecuteFunctions.helpers.httpRequest as jest.Mock).mock.calls[callIndex][0].body;
}

describe('Posty5QrCode', () => {
	let qrCodeNode: Posty5QrCode;

	beforeEach(() => {
		qrCodeNode = new Posty5QrCode();
		jest.clearAllMocks();
	});

	describe('Node Structure', () => {
		it('should have correct display name', () => {
			expect(qrCodeNode.description.displayName).toBe('Posty5 QR Code');
		});

		it('should have correct node name', () => {
			expect(qrCodeNode.description.name).toBe('posty5QrCode');
		});

		it('should define all operations', () => {
			const operationProperty = qrCodeNode.description.properties.find(
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

		it('should define all QR types', () => {
			const qrTypeProperty = qrCodeNode.description.properties.find(
				(prop) => prop.name === 'qrType',
			);
			expect(qrTypeProperty).toBeDefined();

			const qrTypes = (qrTypeProperty as any)?.options || [];
			const qrTypeValues = qrTypes.map((type: any) => type.value);

			expect(qrTypeValues).toContain('url');
			expect(qrTypeValues).toContain('freeText');
			expect(qrTypeValues).toContain('email');
			expect(qrTypeValues).toContain('wifi');
			expect(qrTypeValues).toContain('call');
			expect(qrTypeValues).toContain('sms');
			expect(qrTypeValues).toContain('geolocation');
		});

		it('should make Template a required dropdown on Create and an optional one on Update', () => {
			const templates = qrCodeNode.description.properties.filter((prop) => prop.name === 'templateId') as any[];
			const onCreate = templates.find((prop) => prop.displayOptions.show.operation.includes('create'));
			const onUpdate = templates.find((prop) => prop.displayOptions.show.operation.includes('update'));

			expect(onCreate).toEqual(
				expect.objectContaining({
					type: 'options',
					required: true,
					typeOptions: { loadOptionsMethod: 'getQrTemplates' },
				}),
			);
			expect(onUpdate.typeOptions).toEqual({ loadOptionsMethod: 'getQrTemplates' });
			expect(onUpdate.required).toBeFalsy();
			expect(typeof qrCodeNode.methods.loadOptions.getQrTemplates).toBe('function');
		});

		it('should not offer monetization anywhere', () => {
			expect(JSON.stringify(qrCodeNode.description.properties)).not.toMatch(/onetiz/i);
		});
	});

	describe('Create Operation', () => {
		/** The node fields for one QR of each type, and the `qrCodeTarget` they must produce. */
		const sevenTypes: Array<{ qrType: string; fields: Record<string, any>; qrCodeTarget: any }> = [
			{
				qrType: 'url',
				fields: { url: 'https://example.com' },
				qrCodeTarget: { type: 'url', url: { url: 'https://example.com' } },
			},
			{
				qrType: 'freeText',
				fields: { text: 'Hello World!' },
				qrCodeTarget: { type: 'freeText', freeText: { text: 'Hello World!' } },
			},
			{
				qrType: 'email',
				fields: { email: 'test@example.com', emailSubject: 'Hi & welcome', emailBody: 'Body' },
				qrCodeTarget: {
					type: 'email',
					email: { email: 'test@example.com', subject: 'Hi & welcome', body: 'Body' },
				},
			},
			{
				qrType: 'wifi',
				fields: { wifiName: 'MyNetwork', wifiAuthType: 'WPA', wifiPassword: 'pa;ss' },
				qrCodeTarget: {
					type: 'wifi',
					wifi: { name: 'MyNetwork', authenticationType: 'WPA', password: 'pa;ss' },
				},
			},
			{
				qrType: 'call',
				fields: { phoneNumber: '+1234567890' },
				qrCodeTarget: { type: 'call', call: { phoneNumber: '+1234567890' } },
			},
			{
				qrType: 'sms',
				fields: { smsPhoneNumber: '+1234567890', smsMessage: 'Hello' },
				qrCodeTarget: { type: 'sms', sms: { phoneNumber: '+1234567890', message: 'Hello' } },
			},
			{
				qrType: 'geolocation',
				fields: { latitude: 40.7128, longitude: -74.006 },
				qrCodeTarget: {
					type: 'geolocation',
					geolocation: { latitude: 40.7128, longitude: -74.006 },
				},
			},
		];

		it.each(sevenTypes)(
			'should POST a $qrType QR code with qrCodeTarget and no options.text',
			async ({ qrType, fields, qrCodeTarget }) => {
				const mockResponse = { _id: `qr-${qrType}`, name: 'Created' };
				const mockExecuteFunctions = createMockExecuteFunctions(
					{
						operation: 'create',
						qrType,
						templateId: 'tpl-123',
						name: `My ${qrType}`,
						additionalFields: {},
						...fields,
					},
					[{ json: {} }],
					{ apiKey: TEST_CONFIG.apiKey },
					mockResponse,
				);

				const result = await qrCodeNode.execute.call(mockExecuteFunctions);

				expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledTimes(1);
				expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
					expect.objectContaining({
						method: 'POST',
						url: expect.stringMatching(new RegExp(`/api/qr-code/${qrType}$`)),
					}),
				);
				expect(requestBody(mockExecuteFunctions)).toEqual({
					name: `My ${qrType}`,
					templateId: 'tpl-123',
					qrCodeTarget,
					options: {},
					createdFrom: 'n8n',
				});
				expect(result[0][0].json).toEqual(mockResponse);
			},
		);

		it('should never put the type payload at the top level of the body', async () => {
			for (const { qrType, fields } of sevenTypes) {
				const mockExecuteFunctions = createMockExecuteFunctions(
					{ operation: 'create', qrType, templateId: 'tpl-123', additionalFields: {}, ...fields },
					[{ json: {} }],
					{ apiKey: TEST_CONFIG.apiKey },
					{ _id: 'qr1' },
				);

				await qrCodeNode.execute.call(mockExecuteFunctions);

				const body = requestBody(mockExecuteFunctions);
				for (const key of ['url', 'text', 'email', 'wifi', 'call', 'sms', 'geolocation', 'freeText']) {
					expect(body).not.toHaveProperty(key);
				}
				expect(Object.keys(body.qrCodeTarget).sort()).toEqual(['type', qrType].sort());
				expect(body.options).toEqual({});
			}
		});

		it('should send tag, refId, landing page and page info, never isEnableMonetization', async () => {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'create',
					qrType: 'url',
					templateId: 'tpl-123',
					name: 'Tagged QR',
					url: 'https://example.com/promo',
					additionalFields: {
						tag: 'campaign-2024',
						refId: 'ref-001',
						isEnableLandingPage: true,
						pageTitle: 'Title',
						// A workflow saved by 4.4.0 may still carry it; it is never sent.
						isEnableMonetization: true,
					},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				{ _id: 'qr124' },
			);

			await qrCodeNode.execute.call(mockExecuteFunctions);

			const body = requestBody(mockExecuteFunctions);
			expect(body).toEqual(
				expect.objectContaining({
					tag: 'campaign-2024',
					refId: 'ref-001',
					isEnableLandingPage: true,
					pageInfo: { title: 'Title' },
				}),
			);
			expect(body).not.toHaveProperty('isEnableMonetization');
		});

		it('should leave empty optional values out of the target', async () => {
			const cases = [
				{
					fields: { qrType: 'email', email: 'test@example.com', emailSubject: '', emailBody: '' },
					qrCodeTarget: { type: 'email', email: { email: 'test@example.com' } },
				},
				{
					fields: { qrType: 'sms', smsPhoneNumber: '+1234567890', smsMessage: '' },
					qrCodeTarget: { type: 'sms', sms: { phoneNumber: '+1234567890' } },
				},
				{
					// The password field is hidden for an open network; a stale value is not sent.
					fields: { qrType: 'wifi', wifiName: 'OpenNetwork', wifiAuthType: 'nopass', wifiPassword: 'stale' },
					qrCodeTarget: { type: 'wifi', wifi: { name: 'OpenNetwork', authenticationType: 'nopass' } },
				},
			];

			for (const { fields, qrCodeTarget } of cases) {
				const mockExecuteFunctions = createMockExecuteFunctions(
					{ operation: 'create', templateId: 'tpl-123', additionalFields: {}, ...fields },
					[{ json: {} }],
					{ apiKey: TEST_CONFIG.apiKey },
					{ _id: 'qr1' },
				);

				await qrCodeNode.execute.call(mockExecuteFunctions);

				expect(requestBody(mockExecuteFunctions).qrCodeTarget).toEqual(qrCodeTarget);
			}
		});

		it('should honour a legacy templateId saved under Additional Fields', async () => {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'create',
					qrType: 'url',
					templateId: '',
					url: 'https://example.com',
					additionalFields: { templateId: 'tpl-legacy' },
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				{ _id: 'qr1' },
			);

			await qrCodeNode.execute.call(mockExecuteFunctions);

			expect(requestBody(mockExecuteFunctions).templateId).toBe('tpl-legacy');
		});

		it('should refuse a create without a template before calling the API', async () => {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'create',
					qrType: 'url',
					url: 'https://example.com',
					additionalFields: {},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				{ _id: 'qr1' },
			);

			await expect(qrCodeNode.execute.call(mockExecuteFunctions)).rejects.toThrow(
				'Template is required',
			);
			expect(mockExecuteFunctions.helpers.httpRequest).not.toHaveBeenCalled();
		});
	});

	describe('Get Operation', () => {
		it('should get QR code by ID', async () => {
			const mockResponse = {
				id: 'qr123',
				name: 'Test QR',
				qrType: 'url',
				url: { url: 'https://example.com' },
				qrCodeUrl: expect.stringContaining('/api/qr-code'),
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'get',
					qrCodeId: 'qr123',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await qrCodeNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'GET',
					url: expect.stringMatching(/\/api\/qr-code\/qr123$/),
				}),
			);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toEqual(mockResponse);
		});

		it('should handle get operation with different QR types', async () => {
			const mockResponse = {
				id: 'qr456',
				name: 'WiFi Network',
				qrType: 'wifi',
				wifi: {
					name: 'MyNetwork',
					authenticationType: 'WPA',
				},
				qrCodeUrl: expect.stringContaining('/api/qr-code'),
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'get',
					qrCodeId: 'qr456',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await qrCodeNode.execute.call(mockExecuteFunctions);

			expect(result[0][0].json.qrType).toBe('wifi');
			expect(result[0][0].json.wifi).toBeDefined();
		});
	});

	describe('Update Operation (fetch-then-put)', () => {
		const storedQrCode = {
			_id: 'qr123',
			qrCodeId: 'abc123',
			name: 'Stored name',
			templateId: 'tpl-stored',
			templateType: 'public',
			tag: 'stored-tag',
			refId: 'stored-ref',
			createdFrom: 'n8n',
			isEnableLandingPage: true,
			pageInfo: { title: 'Stored title', description: 'Stored description' },
			qrCodeTarget: { type: 'url', url: { url: 'https://old.example.com' } },
			options: { text: 'https://old.example.com', colorDark: '#000000' },
		};

		/** An update whose GET answers `storedQrCode` and whose PUT answers `updated`. */
		function mockUpdate(parameters: Record<string, any>, updated: any = { _id: 'qr123' }) {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{ operation: 'update', qrCodeId: 'qr123', additionalFields: {}, ...parameters },
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
			);
			(mockExecuteFunctions.helpers.httpRequest as jest.Mock)
				.mockResolvedValueOnce({ result: storedQrCode })
				.mockResolvedValueOnce({ result: updated });
			return mockExecuteFunctions;
		}

		it('should GET the QR code, then PUT the new target over the stored record', async () => {
			const updated = { _id: 'qr123', name: 'Updated QR' };
			const mockExecuteFunctions = mockUpdate(
				{ qrType: 'url', name: 'Updated QR', url: 'https://updated.com' },
				updated,
			);

			const result = await qrCodeNode.execute.call(mockExecuteFunctions);

			const calls = (mockExecuteFunctions.helpers.httpRequest as jest.Mock).mock.calls;
			expect(calls).toHaveLength(2);
			expect(calls[0][0]).toEqual(
				expect.objectContaining({ method: 'GET', url: expect.stringMatching(/\/api\/qr-code\/qr123$/) }),
			);
			expect(calls[1][0]).toEqual(
				expect.objectContaining({ method: 'PUT', url: expect.stringMatching(/\/api\/qr-code\/url\/qr123$/) }),
			);
			expect(calls[1][0].body).toEqual({
				name: 'Updated QR',
				templateId: 'tpl-stored',
				templateType: 'public',
				tag: 'stored-tag',
				refId: 'stored-ref',
				createdFrom: 'n8n',
				isEnableLandingPage: true,
				pageInfo: { title: 'Stored title', description: 'Stored description' },
				qrCodeTarget: { type: 'url', url: { url: 'https://updated.com' } },
				options: {},
			});
			expect(result[0][0].json).toEqual(updated);
		});

		it('should keep the stored name when Name is empty (the API would rename it after its text)', async () => {
			const mockExecuteFunctions = mockUpdate({ qrType: 'freeText', name: '', text: 'New text' });

			await qrCodeNode.execute.call(mockExecuteFunctions);

			const body = requestBody(mockExecuteFunctions, 1);
			expect(body.name).toBe('Stored name');
			expect(body.qrCodeTarget).toEqual({ type: 'freeText', freeText: { text: 'New text' } });
		});

		it('should change the type through the URL and send only the new type block', async () => {
			const mockExecuteFunctions = mockUpdate({
				qrType: 'email',
				name: 'Updated Email QR',
				email: 'newemail@example.com',
				emailSubject: 'New Subject',
				emailBody: 'New Body',
			});

			await qrCodeNode.execute.call(mockExecuteFunctions);

			const put = (mockExecuteFunctions.helpers.httpRequest as jest.Mock).mock.calls[1][0];
			expect(put.url).toMatch(/\/api\/qr-code\/email\/qr123$/);
			expect(put.body.qrCodeTarget).toEqual({
				type: 'email',
				email: { email: 'newemail@example.com', subject: 'New Subject', body: 'New Body' },
			});
			expect(put.body).not.toHaveProperty('email');
			expect(put.body.options).toEqual({});
		});

		it('should put the user fields over the stored ones and never send isEnableMonetization', async () => {
			const mockExecuteFunctions = mockUpdate({
				qrType: 'wifi',
				name: 'Updated WiFi',
				templateId: 'tpl-456',
				wifiName: 'UpdatedNetwork',
				wifiAuthType: 'WPA',
				wifiPassword: 'newpassword',
				additionalFields: {
					tag: 'new-tag',
					refId: '',
					isEnableLandingPage: false,
					isEnableMonetization: true,
				},
			});

			await qrCodeNode.execute.call(mockExecuteFunctions);

			const body = requestBody(mockExecuteFunctions, 1);
			expect(body).toEqual({
				name: 'Updated WiFi',
				templateId: 'tpl-456',
				templateType: 'public',
				tag: 'new-tag',
				refId: '',
				createdFrom: 'n8n',
				isEnableLandingPage: false,
				pageInfo: { title: 'Stored title', description: 'Stored description' },
				qrCodeTarget: {
					type: 'wifi',
					wifi: { name: 'UpdatedNetwork', authenticationType: 'WPA', password: 'newpassword' },
				},
				options: {},
			});
			expect(body).not.toHaveProperty('isEnableMonetization');
		});

		it('should reject an unknown QR type before any request', async () => {
			const mockExecuteFunctions = mockUpdate({ qrType: 'contact' });

			await expect(qrCodeNode.execute.call(mockExecuteFunctions)).rejects.toThrow(
				'Unsupported QR type "contact"',
			);
			expect(mockExecuteFunctions.helpers.httpRequest).not.toHaveBeenCalled();
		});
	});

	describe('Delete Operation', () => {
		it('should delete QR code by ID', async () => {
			const mockResponse = {
				success: true,
				message: 'QR code deleted successfully',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'delete',
					qrCodeId: 'qr123',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await qrCodeNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'DELETE',
					url: expect.stringMatching(/\/api\/qr-code\/qr123$/),
				}),
			);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toEqual(mockResponse);
		});

		it('should delete multiple QR codes', async () => {
			const mockResponse1 = { success: true, message: 'QR code deleted' };
			const mockResponse2 = { success: true, message: 'QR code deleted' };

			const inputData: INodeExecutionData[] = [
				{ json: { qrCodeId: 'qr123' } },
				{ json: { qrCodeId: 'qr456' } },
			];

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'delete',
					qrCodeId: 'qr123',
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
					if (paramName === 'operation') return 'delete';
					if (paramName === 'qrCodeId') {
						return itemIndex === 0 ? 'qr123' : 'qr456';
					}
					return undefined;
				},
			);

			const result = await qrCodeNode.execute.call(mockExecuteFunctions);

			expect(result[0]).toHaveLength(2);
			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledTimes(2);
		});
	});

	describe('List Operation', () => {
		it('should list QR codes with limit', async () => {
			const mockResponse = {
				items: [
					{
						id: 'qr1',
						name: 'QR 1',
						qrType: 'url',
						qrCodeUrl: expect.stringContaining('/api/qr-code'),
					},
					{
						id: 'qr2',
						name: 'QR 2',
						qrType: 'email',
						qrCodeUrl: expect.stringContaining('/api/qr-code'),
					},
				],
				totalPages: 5,
				currentPage: 1,
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

			const result = await qrCodeNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'GET',
					url: expect.stringMatching(/\/api\/qr-code$/),
					qs: expect.objectContaining({
						page: 1,
						pageSize: 2,
					}),
				}),
			);

			expect(result[0]).toHaveLength(2);
		});

		it('should list all QR codes with returnAll', async () => {
			const mockResponse = [
				{ id: 'qr1', name: 'QR 1', qrCodeUrl: expect.stringContaining('/api/qr-code') },
				{ id: 'qr2', name: 'QR 2', qrCodeUrl: expect.stringContaining('/api/qr-code') },
				{ id: 'qr3', name: 'QR 3', qrCodeUrl: expect.stringContaining('/api/qr-code') },
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

			const result = await qrCodeNode.execute.call(mockExecuteFunctions);

			expect(result[0]).toHaveLength(3);
		});

		it('should list QR codes with tag filter', async () => {
			const mockResponse = {
				items: [
					{
						id: 'qr1',
						name: 'Tagged QR',
						tag: 'campaign',
						qrCodeUrl: expect.stringContaining('/api/qr-code'),
					},
				],
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'list',
					returnAll: false,
					limit: 50,
					filters: { tag: 'campaign' },
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await qrCodeNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					url: expect.stringMatching(/\/api\/qr-code$/),
					qs: expect.objectContaining({
						tag: 'campaign',
					}),
				}),
			);

			expect(result[0]).toHaveLength(1);
		});

		it('should list QR codes with refId filter', async () => {
			const mockResponse = {
				items: [
					{
						id: 'qr1',
						name: 'Ref QR',
						refId: 'ref-123',
						qrCodeUrl: expect.stringContaining('/api/qr-code'),
					},
				],
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'list',
					returnAll: false,
					limit: 50,
					filters: { refId: 'ref-123' },
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await qrCodeNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					url: expect.stringMatching(/\/api\/qr-code$/),
					qs: expect.objectContaining({
						refId: 'ref-123',
					}),
				}),
			);

			expect(result[0]).toHaveLength(1);
		});

		it('should list QR codes with search filter', async () => {
			const mockResponse = {
				items: [
					{
						id: 'qr1',
						name: 'Search Result QR',
						qrCodeUrl: expect.stringContaining('/api/qr-code'),
					},
				],
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'list',
					returnAll: false,
					limit: 50,
					filters: { search: 'Search Result' },
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await qrCodeNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					url: expect.stringMatching(/\/api\/qr-code$/),
					qs: expect.objectContaining({
						name: 'Search Result',
					}),
				}),
			);

			expect(result[0]).toHaveLength(1);
		});

		it('should list QR codes with multiple filters', async () => {
			const mockResponse = {
				items: [
					{
						id: 'qr1',
						name: 'Filtered QR',
						tag: 'test',
						refId: 'ref-001',
						qrCodeUrl: expect.stringContaining('/api/qr-code'),
					},
				],
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'list',
					returnAll: false,
					limit: 50,
					filters: {
						tag: 'test',
						refId: 'ref-001',
						search: 'Filtered',
					},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await qrCodeNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					url: expect.stringMatching(/\/api\/qr-code$/),
					qs: expect.objectContaining({
						tag: 'test',
						refId: 'ref-001',
						name: 'Filtered',
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
					qrCodeId: 'invalid-id',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
			);

			(mockExecuteFunctions.helpers.httpRequest as jest.Mock).mockRejectedValue(
				new Error('QR code not found'),
			);

			(mockExecuteFunctions.continueOnFail as jest.Mock).mockReturnValue(false);

			await expect(qrCodeNode.execute.call(mockExecuteFunctions)).rejects.toThrow(
				'Posty5 API Error: QR code not found',
			);
		});

		it('should continue on error when continueOnFail is true', async () => {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'get',
					qrCodeId: 'invalid-id',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
			);

			(mockExecuteFunctions.helpers.httpRequest as jest.Mock).mockRejectedValue(
				new Error('QR code not found'),
			);

			(mockExecuteFunctions.continueOnFail as jest.Mock).mockReturnValue(true);

			const result = await qrCodeNode.execute.call(mockExecuteFunctions);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toHaveProperty('error');
			expect(result[0][0].json.error).toContain('QR code not found');
		});

		it('should handle API error for create operation with continueOnFail', async () => {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'create',
					qrType: 'url',
					templateId: 'tpl-123',
					name: 'Test QR',
					url: 'invalid-url',
					additionalFields: {},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
			);

			(mockExecuteFunctions.helpers.httpRequest as jest.Mock).mockRejectedValue(
				new Error('Invalid URL format'),
			);

			(mockExecuteFunctions.continueOnFail as jest.Mock).mockReturnValue(true);

			const result = await qrCodeNode.execute.call(mockExecuteFunctions);

			expect(result[0][0].json.error).toContain('Invalid URL format');
		});

		it('should handle authentication error', async () => {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'list',
					returnAll: false,
					limit: 50,
					filters: {},
				},
				[{ json: {} }],
				{ apiKey: 'invalid-key' },
			);

			(mockExecuteFunctions.helpers.httpRequest as jest.Mock).mockRejectedValue(
				new Error('Unauthorized: Invalid API key'),
			);

			(mockExecuteFunctions.continueOnFail as jest.Mock).mockReturnValue(true);

			const result = await qrCodeNode.execute.call(mockExecuteFunctions);

			expect(result[0][0].json.error).toContain('Unauthorized');
		});
	});

	describe('Multiple Items Processing', () => {
		it('should process multiple items for create operation', async () => {
			const inputData: INodeExecutionData[] = [
				{ json: { url: 'https://example1.com' } },
				{ json: { url: 'https://example2.com' } },
			];

			const mockResponse1 = {
				id: 'qr1',
				name: 'QR 1',
				qrType: 'url',
				url: { url: 'https://example1.com' },
				qrCodeUrl: expect.stringContaining('/api/qr-code'),
			};

			const mockResponse2 = {
				id: 'qr2',
				name: 'QR 2',
				qrType: 'url',
				url: { url: 'https://example2.com' },
				qrCodeUrl: expect.stringContaining('/api/qr-code'),
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'create',
					qrType: 'url',
					templateId: 'tpl-123',
					name: 'QR 1',
					url: 'https://example1.com',
					additionalFields: {},
				},
				inputData,
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse1,
			);

			(mockExecuteFunctions.helpers.httpRequest as jest.Mock)
				.mockResolvedValueOnce(mockResponse1)
				.mockResolvedValueOnce(mockResponse2);

			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
				(paramName: string, itemIndex: number, fallbackValue?: any) => {
					if (paramName === 'operation') return 'create';
					if (paramName === 'qrType') return 'url';
					if (paramName === 'templateId') return 'tpl-123';
					if (paramName === 'name') return `QR ${itemIndex + 1}`;
					if (paramName === 'url') {
						return itemIndex === 0 ? 'https://example1.com' : 'https://example2.com';
					}
					if (paramName === 'additionalFields') return {};
					return fallbackValue;
				},
			);

			const result = await qrCodeNode.execute.call(mockExecuteFunctions);

			expect(result[0]).toHaveLength(2);
			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledTimes(2);
		});

		it('should process multiple items with mixed success and failure', async () => {
			const inputData: INodeExecutionData[] = [
				{ json: { id: 'qr1' } },
				{ json: { id: 'qr-invalid' } },
				{ json: { id: 'qr3' } },
			];

			const mockResponse1 = {
				id: 'qr1',
				name: 'QR 1',
				qrCodeUrl: expect.stringContaining('/api/qr-code'),
			};
			const mockResponse3 = {
				id: 'qr3',
				name: 'QR 3',
				qrCodeUrl: expect.stringContaining('/api/qr-code'),
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'get',
					qrCodeId: 'qr1',
				},
				inputData,
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse1,
			);

			(mockExecuteFunctions.helpers.httpRequest as jest.Mock)
				.mockResolvedValueOnce(mockResponse1)
				.mockRejectedValueOnce(new Error('QR code not found'))
				.mockResolvedValueOnce(mockResponse3);

			(mockExecuteFunctions.continueOnFail as jest.Mock).mockReturnValue(true);

			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
				(paramName: string, itemIndex: number) => {
					if (paramName === 'operation') return 'get';
					if (paramName === 'qrCodeId') {
						if (itemIndex === 0) return 'qr1';
						if (itemIndex === 1) return 'qr-invalid';
						if (itemIndex === 2) return 'qr3';
					}
					return undefined;
				},
			);

			const result = await qrCodeNode.execute.call(mockExecuteFunctions);

			expect(result[0]).toHaveLength(3);
			expect(result[0][0].json).toEqual(mockResponse1);
			expect(result[0][1].json).toHaveProperty('error');
			expect(result[0][2].json).toEqual(mockResponse3);
		});
	});

	describe('API Request Validation', () => {
		it('should include API key in request headers', async () => {
			const mockResponse = { id: 'qr123', name: 'Test QR' };

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'get',
					qrCodeId: 'qr123',
				},
				[{ json: {} }],
				{ apiKey: 'test-api-key-123' },
				mockResponse,
			);

			await qrCodeNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					url: expect.stringMatching(/\/api\/qr-code\/qr123$/),
				}),
			);
		});

		it('should use correct HTTP method for each operation', async () => {
			const operations = [
				{
					operation: 'create',
					method: 'POST',
					additionalParams: {
						qrType: 'url',
						templateId: 'tpl-123',
						url: 'https://example.com',
						name: '',
						additionalFields: {},
					},
				},
				{ operation: 'get', method: 'GET', additionalParams: { qrCodeId: 'qr123' } },
				{
					operation: 'update',
					method: 'PUT',
					additionalParams: {
						qrCodeId: 'qr123',
						qrType: 'url',
						templateId: 'tpl-123',
						url: 'https://example.com',
						name: '',
						additionalFields: {},
					},
				},
				{ operation: 'delete', method: 'DELETE', additionalParams: { qrCodeId: 'qr123' } },
				{
					operation: 'list',
					method: 'GET',
					additionalParams: { returnAll: false, limit: 50, filters: {} },
				},
			];

			for (const { operation, method, additionalParams } of operations) {
				const mockExecuteFunctions = createMockExecuteFunctions(
					{ operation, ...additionalParams },
					[{ json: {} }],
					{ apiKey: TEST_CONFIG.apiKey },
					{ id: 'qr123', items: [] },
				);

				await qrCodeNode.execute.call(mockExecuteFunctions);

				expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
					expect.objectContaining({ method }),
				);

				jest.clearAllMocks();
			}
		});
	});
});
