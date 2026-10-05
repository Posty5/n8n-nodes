import type { ILinkAnalyticsResponse } from '../types/link-analytics.types';

/** The instant the *Get Analytics* tests treat as "now": 2026-10-05 10:00 UTC (13:00 in Cairo). */
export const ANALYTICS_NOW = new Date('2026-10-05T10:00:00.000Z');

/** An analytics answer (the `result` of the API envelope) with a three-day series. */
export const ANALYTICS_RESPONSE: ILinkAnalyticsResponse = {
	totals: { visits: 12, uniqueVisitors: 9, botVisits: 4 },
	series: [
		{ date: '2026-10-03', visits: 5, uniqueVisitors: 4 },
		{ date: '2026-10-04', visits: 0, uniqueVisitors: 0 },
		{ date: '2026-10-05', visits: 7, uniqueVisitors: 5 },
	],
	breakdowns: {
		channel: [
			{ key: 'link', visits: 8, uniqueVisitors: 6 },
			{ key: 'qr', visits: 4, uniqueVisitors: 3 },
		],
		device: [{ key: 'mobile', visits: 12, uniqueVisitors: 9 }],
	},
	meta: {
		from: '2026-10-03',
		to: '2026-10-05',
		interval: 'day',
		timezone: 'UTC',
		source: 'events',
		analyticsStartedAt: '2026-10-01T00:00:00.000Z',
		locked: [{ breakdown: 'country', requiredPlan: 'basic' }],
		maxHistoryDays: 30,
	},
};

/** The plan-gate refusal as n8n's `httpRequest` (axios) throws it. */
export const PLAN_GATE_ERROR = {
	message: 'Request failed with status code 403',
	response: {
		status: 403,
		data: { isSuccess: false, message: 'This feature is not available on your current plan.' },
	},
};

/** A statistics answer (the `result` of the API envelope). */
export const STATISTICS_RESPONSE = {
	range: { from: '2026-09-06T00:00:00.000Z', to: '2026-10-05T23:59:59.999Z', period: '30d' },
	data: {
		totals: { totalVisitors: 120, visitsInRange: 30, uniqueVisitorsInRange: 22, botVisitsInRange: 6 },
		daily: [{ _id: '2026-10-05', createdCount: 1, visitorsSum: 7 }],
	},
};
