/**
 * Short Link node parameters of the short link controls: the control fields of
 * Create / Update / Set Rules, and the campaign operations' fields.
 */

import type { INodeProperties } from 'n8n-workflow';
import { LINK_CAMPAIGN_COLORS, LINK_PIXEL_PROVIDERS, LINK_UTM_KEYS } from './constants';

const PIXEL_PROVIDER_LABELS: Record<(typeof LINK_PIXEL_PROVIDERS)[number], string> = {
	meta: 'Meta',
	googleAds: 'Google Ads',
	tiktok: 'TikTok',
	linkedin: 'LinkedIn',
	x: 'X',
	pinterest: 'Pinterest',
};

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

/** UTM as a single-value fixedCollection (`utm.values`). */
export function buildUtmProperty(description: string): INodeProperties {
	return {
		displayName: 'UTM',
		name: 'utm',
		type: 'fixedCollection',
		default: {},
		placeholder: 'Add UTM',
		description,
		options: [
			{
				displayName: 'Values',
				name: 'values',
				values: LINK_UTM_KEYS.map((key) => ({
					displayName: capitalize(key),
					name: key,
					type: 'string' as const,
					default: '',
					description: `The utm_${key} value. Up to 100 characters, no spaces, quotes or angle brackets.`,
				})),
			},
		],
	};
}

/** The access / routing / variants / UTM / pixels fields (Set Rules and the Additional Fields). */
const RULE_FIELDS: INodeProperties[] = [
	{
		displayName: 'Active From',
		name: 'activeFrom',
		type: 'dateTime',
		default: '',
		description: 'Before this moment the link answers "not yet active". On Update, an empty value clears it.',
	},
	{
		displayName: 'Expires At',
		name: 'expiresAt',
		type: 'dateTime',
		default: '',
		description: 'After this moment the link answers "expired". On Update, an empty value clears it.',
	},
	{
		displayName: 'Fallback URL',
		name: 'fallbackUrl',
		type: 'string',
		default: '',
		placeholder: 'https://example.com/ended',
		description: 'Where a stopped visit (not active, expired, limit reached) goes instead of the unavailable page',
	},
	{
		displayName: 'Max Visits',
		name: 'maxVisits',
		type: 'number',
		typeOptions: { minValue: 0, maxValue: 10000000 },
		default: 0,
		description: 'Stop the link after this many visits (people, never bots). 0 on Update clears the limit.',
	},
	{
		displayName: 'Password',
		name: 'password',
		type: 'string',
		typeOptions: { password: true },
		default: '',
		description:
			'4 – 128 characters. Visitors must enter it before they continue. Never returned by the API. Plan-gated. n8n stores node parameters in the workflow: prefer an expression reading a secret.',
	},
	{
		displayName: 'Remove Password',
		name: 'removePassword',
		type: 'boolean',
		default: false,
		description: 'Whether to remove the link password (wins over Password)',
	},
	{
		displayName: 'Routing Rules (JSON)',
		name: 'routingRules',
		type: 'json',
		default: '[]',
		description:
			'Ordered rules, the first match wins (max 20). Conditions: countries, devices (tablet, mobile, desktop, other), os (android, ios, windows, macos, linux), languages, timeWindow {days,from,to,tz}. Keep each rule\'s ID when updating. [] on Update clears them.',
		hint: 'Example: [{"name":"DE mobile","conditions":{"countries":["DE"],"devices":["mobile"]},"targetUrl":"https://example.de"}]',
	},
	{
		displayName: 'Variants (JSON)',
		name: 'variants',
		type: 'json',
		default: '[]',
		description:
			'A/B split: 0 or 2 – 5 variants, each with a name, a destination and a relative weight (1 – 100). [] on Update clears them.',
		hint: 'Example: [{"name":"A","url":"https://a.example","weight":50},{"name":"B","url":"https://b.example","weight":50}]',
	},
	buildUtmProperty('UTM parameters appended to the destination'),
	{
		displayName: 'Pixels',
		name: 'pixels',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		default: {},
		placeholder: 'Add Pixel',
		description: 'Retargeting pixels fired before the redirect (one per provider, max 5)',
		options: [
			{
				displayName: 'Pixel',
				name: 'pixel',
				values: [
					{
						displayName: 'Provider',
						name: 'provider',
						type: 'options',
						options: LINK_PIXEL_PROVIDERS.map((value) => ({ name: PIXEL_PROVIDER_LABELS[value], value })),
						default: 'meta',
					},
					{
						displayName: 'Pixel ID',
						name: 'id',
						type: 'string',
						default: '',
					},
				],
			},
		],
	},
	{
		displayName: 'Pixels Consent Acknowledged',
		name: 'pixelsConsentAcknowledged',
		type: 'boolean',
		default: false,
		description: 'Whether you confirm a lawful basis for tracking visitors. Required the first time pixels are set.',
	},
];

/** The control fields appended to the Create / Update Additional Fields. */
export const SHORT_LINK_CONTROL_ADDITIONAL_FIELDS: INodeProperties[] = [
	{
		displayName: 'Tags',
		name: 'tags',
		type: 'string',
		default: '',
		placeholder: 'summer, newsletter',
		description: 'Comma-separated tags. On Update, they replace the list; an empty value clears it.',
	},
	{
		displayName: 'Campaign Name or ID',
		name: 'campaignId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getCampaigns' },
		default: '',
		description:
			'The campaign the link belongs to; its UTM fills the link\'s empty UTM fields. On Update, an empty value detaches it. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Health Monitor',
		name: 'healthMonitor',
		type: 'boolean',
		default: false,
		description: 'Whether Posty5 checks the destination regularly and records when it fails',
	},
	...RULE_FIELDS,
];

/** Set Rules: the rule sections, each sent only when added. */
export const SHORT_LINK_SET_RULES_PROPERTIES: INodeProperties[] = [
	{
		displayName: 'Rules',
		name: 'rules',
		type: 'collection',
		placeholder: 'Add Rule',
		default: {},
		displayOptions: { show: { operation: ['setRules'] } },
		description: 'Only the sections you add change; an added but empty one clears it',
		options: RULE_FIELDS,
	},
];

/** List Tags and the List filters. */
export const SHORT_LINK_LIST_TAGS_PROPERTIES: INodeProperties[] = [
	{
		displayName: 'Starts With',
		name: 'term',
		type: 'string',
		default: '',
		displayOptions: { show: { operation: ['listTags'] } },
		description: 'Only tags starting with this text (case-insensitive)',
	},
];

export const SHORT_LINK_CONTROL_LIST_FILTERS: INodeProperties[] = [
	{
		displayName: 'Campaign Name or ID',
		name: 'campaignId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getCampaigns' },
		default: '',
		description:
			'Only links of this campaign. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Tags',
		name: 'tags',
		type: 'string',
		default: '',
		placeholder: 'summer, newsletter',
		description: 'Comma-separated: links carrying any of these tags',
	},
];

const CAMPAIGN_OPERATIONS_WITH_ID = ['getCampaign', 'updateCampaign', 'deleteCampaign'];

const CAMPAIGN_FIELDS: INodeProperties[] = [
	{
		displayName: 'Color',
		name: 'color',
		type: 'options',
		options: [{ name: 'None', value: '' }, ...LINK_CAMPAIGN_COLORS.map((value) => ({ name: capitalize(value), value }))],
		default: '',
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		default: '',
	},
	buildUtmProperty('Copied into a link\'s empty UTM fields when the link is saved with this campaign'),
];

/** Campaign operations' fields. */
export const LINK_CAMPAIGN_PROPERTIES: INodeProperties[] = [
	{
		displayName: 'Campaign ID',
		name: 'campaignId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { operation: CAMPAIGN_OPERATIONS_WITH_ID } },
	},
	{
		displayName: 'Campaign Name',
		name: 'campaignName',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { operation: ['createCampaign'] } },
	},
	{
		displayName: 'Additional Fields',
		name: 'campaignFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { operation: ['createCampaign'] } },
		options: CAMPAIGN_FIELDS,
	},
	{
		displayName: 'Update Fields',
		name: 'campaignFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { operation: ['updateCampaign'] } },
		options: [
			{
				displayName: 'Archived',
				name: 'archived',
				type: 'boolean',
				default: false,
				description: 'Whether the campaign is archived (hidden from pickers; its links keep working)',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
			},
			...CAMPAIGN_FIELDS,
		],
	},
	{
		displayName: 'Detach Links',
		name: 'detach',
		type: 'boolean',
		default: false,
		displayOptions: { show: { operation: ['deleteCampaign'] } },
		description: 'Whether to detach the campaign\'s links first. Off, the API refuses to delete a campaign links still use.',
	},
	{
		displayName: 'Filters',
		name: 'campaignFilters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { operation: ['listCampaigns'] } },
		options: [
			{
				displayName: 'Archived',
				name: 'archived',
				type: 'boolean',
				default: false,
				description: 'Whether to list only archived (true) or only active (false) campaigns',
			},
			{
				displayName: 'Search',
				name: 'term',
				type: 'string',
				default: '',
				description: 'Only campaigns whose name contains this text',
			},
		],
	},
];
