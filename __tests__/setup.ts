import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

export const TEST_CONFIG = {
	apiKey: process.env.POSTY5_API_KEY || '',
	baseUrl: process.env.POSTY5_BASE_URL || 'https://api.posty5.com',
};

export const createdResources = {
	qrCodes: [] as string[],
	shortLinks: [] as string[],
	htmlHosting: [] as string[],
	formSubmissions: [] as string[],
	tasks: [] as string[],
};

export function createMockExecuteFunctions(
	parameters: Record<string, any> = {},
	inputData: INodeExecutionData[] = [{ json: {} }],
	credentials: any = { apiKey: TEST_CONFIG.apiKey },
	httpResponse: any = {},
): IExecuteFunctions {
	const mockFunctions = {
		getInputData: jest.fn().mockReturnValue(inputData),
		getNodeParameter: jest.fn((paramName: string, _itemIndex: number, fallbackValue?: any) => {
			const value = parameters[paramName];
			return value !== undefined ? value : fallbackValue;
		}),
		getCredentials: jest.fn().mockResolvedValue(credentials),
		helpers: {
			httpRequest: jest.fn().mockResolvedValue(httpResponse),
			getBinaryDataBuffer: jest.fn().mockResolvedValue(Buffer.from('test-file-content')),
			constructExecutionMetaData: jest
				.fn()
				.mockImplementation((data: INodeExecutionData[], _options: any) => data),
			returnJsonArray: jest.fn().mockImplementation((data: any) => {
				if (Array.isArray(data)) {
					return data.map((item) => ({ json: item }));
				}
				return [{ json: data }];
			}),
		},
		continueOnFail: jest.fn().mockReturnValue(false),
	} as unknown as IExecuteFunctions;

	return mockFunctions;
}

export function resetMocks(_mockFunctions: IExecuteFunctions): void {
	jest.clearAllMocks();
}
