/**
 * The *Get Analytics* parameters, shared by the Short Link and QR Code nodes
 * (each node keeps its own ID field and adds `getAnalytics` to its display
 * options). Read by `getAnalyticsParameters` in `analytics.helpers.ts`.
 */

import type { INodeProperties } from 'n8n-workflow';
import { LINK_ANALYTICS, LINK_STATISTICS } from './constants';

/** Shown only for the *Get Analytics* operation. */
const SHOW_ON_GET_ANALYTICS = { show: { operation: ['getAnalytics'] } };

export const LINK_ANALYTICS_PROPERTIES: INodeProperties[] = [
	{
		displayName: 'Range',
		name: 'range',
		type: 'options',
		displayOptions: SHOW_ON_GET_ANALYTICS,
		options: [
			{ name: 'Custom', value: 'custom', description: 'Pick the first and last day' },
			{ name: 'Last 30 Days', value: 'last30Days', description: 'Today and the 29 days before it' },
			{ name: 'Last 7 Days', value: 'last7Days', description: 'Today and the 6 days before it' },
			{ name: 'Last 90 Days', value: 'last90Days', description: 'Today and the 89 days before it' },
		],
		default: LINK_ANALYTICS.DEFAULT_RANGE,
		description:
			'The days to read. "Today" is counted in the Time Zone option, or in the time zone of the workflow when it is empty. A range that reaches further back than your plan allows answers the plan error.',
	},
	{
		displayName: 'From',
		name: 'from',
		type: 'dateTime',
		required: true,
		displayOptions: { show: { operation: ['getAnalytics'], range: ['custom'] } },
		default: '',
		description: 'First day of the range (only the date is used)',
	},
	{
		displayName: 'To',
		name: 'to',
		type: 'dateTime',
		required: true,
		displayOptions: { show: { operation: ['getAnalytics'], range: ['custom'] } },
		default: '',
		description: 'Last day of the range, included (only the date is used). A future day is clamped to today.',
	},
	{
		displayName: 'Interval',
		name: 'interval',
		type: 'options',
		displayOptions: SHOW_ON_GET_ANALYTICS,
		options: [
			{ name: 'Day', value: 'day' },
			{ name: 'Month', value: 'month', description: 'Each point starts on the 1st' },
			{ name: 'Week', value: 'week', description: 'Each point starts on a Monday' },
		],
		default: LINK_ANALYTICS.DEFAULT_INTERVAL,
		description: 'Width of one point of the series',
	},
	{
		displayName: 'All Breakdowns My Plan Allows',
		name: 'allBreakdowns',
		type: 'boolean',
		displayOptions: SHOW_ON_GET_ANALYTICS,
		default: true,
		description:
			'Whether to return every breakdown your plan includes. The ones it does not are listed in meta.locked with the plan that adds them.',
	},
	{
		displayName: 'Breakdowns',
		name: 'breakdowns',
		type: 'multiOptions',
		displayOptions: { show: { operation: ['getAnalytics'], allBreakdowns: [false] } },
		options: [
			{ name: 'A/B Variant', value: 'variant', description: 'Empty until link campaigns are available' },
			{ name: 'Browser', value: 'browser' },
			{ name: 'Channel', value: 'channel', description: 'Click (link) or scan (qr)' },
			{ name: 'Country', value: 'country', description: 'Two-letter country code' },
			{ name: 'Device', value: 'device', description: 'Desktop, mobile, tablet or other' },
			{ name: 'Language', value: 'language', description: 'Primary browser language' },
			{ name: 'Operating System', value: 'os' },
			{ name: 'Referrer', value: 'referrer', description: 'The site the visitor came from' },
			{ name: 'Routing Rule', value: 'rule', description: 'Empty until link campaigns are available' },
		],
		default: [],
		description:
			'Breakdowns to return. Naming one your plan does not include answers the plan error. Left empty, the API returns every breakdown your plan allows.',
	},
	{
		displayName: 'Output',
		name: 'output',
		type: 'options',
		displayOptions: SHOW_ON_GET_ANALYTICS,
		options: [
			{
				name: 'Full Response',
				value: 'response',
				description: 'One item: totals, series, breakdowns and meta, as the API answers',
			},
			{
				name: 'Series as Items',
				value: 'seriesAsItems',
				description: 'One item per series point (date, visits, unique visitors), each with meta',
			},
		],
		default: LINK_ANALYTICS.DEFAULT_OUTPUT,
	},
	{
		displayName: 'Options',
		name: 'analyticsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: SHOW_ON_GET_ANALYTICS,
		options: [
			{
				displayName: 'Breakdown Rows',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: LINK_ANALYTICS.LIMIT_MIN,
					maxValue: LINK_ANALYTICS.LIMIT_MAX,
				},
				default: LINK_ANALYTICS.LIMIT_DEFAULT,
				description: 'Rows per breakdown, 1 to 50 (API default 10); the rest is summed into an "other" row',
			},
			{
				displayName: 'Time Zone',
				name: 'timezone',
				type: 'string',
				default: '',
				placeholder: 'Africa/Cairo',
				description:
					'IANA time zone the days are counted in, sent as tz. Empty: the time zone of the workflow (Workflow Settings > Timezone). Ranges older than the raw-visit retention are counted in UTC days (meta.timezone says so).',
			},
		],
	},
];

/** Shown only for the *Get Statistics* operation. */
const SHOW_ON_GET_STATISTICS = { show: { operation: ['getStatistics'] } };

/** *Get Statistics* parameters (account-wide counts; no ID field). Read by `executeGetStatistics`. */
export const LINK_STATISTICS_PROPERTIES: INodeProperties[] = [
	{
		displayName: 'Period',
		name: 'statisticsPeriod',
		type: 'options',
		displayOptions: SHOW_ON_GET_STATISTICS,
		options: [
			{ name: 'Custom', value: 'custom', description: 'Pick the first and last day' },
			{ name: 'Last 30 Days', value: '30d', description: 'Today and the 29 days before it' },
			{ name: 'Last 7 Days', value: '7d', description: 'Today and the 6 days before it' },
			{ name: 'This Month', value: 'month', description: 'From the 1st of this month' },
			{ name: 'Today', value: 'today' },
		],
		default: LINK_STATISTICS.DEFAULT_PERIOD,
		description: 'The days to count. Days are UTC days.',
	},
	{
		displayName: 'From',
		name: 'statisticsFrom',
		type: 'dateTime',
		required: true,
		displayOptions: { show: { operation: ['getStatistics'], statisticsPeriod: ['custom'] } },
		default: '',
		description: 'First day of the period (only the date is used)',
	},
	{
		displayName: 'To',
		name: 'statisticsTo',
		type: 'dateTime',
		required: true,
		displayOptions: { show: { operation: ['getStatistics'], statisticsPeriod: ['custom'] } },
		default: '',
		description: 'Last day of the period, included (only the date is used)',
	},
];
