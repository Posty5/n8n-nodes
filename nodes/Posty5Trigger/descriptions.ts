/** Posty5 Trigger properties: Events, Links, Options. */

import type { INodeProperties } from 'n8n-workflow';
import { TRIGGER_EVENT_OPTIONS, TRIGGER_TARGETS } from './config';

export const POSTY5_TRIGGER_PROPERTIES: INodeProperties[] = [
	{
		displayName:
			'n8n must be reachable over public HTTPS (n8n Cloud, or self-hosted with WEBHOOK_URL set to a public HTTPS address). Static QR codes never produce events.',
		name: 'notice',
		type: 'notice',
		default: '',
	},
	{
		displayName: 'Events',
		name: 'events',
		type: 'multiOptions',
		required: true,
		options: TRIGGER_EVENT_OPTIONS,
		default: [],
		description: 'The Posty5 events that start this workflow',
	},
	{
		displayName: 'Links',
		name: 'links',
		type: 'options',
		options: [
			{ name: 'All My Links and QR Codes', value: TRIGGER_TARGETS.ALL },
			{ name: 'Specific Short Links', value: TRIGGER_TARGETS.SHORT_LINKS },
			{ name: 'Specific QR Codes', value: TRIGGER_TARGETS.QR_CODES },
		],
		default: 'all',
		description: 'Which records the events are about',
	},
	{
		displayName: 'Short Link IDs',
		name: 'shortLinkIds',
		type: 'string',
		required: true,
		displayOptions: { show: { links: [TRIGGER_TARGETS.SHORT_LINKS] } },
		default: '',
		placeholder: '64f0c..., 64f0d...',
		description: 'Comma-separated short link IDs',
	},
	{
		displayName: 'QR Code IDs',
		name: 'qrCodeIds',
		type: 'string',
		required: true,
		displayOptions: { show: { links: [TRIGGER_TARGETS.QR_CODES] } },
		default: '',
		placeholder: '64f0c..., 64f0d...',
		description: 'Comma-separated QR code IDs',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		options: [
			{
				displayName: 'Delivery',
				name: 'delivery',
				type: 'options',
				options: [
					{ name: 'Each Event', value: 'each' },
					{ name: 'Batched — 1 Min', value: 'batch60' },
					{ name: 'Batched — 5 Min', value: 'batch300' },
					{ name: 'Batched — 1 Hour', value: 'batch3600' },
				],
				default: 'each',
				description: 'Send every event at once, or collect them and send one batch per window',
			},
			{
				displayName: 'Include Bot Visits',
				name: 'includeBots',
				type: 'boolean',
				default: false,
				description: 'Whether visits Posty5 recognises as bots also start the workflow',
			},
			{
				displayName: 'Milestones',
				name: 'milestones',
				type: 'string',
				default: '',
				placeholder: '100,1000',
				description: 'Visit or scan counts that fire the milestone events: up to 10 numbers, comma-separated',
			},
			{
				displayName: 'Split Batches Into Items',
				name: 'splitBatches',
				type: 'boolean',
				default: true,
				description: 'Whether a batched delivery becomes one item per event (on) or one item holding the batch (off)',
			},
		],
	},
];
