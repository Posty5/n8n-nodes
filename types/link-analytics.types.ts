/**
 * Link + QR Visit Analytics Types for Posty5 N8N Nodes
 *
 * The *Get Analytics* operation of the Short Link and QR Code nodes reads
 * `GET /api/short-link/:id/analytics` and `GET /api/qr-code/:id/analytics`
 * (contract C2). Both answer the same shape, so it is declared once here.
 */

/** A dimension visits can be broken down by (contract C2). */
export type LinkAnalyticsBreakdown =
	| 'country' // Upper-case ISO-2 country code of the visitor
	| 'device' // desktop, mobile, tablet, other
	| 'os' // Operating system family
	| 'browser' // Browser family
	| 'referrer' // Referrer host
	| 'channel' // "link" (click) or "qr" (scan)
	| 'language' // Primary browser language
	| 'variant' // A/B variant (empty until link campaigns ship)
	| 'rule'; // Routing rule (empty until link campaigns ship)

/** Width of one point of `series`. */
export type LinkAnalyticsInterval = 'day' | 'week' | 'month';

/** The node's Range options. */
export type LinkAnalyticsRange = 'last7Days' | 'last30Days' | 'last90Days' | 'custom';

/** The node's Output options. */
export type LinkAnalyticsOutput = 'response' | 'seriesAsItems';

/** Where the answer was computed from. */
export type LinkAnalyticsSource = 'events' | 'rollup' | 'mixed';

/** The node's Options collection on *Get Analytics* (a key is present only when the user added it). */
export interface ILinkAnalyticsOptions {
	/** IANA time zone, e.g. `Africa/Cairo`. */
	timezone?: string;
	/** Rows per breakdown (1–50); the rest is summed into an `other` row. */
	limit?: number;
}

/** Every *Get Analytics* parameter, as the node reads them for one item. */
export interface ILinkAnalyticsParameters {
	range: LinkAnalyticsRange;
	/** Custom range only: a `dateTime` value (or an expression's date). */
	from?: unknown;
	/** Custom range only: a `dateTime` value (or an expression's date). */
	to?: unknown;
	interval: LinkAnalyticsInterval;
	/** `true` sends `breakdown=all`; `breakdowns` is then ignored. */
	allBreakdowns: boolean;
	breakdowns: LinkAnalyticsBreakdown[];
	options: ILinkAnalyticsOptions;
	/**
	 * The zone presets count "today" in and the request sends as `tz`: the Time
	 * Zone option, else the workflow's time zone (`getTimezone()`), else UTC.
	 */
	timeZone: string;
}

/** A resolved range: two `YYYY-MM-DD` day keys, both inclusive. */
export interface ILinkAnalyticsDateRange {
	from: string;
	to: string;
}

/** The query string the node sends. Absent keys take the API default. */
export interface ILinkAnalyticsQuery {
	from: string;
	to: string;
	interval: LinkAnalyticsInterval;
	tz: string;
	/** `all`, or a comma list of breakdown names. */
	breakdown?: string;
	limit?: number;
}

/** Visit totals over the whole range. */
export interface ILinkAnalyticsTotals {
	/** Human visits; bots and link-preview fetchers are counted only in `botVisits`. */
	visits: number;
	/** Sum of each day's unique visitors. */
	uniqueVisitors: number;
	botVisits: number;
}

/** One point of the series. */
export interface ILinkAnalyticsSeriesPoint {
	/** First day of the bucket, `YYYY-MM-DD` in `meta.timezone`. */
	date: string;
	visits: number;
	uniqueVisitors: number;
}

/** One row of a breakdown. */
export interface ILinkAnalyticsBreakdownRow {
	/** The dimension's value, or `other` for the rest past `limit`. */
	key: string;
	visits: number;
	uniqueVisitors: number;
}

/** A breakdown the owner's plan does not include. */
export interface ILinkAnalyticsLockedBreakdown {
	breakdown: LinkAnalyticsBreakdown;
	/** Lowest plan that includes it, as the API names it. */
	requiredPlan: string;
}

/** How the answer was computed. */
export interface ILinkAnalyticsMeta {
	from: string;
	to: string;
	interval: LinkAnalyticsInterval;
	/** `UTC` when the range reaches past raw-event retention. */
	timezone: string;
	source: LinkAnalyticsSource;
	analyticsStartedAt: string;
	locked: ILinkAnalyticsLockedBreakdown[];
	/** `null` when the plan reads the full history. */
	maxHistoryDays: number | null;
}

/** Answer of the analytics route (the `result` of the API envelope). */
export interface ILinkAnalyticsResponse {
	totals: ILinkAnalyticsTotals;
	series: ILinkAnalyticsSeriesPoint[];
	breakdowns: Partial<Record<LinkAnalyticsBreakdown, ILinkAnalyticsBreakdownRow[]>>;
	meta: ILinkAnalyticsMeta;
}

/** One output item of *Series as Items*: a series point that still carries `meta`. */
export interface ILinkAnalyticsSeriesItem extends ILinkAnalyticsSeriesPoint {
	meta: ILinkAnalyticsMeta;
}

/** The node's Period options on *Get Statistics* (the API's `period` values). */
export type LinkStatisticsPeriod = 'today' | '7d' | '30d' | 'month' | 'custom';

/** The query string of *Get Statistics* (`GET /api/short-link/statistics`, `GET /api/qr-code/statistics`). */
export interface ILinkStatisticsQuery {
	period: LinkStatisticsPeriod;
	/** Custom only, `YYYY-MM-DD`. */
	from?: string;
	/** Custom only, `YYYY-MM-DD`. */
	to?: string;
}

/** One row of `data.daily`. */
export interface ILinkStatisticsDailyRow {
	/** UTC day, `YYYY-MM-DD`. */
	_id: string;
	/** Records created that day. */
	createdCount: number;
	/** Visits by people that day (bots excluded). */
	visitorsSum: number;
}

/**
 * Answer of the statistics routes (the `result` of the API envelope). `data`
 * carries `totals` (`totalLinks` / `totalQRCodes`, `totalVisitors`, the
 * `avgVisitorsPer…` ratio, `visitsInRange`, `uniqueVisitorsInRange`,
 * `botVisitsInRange`), `daily`, and `topLinks` / `topQRCodes`.
 */
export interface ILinkStatisticsResponse {
	range: { from: string; to: string; period: LinkStatisticsPeriod };
	data: {
		totals: Record<string, number>;
		daily: ILinkStatisticsDailyRow[];
		[topList: string]: unknown;
	};
}
