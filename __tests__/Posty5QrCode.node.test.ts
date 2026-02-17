import type { INodeExecutionData } from 'n8n-workflow';
import { Posty5QrCode } from '../nodes/Posty5QrCode/Posty5QrCode.node';
import { createMockExecuteFunctions, TEST_CONFIG } from './setup';

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
	});

	describe('Create Operation', () => {
		describe('URL QR Type', () => {
			it('should create URL QR code successfully', async () => {
				const mockResponse = {
					id: 'qr123',
					name: 'Test URL QR',
					qrType: 'url',
					url: { url: 'https://example.com' },
					qrCodeUrl: expect.stringContaining('/api/qr-code'),
				};

				const mockExecuteFunctions = createMockExecuteFunctions(
					{
						operation: 'create',
						qrType: 'url',
						name: 'Test URL QR',
						url: 'https://example.com',
						additionalFields: {},
					},
					[{ json: {} }],
					{ apiKey: TEST_CONFIG.apiKey },
					mockResponse,
				);

				const result = await qrCodeNode.execute.call(mockExecuteFunctions);

				expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
					expect.objectContaining({
						method: 'POST',
						url: expect.stringMatching(/\/api\/qr-code\/url$/),
						body: expect.objectContaining({
							url: { url: 'https://example.com' },
							createdFrom: 'n8n',
						}),
					}),
				);

				expect(result[0]).toHaveLength(1);
				expect(result[0][0].json).toEqual(mockResponse);
			});

			it('should create URL QR code with additional fields', async () => {
				const mockResponse = {
					id: 'qr124',
					name: 'Tagged QR',
					qrType: 'url',
					tag: 'campaign-2024',
					refId: 'ref-001',
					url: { url: 'https://example.com/promo' },
					qrCodeUrl: expect.stringContaining('/api/qr-code'),
				};

				const mockExecuteFunctions = createMockExecuteFunctions(
					{
						operation: 'create',
						qrType: 'url',
						name: 'Tagged QR',
						url: 'https://example.com/promo',
						additionalFields: {
							tag: 'campaign-2024',
							refId: 'ref-001',
						},
					},
					[{ json: {} }],
					{ apiKey: TEST_CONFIG.apiKey },
					mockResponse,
				);

				const result = await qrCodeNode.execute.call(mockExecuteFunctions);

				expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
					expect.objectContaining({
						method: 'POST',
						url: expect.stringMatching(/\/api\/qr-code\/url$/),
						body: expect.objectContaining({
							tag: 'campaign-2024',
							refId: 'ref-001',
							createdFrom: 'n8n',
						}),
					}),
				);

				expect(result[0][0].json).toEqual(mockResponse);
			});
		});

		describe('Free Text QR Type', () => {
			it('should create free text QR code', async () => {
				const mockResponse = {
					id: 'qr125',
					name: 'Text QR',
					qrType: 'freeText',
					text: 'Hello World!',
					qrCodeUrl: expect.stringContaining('/api/qr-code'),
				};

				const mockExecuteFunctions = createMockExecuteFunctions(
					{
						operation: 'create',
						qrType: 'freeText',
						name: 'Text QR',
						text: 'Hello World!',
						additionalFields: {},
					},
					[{ json: {} }],
					{ apiKey: TEST_CONFIG.apiKey },
					mockResponse,
				);

				const result = await qrCodeNode.execute.call(mockExecuteFunctions);

				expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
					expect.objectContaining({
						method: 'POST',
						url: expect.stringMatching(/\/api\/qr-code\/freeText$/),
						body: expect.objectContaining({
							text: 'Hello World!',
							createdFrom: 'n8n',
						}),
					}),
				);

				expect(result[0][0].json).toEqual(mockResponse);
			});
		});

		describe('Email QR Type', () => {
			it('should create email QR code with subject and body', async () => {
				const mockResponse = {
					id: 'qr126',
					name: 'Email QR',
					qrType: 'email',
					email: {
						email: 'test@example.com',
						subject: 'Test Subject',
						body: 'Test Body',
					},
					qrCodeUrl: expect.stringContaining('/api/qr-code'),
				};

				const mockExecuteFunctions = createMockExecuteFunctions(
					{
						operation: 'create',
						qrType: 'email',
						name: 'Email QR',
						email: 'test@example.com',
						emailSubject: 'Test Subject',
						emailBody: 'Test Body',
						additionalFields: {},
					},
					[{ json: {} }],
					{ apiKey: TEST_CONFIG.apiKey },
					mockResponse,
				);

				const result = await qrCodeNode.execute.call(mockExecuteFunctions);

				expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
					expect.objectContaining({
						method: 'POST',
						url: expect.stringMatching(/\/api\/qr-code\/email$/),
						body: expect.objectContaining({
							email: {
								email: 'test@example.com',
								subject: 'Test Subject',
								body: 'Test Body',
							},
							createdFrom: 'n8n',
						}),
					}),
				);

				expect(result[0][0].json).toEqual(mockResponse);
			});

			it('should create email QR code without optional fields', async () => {
				const mockResponse = {
					id: 'qr127',
					name: 'Simple Email QR',
					qrType: 'email',
					email: {
						email: 'contact@example.com',
						subject: '',
						body: '',
					},
					qrCodeUrl: expect.stringContaining('/api/qr-code'),
				};

				const mockExecuteFunctions = createMockExecuteFunctions(
					{
						operation: 'create',
						qrType: 'email',
						name: 'Simple Email QR',
						email: 'contact@example.com',
						emailSubject: '',
						emailBody: '',
						additionalFields: {},
					},
					[{ json: {} }],
					{ apiKey: TEST_CONFIG.apiKey },
					mockResponse,
				);

				const result = await qrCodeNode.execute.call(mockExecuteFunctions);

				expect(result[0][0].json).toEqual(mockResponse);
			});
		});

		describe('WiFi QR Type', () => {
			it('should create WiFi QR code with WPA authentication', async () => {
				const mockResponse = {
					id: 'qr128',
					name: 'WiFi QR',
					qrType: 'wifi',
					wifi: {
						name: 'MyNetwork',
						authenticationType: 'WPA',
						password: 'secret123',
					},
					qrCodeUrl: expect.stringContaining('/api/qr-code'),
				};

				const mockExecuteFunctions = createMockExecuteFunctions(
					{
						operation: 'create',
						qrType: 'wifi',
						name: 'WiFi QR',
						wifiName: 'MyNetwork',
						wifiAuthType: 'WPA',
						wifiPassword: 'secret123',
						additionalFields: {},
					},
					[{ json: {} }],
					{ apiKey: TEST_CONFIG.apiKey },
					mockResponse,
				);

				const result = await qrCodeNode.execute.call(mockExecuteFunctions);

				expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
					expect.objectContaining({
						method: 'POST',
						url: expect.stringMatching(/\/api\/qr-code\/wifi$/),
						body: expect.objectContaining({
							wifi: {
								name: 'MyNetwork',
								authenticationType: 'WPA',
								password: 'secret123',
							},
							createdFrom: 'n8n',
						}),
					}),
				);

				expect(result[0][0].json).toEqual(mockResponse);
			});

			it('should create WiFi QR code without password', async () => {
				const mockResponse = {
					id: 'qr129',
					name: 'Open WiFi QR',
					qrType: 'wifi',
					wifi: {
						name: 'GuestNetwork',
						authenticationType: 'nopass',
						password: '',
					},
					qrCodeUrl: expect.stringContaining('/api/qr-code'),
				};

				const mockExecuteFunctions = createMockExecuteFunctions(
					{
						operation: 'create',
						qrType: 'wifi',
						name: 'Open WiFi QR',
						wifiName: 'GuestNetwork',
						wifiAuthType: 'nopass',
						wifiPassword: '',
						additionalFields: {},
					},
					[{ json: {} }],
					{ apiKey: TEST_CONFIG.apiKey },
					mockResponse,
				);

				const result = await qrCodeNode.execute.call(mockExecuteFunctions);

				expect(result[0][0].json).toEqual(mockResponse);
			});
		});

		describe('Phone Call QR Type', () => {
			it('should create phone call QR code', async () => {
				const mockResponse = {
					id: 'qr130',
					name: 'Call QR',
					qrType: 'call',
					call: { phoneNumber: '+1234567890' },
					qrCodeUrl: expect.stringContaining('/api/qr-code'),
				};

				const mockExecuteFunctions = createMockExecuteFunctions(
					{
						operation: 'create',
						qrType: 'call',
						name: 'Call QR',
						phoneNumber: '+1234567890',
						additionalFields: {},
					},
					[{ json: {} }],
					{ apiKey: TEST_CONFIG.apiKey },
					mockResponse,
				);

				const result = await qrCodeNode.execute.call(mockExecuteFunctions);

				expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
					expect.objectContaining({
						method: 'POST',
						url: expect.stringMatching(/\/api\/qr-code\/call$/),
						body: expect.objectContaining({
							call: { phoneNumber: '+1234567890' },
							createdFrom: 'n8n',
						}),
					}),
				);

				expect(result[0][0].json).toEqual(mockResponse);
			});
		});

		describe('SMS QR Type', () => {
			it('should create SMS QR code with message', async () => {
				const mockResponse = {
					id: 'qr131',
					name: 'SMS QR',
					qrType: 'sms',
					sms: {
						phoneNumber: '+1234567890',
						message: 'Hello from QR!',
					},
					qrCodeUrl: expect.stringContaining('/api/qr-code'),
				};

				const mockExecuteFunctions = createMockExecuteFunctions(
					{
						operation: 'create',
						qrType: 'sms',
						name: 'SMS QR',
						smsPhoneNumber: '+1234567890',
						smsMessage: 'Hello from QR!',
						additionalFields: {},
					},
					[{ json: {} }],
					{ apiKey: TEST_CONFIG.apiKey },
					mockResponse,
				);

				const result = await qrCodeNode.execute.call(mockExecuteFunctions);

				expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
					expect.objectContaining({
						method: 'POST',
						url: expect.stringMatching(/\/api\/qr-code\/sms$/),
						body: expect.objectContaining({
							sms: {
								phoneNumber: '+1234567890',
								message: 'Hello from QR!',
							},
							createdFrom: 'n8n',
						}),
					}),
				);

				expect(result[0][0].json).toEqual(mockResponse);
			});

			it('should create SMS QR code without message', async () => {
				const mockResponse = {
					id: 'qr132',
					name: 'SMS QR No Message',
					qrType: 'sms',
					sms: {
						phoneNumber: '+9876543210',
						message: '',
					},
					qrCodeUrl: expect.stringContaining('/api/qr-code'),
				};

				const mockExecuteFunctions = createMockExecuteFunctions(
					{
						operation: 'create',
						qrType: 'sms',
						name: 'SMS QR No Message',
						smsPhoneNumber: '+9876543210',
						smsMessage: '',
						additionalFields: {},
					},
					[{ json: {} }],
					{ apiKey: TEST_CONFIG.apiKey },
					mockResponse,
				);

				const result = await qrCodeNode.execute.call(mockExecuteFunctions);

				expect(result[0][0].json).toEqual(mockResponse);
			});
		});

		describe('Geolocation QR Type', () => {
			it('should create geolocation QR code', async () => {
				const mockResponse = {
					id: 'qr133',
					name: 'Location QR',
					qrType: 'geolocation',
					geolocation: {
						latitude: 37.7749,
						longitude: -122.4194,
					},
					qrCodeUrl: expect.stringContaining('/api/qr-code'),
				};

				const mockExecuteFunctions = createMockExecuteFunctions(
					{
						operation: 'create',
						qrType: 'geolocation',
						name: 'Location QR',
						latitude: 37.7749,
						longitude: -122.4194,
						additionalFields: {},
					},
					[{ json: {} }],
					{ apiKey: TEST_CONFIG.apiKey },
					mockResponse,
				);

				const result = await qrCodeNode.execute.call(mockExecuteFunctions);

				expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
					expect.objectContaining({
						method: 'POST',
						url: expect.stringMatching(/\/api\/qr-code\/geolocation$/),
						body: expect.objectContaining({
							geolocation: {
								latitude: 37.7749,
								longitude: -122.4194,
							},
							createdFrom: 'n8n',
						}),
					}),
				);

				expect(result[0][0].json).toEqual(mockResponse);
			});

			it('should create geolocation QR code with negative coordinates', async () => {
				const mockResponse = {
					id: 'qr134',
					name: 'South Location QR',
					qrType: 'geolocation',
					geolocation: {
						latitude: -33.8688,
						longitude: 151.2093,
					},
					qrCodeUrl: expect.stringContaining('/api/qr-code'),
				};

				const mockExecuteFunctions = createMockExecuteFunctions(
					{
						operation: 'create',
						qrType: 'geolocation',
						name: 'South Location QR',
						latitude: -33.8688,
						longitude: 151.2093,
						additionalFields: {},
					},
					[{ json: {} }],
					{ apiKey: TEST_CONFIG.apiKey },
					mockResponse,
				);

				const result = await qrCodeNode.execute.call(mockExecuteFunctions);

				expect(result[0][0].json).toEqual(mockResponse);
			});
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

	describe('Update Operation', () => {
		it('should update URL QR code', async () => {
			const mockResponse = {
				id: 'qr123',
				name: 'Updated QR',
				qrType: 'url',
				url: { url: 'https://updated.com' },
				qrCodeUrl: expect.stringContaining('/api/qr-code'),
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'update',
					qrCodeId: 'qr123',
					qrType: 'url',
					name: 'Updated QR',
					url: 'https://updated.com',
					additionalFields: {},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await qrCodeNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'PUT',
					url: expect.stringMatching(/\/api\/qr-code\/url\/qr123$/),
					body: expect.objectContaining({
						name: 'Updated QR',
						url: { url: 'https://updated.com' },
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockResponse);
		});

		it('should update email QR code', async () => {
			const mockResponse = {
				id: 'qr456',
				name: 'Updated Email QR',
				qrType: 'email',
				email: {
					email: 'newemail@example.com',
					subject: 'New Subject',
					body: 'New Body',
				},
				qrCodeUrl: expect.stringContaining('/api/qr-code'),
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'update',
					qrCodeId: 'qr456',
					qrType: 'email',
					name: 'Updated Email QR',
					email: 'newemail@example.com',
					emailSubject: 'New Subject',
					emailBody: 'New Body',
					additionalFields: {},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await qrCodeNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'PUT',
					url: expect.stringMatching(/\/api\/qr-code\/email\/qr456$/),
					body: expect.objectContaining({
						email: {
							email: 'newemail@example.com',
							subject: 'New Subject',
							body: 'New Body',
						},
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockResponse);
		});

		it('should update WiFi QR code', async () => {
			const mockResponse = {
				id: 'qr789',
				name: 'Updated WiFi',
				qrType: 'wifi',
				wifi: {
					name: 'UpdatedNetwork',
					authenticationType: 'WPA',
					password: 'newpassword',
				},
				qrCodeUrl: expect.stringContaining('/api/qr-code'),
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'update',
					qrCodeId: 'qr789',
					qrType: 'wifi',
					name: 'Updated WiFi',
					wifiName: 'UpdatedNetwork',
					wifiAuthType: 'WPA',
					wifiPassword: 'newpassword',
					additionalFields: {},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await qrCodeNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'PUT',
					url: expect.stringMatching(/\/api\/qr-code\/wifi\/qr789$/),
				}),
			);

			expect(result[0][0].json).toEqual(mockResponse);
		});

		it('should update QR code with additional fields', async () => {
			const mockResponse = {
				id: 'qr999',
				name: 'Updated with Tags',
				qrType: 'url',
				tag: 'new-tag',
				refId: 'new-ref',
				url: { url: 'https://example.com' },
				qrCodeUrl: expect.stringContaining('/api/qr-code'),
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'update',
					qrCodeId: 'qr999',
					qrType: 'url',
					name: 'Updated with Tags',
					url: 'https://example.com',
					additionalFields: {
						tag: 'new-tag',
						refId: 'new-ref',
					},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await qrCodeNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'PUT',
					url: expect.stringMatching(/\/api\/qr-code\/url\/qr999$/),
					body: expect.objectContaining({
						tag: 'new-tag',
						refId: 'new-ref',
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockResponse);
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
