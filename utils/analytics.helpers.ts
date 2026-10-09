/**
 * *Get Analytics* on the Short Link and QR Code nodes (contract C2).
 *
 * Both nodes read the same parameters and answer the same shape, so the range
 * resolution, the query, the output shaping and the plan-gate error live here,
 * not in either node's `execute`. The query follows the SDKs: dates as
 * `YYYY-MM-DD`, an explicit breakdown list joined with `,`, `all` sent as is,
 * an empty list left out (the API default applies).
 */

import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import type { IExecuteFunctions, JsonObject } from 'n8n-workflow';
import { makeApiRequest } from './api.helpers';
import { LINK_ANALYTICS, LINK_ANALYTICS_MESSAGES, LINK_STATISTICS } from './constants';
import { isKnownTimeZone, parseDayKey, shiftDayKey, toDayKey } from './date.helpers';
import { firstText } from './link-tool.helpers';
import type { IPosty5ApiError } from '../types/common';
import type {
	ILinkAnalyticsDateRange,
	ILinkAnalyticsOptions,
	ILinkAnalyticsParameters,
	ILinkAnalyticsQuery,
	ILinkAnalyticsResponse,
	ILinkAnalyticsSeriesItem,
	LinkAnalyticsBreakdown,
	LinkAnalyticsInterval,
	LinkAnalyticsOutput,
	LinkAnalyticsRange,
	ILinkStatisticsQuery,
	ILinkStatisticsResponse,
	LinkStatisticsPeriod,
} from '../types/link-analytics.types';

/**
 * Runs *Get Analytics* for item `itemIndex`: reads its parameters, resolves the
 * range, calls `GET <basePath>/<id>/analytics` and shapes the output.
 * @param basePath `API_ENDPOINTS.SHORT_LINK` or `API_ENDPOINTS.QR_CODE`.
 * @param id The record's ID parameter value.
 */
export async function executeGetAnalytics(
	context: IExecuteFunctions,
	apiKey: string,
	basePath: string,
	id: unknown,
	itemIndex: number,
): Promise<ILinkAnalyticsResponse | ILinkAnalyticsSeriesItem[]> {
	const endpoint = buildAnalyticsEndpoint(context, basePath, id, itemIndex);
	const parameters = getAnalyticsParameters(context, itemIndex);
	const qs = buildAnalyticsQuery(resolveAnalyticsRange(context, parameters, new Date(), itemIndex), parameters);
	const output = context.getNodeParameter('output', itemIndex, LINK_ANALYTICS.DEFAULT_OUTPUT) as LinkAnalyticsOutput;

	let response: ILinkAnalyticsResponse;
	try {
		response = (await makeApiRequest.call(context, apiKey, { method: 'GET', endpoint, qs })) as ILinkAnalyticsResponse;
	} catch (error) {
		throw toAnalyticsError(context, error, itemIndex);
	}
	return toAnalyticsOutput(response, output);
}

/** Reads every *Get Analytics* parameter of item `itemIndex`. */
export function getAnalyticsParameters(context: IExecuteFunctions, itemIndex: number): ILinkAnalyticsParameters {
	const range = context.getNodeParameter('range', itemIndex, LINK_ANALYTICS.DEFAULT_RANGE) as LinkAnalyticsRange;
	const isCustom = range === 'custom';
	const allBreakdowns = context.getNodeParameter('allBreakdowns', itemIndex, true) as boolean;
	const options = context.getNodeParameter('analyticsOptions', itemIndex, {}) as ILinkAnalyticsOptions;
	// A field hidden by its display options is not read.
	return {
		range,
		from: isCustom ? context.getNodeParameter('from', itemIndex, '') : undefined,
		to: isCustom ? context.getNodeParameter('to', itemIndex, '') : undefined,
		interval: context.getNodeParameter(
			'interval',
			itemIndex,
			LINK_ANALYTICS.DEFAULT_INTERVAL,
		) as LinkAnalyticsInterval,
		allBreakdowns,
		breakdowns: allBreakdowns
			? []
			: (context.getNodeParameter('breakdowns', itemIndex, []) as LinkAnalyticsBreakdown[]),
		options,
		timeZone: resolveAnalyticsTimeZone(context, options),
	};
}

/**
 * The zone of one request: the Time Zone option, else the workflow's time zone
 * (Workflow Settings → Timezone, which defaults to the instance's
 * `GENERIC_TIMEZONE`), else UTC. Sent as `tz` so the API buckets days in the
 * same zone the presets count "today" in.
 */
export function resolveAnalyticsTimeZone(context: IExecuteFunctions, options: ILinkAnalyticsOptions): string {
	return (
		firstText(options.timezone) ??
		firstText(typeof context.getTimezone === 'function' ? context.getTimezone() : undefined) ??
		LINK_ANALYTICS.FALLBACK_TIME_ZONE
	);
}

/**
 * `<basePath>/<id>/analytics`, with the ID trimmed and escaped.
 * @throws NodeOperationError when the ID is empty.
 */
export function buildAnalyticsEndpoint(
	context: IExecuteFunctions,
	basePath: string,
	id: unknown,
	itemIndex: number,
): string {
	const recordId = firstText(id);
	if (!recordId) {
		throw new NodeOperationError(context.getNode(), LINK_ANALYTICS_MESSAGES.ID_REQUIRED, { itemIndex });
	}
	return `${basePath}/${encodeURIComponent(recordId)}/${LINK_ANALYTICS.PATH_SEGMENT}`;
}

/**
 * The range as two inclusive day keys. A preset ends today — counted in
 * `parameters.timeZone` — and spans its number of days, today included
 * (*Last 7 days* on 2026-10-05 is 2026-09-29 … 2026-10-05). *Custom* sends the
 * From and To days as picked; the API checks their order, span and plan window.
 * @throws NodeOperationError for an unknown time zone, or a missing or
 *   unreadable custom date.
 */
export function resolveAnalyticsRange(
	context: IExecuteFunctions,
	parameters: ILinkAnalyticsParameters,
	now: Date,
	itemIndex: number,
): ILinkAnalyticsDateRange {
	// Checked for every range: the zone is also sent as `tz`, which the API validates.
	if (!isKnownTimeZone(parameters.timeZone)) {
		throw new NodeOperationError(
			context.getNode(),
			`Time Zone "${parameters.timeZone}" ${LINK_ANALYTICS_MESSAGES.UNKNOWN_TIME_ZONE}`,
			{ itemIndex },
		);
	}
	if (parameters.range === 'custom') {
		if (!firstText(parameters.from) || !firstText(parameters.to)) {
			throw new NodeOperationError(context.getNode(), LINK_ANALYTICS_MESSAGES.CUSTOM_RANGE_REQUIRED, {
				itemIndex,
			});
		}
		return {
			from: requireDayKey(context, 'From', parameters.from, itemIndex),
			to: requireDayKey(context, 'To', parameters.to, itemIndex),
		};
	}

	const presets: Record<string, number> = LINK_ANALYTICS.RANGE_DAYS;
	const days = presets[parameters.range] ?? presets[LINK_ANALYTICS.DEFAULT_RANGE];
	const to = toDayKey(now, parameters.timeZone);
	return { from: shiftDayKey(to, 1 - days), to };
}

/** The query string of one *Get Analytics* request. */
export function buildAnalyticsQuery(range: ILinkAnalyticsDateRange, parameters: ILinkAnalyticsParameters): ILinkAnalyticsQuery {
	const query: ILinkAnalyticsQuery = {
		from: range.from,
		to: range.to,
		interval: parameters.interval,
		tz: parameters.timeZone,
	};

	if (parameters.allBreakdowns) {
		query.breakdown = LINK_ANALYTICS.ALL_BREAKDOWNS;
	} else if (parameters.breakdowns.length > 0) {
		query.breakdown = parameters.breakdowns.join(LINK_ANALYTICS.BREAKDOWN_SEPARATOR);
	}

	if (typeof parameters.options.limit === 'number') query.limit = parameters.options.limit;
	return query;
}

/**
 * What the operation outputs for one input item: the API answer unchanged, or
 * — *Series as Items* — one item per series point, each still carrying `meta`.
 */
export function toAnalyticsOutput(
	response: ILinkAnalyticsResponse,
	output: LinkAnalyticsOutput,
): ILinkAnalyticsResponse | ILinkAnalyticsSeriesItem[] {
	if (output !== 'seriesAsItems') return response;
	return (response?.series ?? []).map((point) => ({ ...point, meta: response.meta }));
}

/**
 * A failed analytics request as the node throws it. The plan-gate 403 (a
 * breakdown or a range the owner's plan does not include, or a record the API
 * key may not read) becomes a `NodeApiError` carrying the API's message
 * unchanged (C4: no client hard-codes a plan); any other error is returned as is.
 */
export function toAnalyticsError(context: IExecuteFunctions, error: unknown, itemIndex: number): unknown {
	const apiError = error as IPosty5ApiError;
	if (apiError?.httpCode !== LINK_ANALYTICS.PLAN_GATE_HTTP_CODE) return error;

	const message = apiError.apiMessage || apiError.message;
	return new NodeApiError(context.getNode(), { message, httpCode: apiError.httpCode } as JsonObject, {
		message,
		httpCode: apiError.httpCode,
		itemIndex,
	});
}

/**
 * Runs *Get Statistics* for item `itemIndex`: `GET <basePath>/statistics` with
 * the Period (and, for Custom, From / To), returning the API answer unchanged.
 * @param basePath `API_ENDPOINTS.SHORT_LINK` or `API_ENDPOINTS.QR_CODE`.
 */
export async function executeGetStatistics(
	context: IExecuteFunctions,
	apiKey: string,
	basePath: string,
	itemIndex: number,
): Promise<ILinkStatisticsResponse> {
	const period = context.getNodeParameter(
		'statisticsPeriod',
		itemIndex,
		LINK_STATISTICS.DEFAULT_PERIOD,
	) as LinkStatisticsPeriod;
	const isCustom = period === LINK_STATISTICS.CUSTOM_PERIOD;
	const qs = buildStatisticsQuery(
		context,
		period,
		isCustom ? context.getNodeParameter('statisticsFrom', itemIndex, '') : undefined,
		isCustom ? context.getNodeParameter('statisticsTo', itemIndex, '') : undefined,
		itemIndex,
	);
	return (await makeApiRequest.call(context, apiKey, {
		method: 'GET',
		endpoint: `${basePath}/${LINK_STATISTICS.PATH_SEGMENT}`,
		qs,
	})) as ILinkStatisticsResponse;
}

/**
 * The *Get Statistics* query: the period, plus `from` / `to` as day keys for
 * Custom (both required, like *Get Analytics*).
 * @throws NodeOperationError for a missing or unreadable custom date.
 */
export function buildStatisticsQuery(
	context: IExecuteFunctions,
	period: LinkStatisticsPeriod,
	from: unknown,
	to: unknown,
	itemIndex: number,
): ILinkStatisticsQuery {
	if (period !== LINK_STATISTICS.CUSTOM_PERIOD) return { period };
	if (!firstText(from) || !firstText(to)) {
		throw new NodeOperationError(context.getNode(), LINK_ANALYTICS_MESSAGES.CUSTOM_RANGE_REQUIRED, { itemIndex });
	}
	return {
		period,
		from: requireDayKey(context, 'From', from, itemIndex),
		to: requireDayKey(context, 'To', to, itemIndex),
	};
}

/** A custom From / To value as a day key. */
function requireDayKey(context: IExecuteFunctions, label: string, value: unknown, itemIndex: number): string {
	const dayKey = parseDayKey(value);
	if (!dayKey) {
		throw new NodeOperationError(
			context.getNode(),
			`${label} "${String(value)}" ${LINK_ANALYTICS_MESSAGES.INVALID_DATE}`,
			{ itemIndex },
		);
	}
	return dayKey;
}
