import type { INodeExecutionData } from 'n8n-workflow';
import { Posty5FormSubmission } from '../nodes/Posty5FormSubmission/Posty5FormSubmission.node';
import { createMockExecuteFunctions, TEST_CONFIG } from './setup';

describe('Posty5FormSubmission', () => {
	let formSubmissionNode: Posty5FormSubmission;

	beforeEach(() => {
		formSubmissionNode = new Posty5FormSubmission();
		jest.clearAllMocks();
	});

	describe('Node Structure', () => {
		it('should have correct display name', () => {
			expect(formSubmissionNode.description.displayName).toBe('Posty5 Form Submission');
		});

		it('should have correct node name', () => {
			expect(formSubmissionNode.description.name).toBe('posty5FormSubmission');
		});

		it('should define all 4 operations', () => {
			const operationProperty = formSubmissionNode.description.properties.find(
				(prop) => prop.name === 'operation',
			);
			expect(operationProperty).toBeDefined();
			expect(operationProperty?.type).toBe('options');

			const operations = (operationProperty as any)?.options || [];
			const operationValues = operations.map((op: any) => op.value);

			expect(operationValues).toContain('get');
			expect(operationValues).toContain('getAdjacent');
			expect(operationValues).toContain('changeStatus');
			expect(operationValues).toContain('list');
			expect(operationValues.length).toBe(4);
		});

		it('should require posty5Api credentials', () => {
			const credentials = formSubmissionNode.description.credentials || [];
			expect(credentials).toHaveLength(1);
			expect(credentials[0].name).toBe('posty5Api');
			expect(credentials[0].required).toBe(true);
		});
	});

	describe('GET Operation', () => {
		it('should get form submission by submissionId', async () => {
			const mockResponse = {
				id: 'fs123',
				formId: 'form1',
				htmlHostingId: 'hh1',
				status: 'new',
				submittedAt: '2024-01-01T00:00:00Z',
				data: {
					name: 'John Doe',
					email: 'john@example.com',
				},
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'get',
					submissionId: 'fs123',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await formSubmissionNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'GET',
					url: expect.stringMatching(/\/api\/html-hosting-form-submission\/fs123$/),
				}),
			);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toEqual(mockResponse);
		});
	});

	describe('GET ADJACENT Operation', () => {
		it('should get next/previous submissions by submissionId', async () => {
			const mockResponse = {
				next: {
					id: 'fs124',
					formId: 'form1',
					status: 'new',
				},
				previous: {
					id: 'fs122',
					formId: 'form1',
					status: 'completed',
				},
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'getAdjacent',
					submissionId: 'fs123',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await formSubmissionNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'GET',
					url: expect.stringMatching(/\/api\/html-hosting-form-submission\/fs123\/next-previous$/),
				}),
			);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toEqual(mockResponse);
		});
	});

	describe('CHANGE STATUS Operation', () => {
		it('should change status to new', async () => {
			const mockResponse = {
				id: 'fs123',
				formId: 'form1',
				status: 'new',
				updatedAt: '2024-01-01T12:00:00Z',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'changeStatus',
					submissionId: 'fs123',
					status: 'new',
					rejectedReason: '',
					notes: '',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await formSubmissionNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'PUT',
					url: expect.stringMatching(/\/api\/html-hosting-form-submission\/fs123\/status$/),
					body: {
						status: 'new',
					},
				}),
			);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toEqual(mockResponse);
		});

		it('should change status to approved with notes', async () => {
			const mockResponse = {
				id: 'fs123',
				formId: 'form1',
				status: 'approved',
				notes: 'Application approved by manager',
				updatedAt: '2024-01-01T12:00:00Z',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'changeStatus',
					submissionId: 'fs123',
					status: 'approved',
					rejectedReason: '',
					notes: 'Application approved by manager',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await formSubmissionNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'PUT',
					url: expect.stringMatching(/\/api\/html-hosting-form-submission\/fs123\/status$/),
					body: {
						status: 'approved',
						notes: 'Application approved by manager',
					},
				}),
			);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toEqual(mockResponse);
		});

		it('should change status to rejected with rejectedReason', async () => {
			const mockResponse = {
				id: 'fs123',
				formId: 'form1',
				status: 'rejected',
				rejectedReason: 'Missing required documents',
				updatedAt: '2024-01-01T12:00:00Z',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'changeStatus',
					submissionId: 'fs123',
					status: 'rejected',
					rejectedReason: 'Missing required documents',
					notes: '',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await formSubmissionNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'PUT',
					url: expect.stringMatching(/\/api\/html-hosting-form-submission\/fs123\/status$/),
					body: {
						status: 'rejected',
						rejectedReason: 'Missing required documents',
					},
				}),
			);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toEqual(mockResponse);
		});

		it('should change status to completed with both rejectedReason and notes', async () => {
			const mockResponse = {
				id: 'fs123',
				formId: 'form1',
				status: 'completed',
				rejectedReason: 'Partially processed',
				notes: 'Completed with modifications',
				updatedAt: '2024-01-01T12:00:00Z',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'changeStatus',
					submissionId: 'fs123',
					status: 'completed',
					rejectedReason: 'Partially processed',
					notes: 'Completed with modifications',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await formSubmissionNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'PUT',
					url: expect.stringMatching(/\/api\/html-hosting-form-submission\/fs123\/status$/),
					body: {
						status: 'completed',
						rejectedReason: 'Partially processed',
						notes: 'Completed with modifications',
					},
				}),
			);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toEqual(mockResponse);
		});
	});

	describe('LIST Operation', () => {
		it('should list form submissions with limit', async () => {
			const mockResponse = {
				items: [
					{
						id: 'fs1',
						formId: 'form1',
						status: 'new',
						submittedAt: '2024-01-01T00:00:00Z',
					},
					{
						id: 'fs2',
						formId: 'form1',
						status: 'approved',
						submittedAt: '2024-01-02T00:00:00Z',
					},
				],
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'list',
					returnAll: false,
					limit: 10,
					filters: {},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await formSubmissionNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'GET',
					url: expect.stringMatching(/\/api\/html-hosting-form-submission$/),
					qs: expect.objectContaining({
						page: 1,
						pageSize: 10,
					}),
				}),
			);

			expect(result[0]).toHaveLength(2);
		});

		it('should list all form submissions with returnAll=true', async () => {
			const mockResponse = [
				{
					id: 'fs1',
					formId: 'form1',
					status: 'new',
					submittedAt: '2024-01-01T00:00:00Z',
				},
				{
					id: 'fs2',
					formId: 'form1',
					status: 'approved',
					submittedAt: '2024-01-02T00:00:00Z',
				},
				{
					id: 'fs3',
					formId: 'form2',
					status: 'rejected',
					submittedAt: '2024-01-03T00:00:00Z',
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

			const result = await formSubmissionNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalled();
			expect(result[0]).toHaveLength(3);
		});

		it('should list form submissions with htmlHostingId filter', async () => {
			const mockResponse = {
				items: [
					{
						id: 'fs1',
						formId: 'form1',
						htmlHostingId: 'hh123',
						status: 'new',
						submittedAt: '2024-01-01T00:00:00Z',
					},
				],
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'list',
					returnAll: false,
					limit: 50,
					filters: {
						htmlHostingId: 'hh123',
					},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await formSubmissionNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					qs: expect.objectContaining({
						htmlHostingId: 'hh123',
					}),
				}),
			);

			expect(result[0]).toHaveLength(1);
		});

		it('should list form submissions with formId filter', async () => {
			const mockResponse = {
				items: [
					{
						id: 'fs1',
						formId: 'form123',
						status: 'new',
						submittedAt: '2024-01-01T00:00:00Z',
					},
				],
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'list',
					returnAll: false,
					limit: 50,
					filters: {
						formId: 'form123',
					},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await formSubmissionNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					qs: expect.objectContaining({
						formId: 'form123',
					}),
				}),
			);

			expect(result[0]).toHaveLength(1);
		});

		it('should list form submissions with status filter', async () => {
			const mockResponse = {
				items: [
					{
						id: 'fs1',
						formId: 'form1',
						status: 'approved',
						submittedAt: '2024-01-01T00:00:00Z',
					},
				],
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'list',
					returnAll: false,
					limit: 50,
					filters: {
						status: 'approved',
					},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await formSubmissionNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					qs: expect.objectContaining({
						status: 'approved',
					}),
				}),
			);

			expect(result[0]).toHaveLength(1);
		});

		it('should list form submissions with search filter (numbering)', async () => {
			const mockResponse = {
				items: [
					{
						id: 'fs1',
						formId: 'form1',
						numbering: 'FORM-2024-001',
						status: 'new',
						submittedAt: '2024-01-01T00:00:00Z',
					},
				],
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'list',
					returnAll: false,
					limit: 50,
					filters: {
						search: 'FORM-2024-001',
					},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await formSubmissionNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					qs: expect.objectContaining({
						numbering: 'FORM-2024-001',
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
					submissionId: 'invalid-id',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
			);

			(mockExecuteFunctions.helpers.httpRequest as jest.Mock).mockRejectedValue(
				new Error('Form submission not found'),
			);

			(mockExecuteFunctions.continueOnFail as jest.Mock).mockReturnValue(false);

			await expect(formSubmissionNode.execute.call(mockExecuteFunctions)).rejects.toThrow(
				'Form submission not found',
			);
		});

		it('should return error in JSON when continueOnFail is true', async () => {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'get',
					submissionId: 'invalid-id',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
			);

			(mockExecuteFunctions.helpers.httpRequest as jest.Mock).mockRejectedValue(
				new Error('Form submission not found'),
			);

			(mockExecuteFunctions.continueOnFail as jest.Mock).mockReturnValue(true);

			const result = await formSubmissionNode.execute.call(mockExecuteFunctions);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toHaveProperty('error');
			expect(result[0][0].json.error).toContain('Form submission not found');
		});
	});

	describe('Multiple Items Processing', () => {
		it('should process 2 items in batch', async () => {
			const inputData: INodeExecutionData[] = [
				{ json: { submissionId: 'fs1' } },
				{ json: { submissionId: 'fs2' } },
			];

			const mockResponse1 = {
				id: 'fs1',
				formId: 'form1',
				status: 'new',
				submittedAt: '2024-01-01T00:00:00Z',
			};

			const mockResponse2 = {
				id: 'fs2',
				formId: 'form1',
				status: 'approved',
				submittedAt: '2024-01-02T00:00:00Z',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'get',
					submissionId: 'fs1',
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
					if (paramName === 'submissionId') {
						if (itemIndex === 0) return 'fs1';
						if (itemIndex === 1) return 'fs2';
					}
					return undefined;
				},
			);

			const result = await formSubmissionNode.execute.call(mockExecuteFunctions);

			expect(result[0]).toHaveLength(2);
			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledTimes(2);
		});
	});
});
