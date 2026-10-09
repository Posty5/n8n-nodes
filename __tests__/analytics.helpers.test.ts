import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import {
	buildAnalyticsEndpoint,
	buildAnalyticsQuery,
	buildStatisticsQuery,
	resolveAnalyticsRange,
	resolveAnalyticsTimeZone,
	toAnalyticsError,
	toAnalyticsOutput,
} from '../utils/analytics.helpers';
import { toPosty5ApiError } from '../utils/api.helpers';
import { parseDayKey, shiftDayKey, toDayKey } from '../utils/date.helpers';
import type { ILinkAnalyticsParameters } from '../types/link-analytics.types';
import { ANALYTICS_NOW, ANALYTICS_RESPONSE, PLAN_GATE_ERROR } from './link-analytics.fixture';
import { createMockExecuteFunctions } from './setup';

/** *Get Analytics* parameters as a new node has them, with `overrides` on top. */
function parameters(overrides: Partial<ILinkAnalyticsParameters> = {}): ILinkAnalyticsParameters {
	return {
		range: 'last30Days',
		interval: 'day',
		allBreakdowns: true,
		breakdowns: [],
		options: {},
		timeZone: 'UTC',
		...overrides,
	};
}

describe('date.helpers', () => {
	it('names the day in a zone, not in UTC', () => {
		// 2026-10-05 22:30 UTC is already 2026-10-06 in Cairo (UTC+3).
		const lateEvening = new Date('2026-10-05T22:30:00.000Z');
		expect(toDayKey(lateEvening, 'UTC')).toBe('2026-10-05');
		expect(toDayKey(lateEvening, 'Africa/Cairo')).toBe('2026-10-06');
	});

	it('shifts a day key across a month end', () => {
		expect(shiftDayKey('2026-10-01', -1)).toBe('2026-09-30');
		expect(shiftDayKey('2026-09-30', 1)).toBe('2026-10-01');
	});

	it('reads the day of a dateTime string, a Date and a Luxon-like value', () => {
		expect(parseDayKey('2026-10-01T23:59:00')).toBe('2026-10-01');
		expect(parseDayKey('2026-10-01')).toBe('2026-10-01');
		expect(parseDayKey(new Date('2026-10-01T05:00:00.000Z'))).toBe('2026-10-01');
		expect(parseDayKey({ toISODate: () => '2026-10-02' })).toBe('2026-10-02');
		expect(parseDayKey('next tuesday')).toBeUndefined();
		expect(parseDayKey(new Date('invalid'))).toBeUndefined();
	});
});

describe('analytics.helpers', () => {
	const context = createMockExecuteFunctions();

	describe('resolveAnalyticsRange', () => {
		it.each([
			['last7Days', '2026-09-29'],
			['last30Days', '2026-09-06'],
			['last90Days', '2026-07-08'],
		] as const)('%s ends today (UTC) and counts today', (range, from) => {
			expect(resolveAnalyticsRange(context, parameters({ range }), ANALYTICS_NOW, 0)).toEqual({
				from,
				to: '2026-10-05',
			});
		});

		it('counts "today" in the resolved time zone', () => {
			const lateEvening = new Date('2026-10-05T22:30:00.000Z');
			expect(
				resolveAnalyticsRange(
					context,
					parameters({ range: 'last7Days', timeZone: 'Africa/Cairo' }),
					lateEvening,
					0,
				),
			).toEqual({ from: '2026-09-30', to: '2026-10-06' });
		});

		it('refuses an unknown time zone', () => {
			expect(() =>
				resolveAnalyticsRange(context, parameters({ timeZone: 'Mars/Olympus' }), ANALYTICS_NOW, 0),
			).toThrow(NodeOperationError);
		});

		it('sends the custom days as picked', () => {
			expect(
				resolveAnalyticsRange(
					context,
					parameters({ range: 'custom', from: '2026-09-01T00:00:00', to: '2026-09-15T00:00:00' }),
					ANALYTICS_NOW,
					0,
				),
			).toEqual({ from: '2026-09-01', to: '2026-09-15' });
		});

		it('refuses a custom range without both days', () => {
			expect(() =>
				resolveAnalyticsRange(context, parameters({ range: 'custom', from: '2026-09-01', to: '' }), ANALYTICS_NOW, 0),
			).toThrow('A Custom range needs both From and To dates.');
		});

		it('refuses a custom day that is not a date', () => {
			expect(() =>
				resolveAnalyticsRange(
					context,
					parameters({ range: 'custom', from: 'soon', to: '2026-09-15' }),
					ANALYTICS_NOW,
					0,
				),
			).toThrow('From "soon" is not a date');
		});
	});

	describe('buildAnalyticsQuery', () => {
		const range = { from: '2026-09-06', to: '2026-10-05' };

		it('sends breakdown=all for the toggle', () => {
			expect(buildAnalyticsQuery(range, parameters())).toEqual({
				from: '2026-09-06',
				to: '2026-10-05',
				interval: 'day',
				tz: 'UTC',
				breakdown: 'all',
			});
		});

		it('joins an explicit list with commas', () => {
			const query = buildAnalyticsQuery(
				range,
				parameters({ allBreakdowns: false, breakdowns: ['country', 'device', 'referrer'] }),
			);
			expect(query.breakdown).toBe('country,device,referrer');
		});

		it('leaves an empty list out', () => {
			const query = buildAnalyticsQuery(range, parameters({ allBreakdowns: false, breakdowns: [] }));
			expect(query).not.toHaveProperty('breakdown');
		});

		it('always sends the resolved zone as tz, and limit only when set', () => {
			expect(buildAnalyticsQuery(range, parameters())).not.toHaveProperty('limit');
			const query = buildAnalyticsQuery(
				range,
				parameters({ interval: 'week', timeZone: 'Africa/Cairo', options: { limit: 25 } }),
			);
			expect(query).toEqual(expect.objectContaining({ interval: 'week', tz: 'Africa/Cairo', limit: 25 }));
		});
	});

	describe('resolveAnalyticsTimeZone', () => {
		it('prefers the Time Zone option, then the workflow zone, then UTC', () => {
			const workflow = createMockExecuteFunctions();
			expect(resolveAnalyticsTimeZone(workflow, { timezone: ' Africa/Cairo ' })).toBe('Africa/Cairo');
			expect(resolveAnalyticsTimeZone(workflow, {})).toBe('America/New_York');
			(workflow.getTimezone as jest.Mock).mockReturnValue('');
			expect(resolveAnalyticsTimeZone(workflow, {})).toBe('UTC');
		});
	});

	describe('buildStatisticsQuery', () => {
		it('sends a preset period alone', () => {
			expect(buildStatisticsQuery(context, '7d', undefined, undefined, 0)).toEqual({ period: '7d' });
		});

		it('sends custom days as YYYY-MM-DD and refuses a missing one', () => {
			expect(buildStatisticsQuery(context, 'custom', '2026-09-01T00:00:00', '2026-09-30T00:00:00', 0)).toEqual({
				period: 'custom',
				from: '2026-09-01',
				to: '2026-09-30',
			});
			expect(() => buildStatisticsQuery(context, 'custom', '', '2026-09-30', 0)).toThrow(NodeOperationError);
		});
	});

	describe('buildAnalyticsEndpoint', () => {
		it('escapes the ID and refuses an empty one', () => {
			expect(buildAnalyticsEndpoint(context, '/api/short-link', ' sl 1 ', 0)).toBe(
				'/api/short-link/sl%201/analytics',
			);
			expect(() => buildAnalyticsEndpoint(context, '/api/qr-code', '  ', 0)).toThrow(NodeOperationError);
		});
	});

	describe('toAnalyticsOutput', () => {
		it('returns the answer unchanged by default', () => {
			expect(toAnalyticsOutput(ANALYTICS_RESPONSE, 'response')).toBe(ANALYTICS_RESPONSE);
		});

		it('splits the series into items that carry meta', () => {
			const items = toAnalyticsOutput(ANALYTICS_RESPONSE, 'seriesAsItems');
			expect(items).toEqual(
				ANALYTICS_RESPONSE.series.map((point) => ({ ...point, meta: ANALYTICS_RESPONSE.meta })),
			);
		});
	});

	describe('toAnalyticsError', () => {
		it('maps the 403 to a NodeApiError with the API message unchanged', () => {
			const error = toAnalyticsError(context, toPosty5ApiError(PLAN_GATE_ERROR), 0) as NodeApiError;
			expect(error).toBeInstanceOf(NodeApiError);
			expect(error.message).toBe('This feature is not available on your current plan.');
			expect(error.httpCode).toBe('403');
		});

		it('leaves any other error as it is (the not-found answer is a 400)', () => {
			const notFound = toPosty5ApiError({ response: { status: 400, data: { message: 'The Short Link Is Not Found' } } });
			expect(toAnalyticsError(context, notFound, 0)).toBe(notFound);
		});
	});

	describe('toPosty5ApiError', () => {
		it('reads the axios body and the older request-library body', () => {
			expect(toPosty5ApiError(PLAN_GATE_ERROR)).toEqual(
				expect.objectContaining({
					message: 'Posty5 API Error: This feature is not available on your current plan.',
					httpCode: '403',
					apiMessage: 'This feature is not available on your current plan.',
				}),
			);
			expect(toPosty5ApiError({ response: { body: { message: 'You Have Not Permission' } } }).message).toBe(
				'Posty5 API Error: You Have Not Permission',
			);
		});
	});
});
