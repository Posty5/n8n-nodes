import type { IExecuteFunctions, INodeType } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { ANALYTICS_NOW, ANALYTICS_RESPONSE, PLAN_GATE_ERROR, STATISTICS_RESPONSE } from './link-analytics.fixture';
import { createMockExecuteFunctions, TEST_CONFIG } from './setup';

/** What a node's *Get Analytics* suite needs to know about that node. */
interface IGetAnalyticsSuiteTarget {
	createNode: () => INodeType;
	/** The node's ID parameter (`shortLinkId` / `qrCodeId`). */
	idParameter: string;
	/** The API path of the resource (`/api/short-link` / `/api/qr-code`). */
	basePath: string;
	/** The API's not-found message for the resource (answered as a 400). */
	notFoundMessage: string;
}

/** The single request the node made. */
function onlyRequest(mockExecuteFunctions: IExecuteFunctions): any {
	const calls = (mockExecuteFunctions.helpers.httpRequest as jest.Mock).mock.calls;
	expect(calls).toHaveLength(1);
	return calls[0][0];
}

/**
 * The *Get Analytics* operation suite, run by the Short Link and the QR Code
 * node test files: both nodes share the parameters and the helper, so they
 * must map the same parameters to the same request.
 */
export function describeGetAnalyticsOperation({
	createNode,
	idParameter,
	basePath,
	notFoundMessage,
}: IGetAnalyticsSuiteTarget): void {
	describe('Get Analytics Operation', () => {
		let node: INodeType;

		/** Runs the node once for one item with these parameters (operation and ID preset). */
		async function run(parameters: Record<string, any>, response: any = ANALYTICS_RESPONSE) {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{ operation: 'getAnalytics', [idParameter]: 'rec-1', ...parameters },
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				{ isSuccess: true, message: '', result: response },
			);
			const result = await node.execute!.call(mockExecuteFunctions as any);
			return { mockExecuteFunctions, result: result as any[][] };
		}

		beforeEach(() => {
			node = createNode();
			jest.useFakeTimers({ now: ANALYTICS_NOW, doNotFake: ['nextTick', 'setImmediate'] });
		});

		afterEach(() => {
			jest.useRealTimers();
		});

		it('is an operation whose fields show only for it, beside the ID field', () => {
			const properties = node.description.properties as any[];
			const operation = properties.find((prop) => prop.name === 'operation');
			expect(operation.options).toContainEqual(
				expect.objectContaining({ name: 'Get Analytics', value: 'getAnalytics' }),
			);

			const idField = properties.find((prop) => prop.name === idParameter);
			expect(idField.displayOptions.show.operation).toContain('getAnalytics');

			for (const name of ['range', 'from', 'to', 'interval', 'allBreakdowns', 'breakdowns', 'output', 'analyticsOptions']) {
				const property = properties.find((prop) => prop.name === name);
				expect(property).toBeDefined();
				expect(property.displayOptions.show.operation).toEqual(['getAnalytics']);
			}
		});

		it('defaults to the last 30 days in the workflow zone, by day, every breakdown the plan allows', async () => {
			const { mockExecuteFunctions, result } = await run({});

			const request = onlyRequest(mockExecuteFunctions);
			expect(request.method).toBe('GET');
			expect(request.url).toMatch(new RegExp(`${basePath}/rec-1/analytics$`));
			expect(request.qs).toEqual({
				from: '2026-09-06',
				to: '2026-10-05',
				interval: 'day',
				tz: 'America/New_York',
				breakdown: 'all',
			});

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toEqual(ANALYTICS_RESPONSE);
		});

		it.each([
			['last7Days', '2026-09-29'],
			['last30Days', '2026-09-06'],
			['last90Days', '2026-07-08'],
		])('maps the %s range to from %s .. today', async (range, from) => {
			const { mockExecuteFunctions } = await run({ range });
			expect(onlyRequest(mockExecuteFunctions).qs).toEqual(
				expect.objectContaining({ from, to: '2026-10-05' }),
			);
		});

		it('counts "today" in the workflow time zone and sends it as tz', async () => {
			// 2026-10-05 10:00 UTC is already 2026-10-06 00:00 on Kiritimati (UTC+14).
			const mockExecuteFunctions = createMockExecuteFunctions(
				{ operation: 'getAnalytics', [idParameter]: 'rec-1', range: 'last7Days' },
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				{ result: ANALYTICS_RESPONSE },
			);
			(mockExecuteFunctions.getTimezone as jest.Mock).mockReturnValue('Pacific/Kiritimati');
			await node.execute!.call(mockExecuteFunctions as any);
			expect(onlyRequest(mockExecuteFunctions).qs).toEqual(
				expect.objectContaining({ from: '2026-09-30', to: '2026-10-06', tz: 'Pacific/Kiritimati' }),
			);
		});

		it('maps a custom range, interval, time zone option (over the workflow zone) and limit', async () => {
			const { mockExecuteFunctions } = await run({
				range: 'custom',
				from: '2026-08-01T00:00:00',
				to: '2026-08-31T00:00:00',
				interval: 'week',
				analyticsOptions: { timezone: 'Africa/Cairo', limit: 25 },
			});
			expect(onlyRequest(mockExecuteFunctions).qs).toEqual({
				from: '2026-08-01',
				to: '2026-08-31',
				interval: 'week',
				tz: 'Africa/Cairo',
				breakdown: 'all',
				limit: 25,
			});
		});

		it('sends an explicit breakdown list joined with commas', async () => {
			const { mockExecuteFunctions } = await run({ allBreakdowns: false, breakdowns: ['country', 'channel'] });
			expect(onlyRequest(mockExecuteFunctions).qs.breakdown).toBe('country,channel');
		});

		it('leaves breakdown out when the toggle is off and the list is empty', async () => {
			const { mockExecuteFunctions } = await run({ allBreakdowns: false, breakdowns: [] });
			expect(onlyRequest(mockExecuteFunctions).qs).not.toHaveProperty('breakdown');
		});

		it('returns one item per series point, each with meta, for Series as Items', async () => {
			const { result } = await run({ output: 'seriesAsItems' });
			expect(result[0].map((item) => item.json)).toEqual(
				ANALYTICS_RESPONSE.series.map((point) => ({ ...point, meta: ANALYTICS_RESPONSE.meta })),
			);
		});

		it('throws the plan-gate 403 as a NodeApiError with the API message unchanged', async () => {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{ operation: 'getAnalytics', [idParameter]: 'rec-1', allBreakdowns: false, breakdowns: ['country'] },
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
			);
			(mockExecuteFunctions.helpers.httpRequest as jest.Mock).mockRejectedValueOnce(PLAN_GATE_ERROR);

			const failure = node.execute!.call(mockExecuteFunctions as any);
			await expect(failure).rejects.toBeInstanceOf(NodeApiError);
			await expect(failure).rejects.toThrow(/^This feature is not available on your current plan\.$/);
		});

		it('returns the 403 message as the item error when continueOnFail is on', async () => {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{ operation: 'getAnalytics', [idParameter]: 'rec-1' },
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
			);
			(mockExecuteFunctions.helpers.httpRequest as jest.Mock).mockRejectedValueOnce(PLAN_GATE_ERROR);
			(mockExecuteFunctions.continueOnFail as jest.Mock).mockReturnValue(true);

			const result = await node.execute!.call(mockExecuteFunctions as any);
			expect((result as any[][])[0][0].json).toEqual({
				error: 'This feature is not available on your current plan.',
			});
		});

		it('surfaces the not-found 400 with the API message, not as a plan error', async () => {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{ operation: 'getAnalytics', [idParameter]: 'missing' },
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
			);
			(mockExecuteFunctions.helpers.httpRequest as jest.Mock).mockRejectedValueOnce({
				message: 'Request failed with status code 400',
				response: { status: 400, data: { isSuccess: false, message: notFoundMessage } },
			});

			const failure = node.execute!.call(mockExecuteFunctions as any);
			await expect(failure).rejects.not.toBeInstanceOf(NodeApiError);
			await expect(failure).rejects.toThrow(`Posty5 API Error: ${notFoundMessage}`);
		});

		it('refuses a custom range without both days before any request', async () => {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{ operation: 'getAnalytics', [idParameter]: 'rec-1', range: 'custom', from: '2026-08-01T00:00:00', to: '' },
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
			);
			await expect(node.execute!.call(mockExecuteFunctions as any)).rejects.toThrow(
				'A Custom range needs both From and To dates.',
			);
			expect(mockExecuteFunctions.helpers.httpRequest).not.toHaveBeenCalled();
		});
	});

	describe('Get Statistics Operation', () => {
		let node: INodeType;

		beforeEach(() => {
			node = createNode();
		});

		it('is an operation with its own period fields', () => {
			const properties = node.description.properties as any[];
			const operation = properties.find((prop) => prop.name === 'operation');
			expect(operation.options).toContainEqual(
				expect.objectContaining({ name: 'Get Statistics', value: 'getStatistics' }),
			);
			for (const name of ['statisticsPeriod', 'statisticsFrom', 'statisticsTo']) {
				const property = properties.find((prop) => prop.name === name);
				expect(property.displayOptions.show.operation).toEqual(['getStatistics']);
			}
		});

		it('defaults to period=30d on <basePath>/statistics and returns the answer unchanged', async () => {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{ operation: 'getStatistics' },
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				{ result: STATISTICS_RESPONSE },
			);
			const result = (await node.execute!.call(mockExecuteFunctions as any)) as any[][];

			const request = onlyRequest(mockExecuteFunctions);
			expect(request.method).toBe('GET');
			expect(request.url).toMatch(new RegExp(`${basePath}/statistics$`));
			expect(request.qs).toEqual({ period: '30d' });
			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toEqual(STATISTICS_RESPONSE);
		});

		it('sends a custom period with from / to as YYYY-MM-DD', async () => {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'getStatistics',
					statisticsPeriod: 'custom',
					statisticsFrom: '2026-09-01T00:00:00',
					statisticsTo: '2026-09-30T00:00:00',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				{ result: STATISTICS_RESPONSE },
			);
			await node.execute!.call(mockExecuteFunctions as any);
			expect(onlyRequest(mockExecuteFunctions).qs).toEqual({ period: 'custom', from: '2026-09-01', to: '2026-09-30' });
		});
	});
}
