import {
	IExecuteFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { makeApiRequest, makePaginatedRequest } from '../../utils/api.helpers';
import { executeGetAnalytics, executeGetStatistics } from '../../utils/analytics.helpers';
import { LINK_ANALYTICS_PROPERTIES, LINK_STATISTICS_PROPERTIES } from '../../utils/analytics.properties';
import { API_ENDPOINTS } from '../../utils/constants';
import { executeBulkCreate, prepareBulkRows, readBulkDefaults } from '../../utils/link-bulk.helpers';
import { buildLinkBulkProperties } from '../../utils/link-bulk.properties';
import { buildQrCodeBulkRow, QR_CODE_BULK_ROUTE } from './helpers';
import type { IBulkNodeOptions } from '../../types/link-bulk.types';
import { buildCommonCreateFields, buildCommonUpdateFields, firstText, toText } from '../../utils/link-tool.helpers';
import { buildQrAccess, buildQrCodeTarget, readQrMode, requiredQrMode } from '../../utils/qr-target.helpers';
import { uploadQrFile } from '../../utils/qr-file.helpers';
import { getQrTemplates, requireTemplateId } from '../../utils/qr-templates.helpers';
import { QR_CONTENT_CONFIG, QR_EVENT_TIMEZONES, toNodeOptions } from '../../utils/qr-content.config';
import type { ILinkToolAdditionalFields } from '../../types/common';
import type {
	IListParams,
	IQRCodeFullDetailsResponse,
	IQRCodeScanRulesParameter,
	IQRCodeWriteRequest,
} from '../../types/qr-code.types';

/** QR Type options. *Create Many* offers all but the bulk-excluded ones (`file`). */
const QR_TYPE_OPTIONS: INodePropertyOptions[] = [
	{
		name: 'URL',
		value: 'url',
		description: 'Link to a website',
	},
	{
		name: 'Free Text',
		value: 'freeText',
		description: 'Plain text content',
	},
	{
		name: 'Email',
		value: 'email',
		description: 'Email address with optional subject and body',
	},
	{
		name: 'WiFi',
		value: 'wifi',
		description: 'WiFi network credentials',
	},
	{
		name: 'Phone Call',
		value: 'call',
		description: 'Phone number to call',
	},
	{
		name: 'SMS',
		value: 'sms',
		description: 'SMS message',
	},
	{
		name: 'Geolocation',
		value: 'geolocation',
		description: 'Geographic coordinates',
	},
	{
		name: 'Business Card (vCard)',
		value: 'vcard',
		description: 'Contact card a phone saves to its contacts',
	},
	{
		name: 'Calendar Event',
		value: 'event',
		description: 'Event a phone adds to its calendar',
	},
	{
		name: 'WhatsApp',
		value: 'whatsapp',
		description: 'Opens a WhatsApp chat with an optional pre-filled message',
	},
	{
		name: 'Review Link',
		value: 'review',
		description: 'Opens the page to leave a review (Google, Tripadvisor, …)',
	},
	{
		name: 'Social Profile',
		value: 'social',
		description: 'Opens a social media profile, or a page listing up to 12 (dynamic)',
	},
	{
		name: 'App Store Links',
		value: 'appStore',
		description: 'Sends Android to Google Play, iOS to the App Store, others to a fallback (dynamic only)',
	},
	{
		name: 'File (PDF or Image)',
		value: 'file',
		description: 'A hosted PDF, JPEG, PNG or WebP from a binary property (dynamic only)',
	},
];

export class Posty5QrCode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Posty5 QR Code',
		name: 'posty5QrCode',
		icon: 'file:posty5.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["qrType"]}}',
		description: 'Create and manage QR codes with Posty5',
		defaults: {
			name: 'Posty5 QR Code',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'posty5Api',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new QR code',
						action: 'Create a QR code',
					},
					{
						name: 'Create Many',
						value: 'createMany',
						description: 'Create one QR code per input item in batched API calls',
						action: 'Create many QR codes',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a QR code',
						action: 'Delete a QR code',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a QR code by ID',
						action: 'Get a QR code',
					},
					{
						name: 'Get Analytics',
						value: 'getAnalytics',
						description: 'Get scans, unique visitors, a series and breakdowns of a QR code',
						action: 'Get analytics for a QR code',
					},
					{
						name: 'Get Statistics',
						value: 'getStatistics',
						description: 'Get counts over all your QR codes: totals, visits per day and the top 10 by visits',
						action: 'Get statistics for QR codes',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List all QR codes',
						action: 'List QR codes',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a QR code',
						action: 'Update a QR code',
					},
				],
				default: 'create',
			},

			// QR Type selection for Create/Update (Create Many: no file, the bulk route refuses it)
			{
				displayName: 'QR Type',
				name: 'qrType',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				options: QR_TYPE_OPTIONS,
				default: 'url',
			},
			{
				displayName: 'QR Type',
				name: 'qrType',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['createMany'],
					},
				},
				options: QR_TYPE_OPTIONS.filter(
					(option) => !(QR_CONTENT_CONFIG.bulkExcludedTypes as readonly unknown[]).includes(option.value),
				),
				default: 'url',
			},

			// Common fields
			{
				displayName: 'Template Name or ID',
				name: 'templateId',
				type: 'options',
				required: true,
				typeOptions: {
					loadOptionsMethod: 'getQrTemplates',
				},
				displayOptions: {
					show: {
						operation: ['create'],
					},
				},
				default: '',
				description:
					'The design of the QR code. Required by the Posty5 API for API-key calls. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Template Name or ID',
				name: 'templateId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getQrTemplates',
				},
				displayOptions: {
					show: {
						operation: ['update'],
					},
				},
				default: '',
				description:
					'The design of the QR code. Leave empty to keep the current one. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['create', 'createMany', 'update'],
					},
				},
				default: '',
				description: 'A friendly name for the QR code. On Update, leave it empty to keep the current name.',
			},

			// Mode (static / dynamic). Hidden for Wi-Fi: a phone joins the network from
			// the image itself, so there is no link to redirect (the API answers 400).
			{
				displayName: 'Mode',
				name: 'mode',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['create', 'createMany'],
					},
					hide: {
						qrType: ['wifi', 'appStore', 'file'],
					},
				},
				options: [
					{
						name: 'Static',
						value: 'static',
						description: 'The image encodes the content itself',
					},
					{
						name: 'Dynamic',
						value: 'dynamic',
						description: 'The image encodes a Posty5 link that redirects to the content',
					},
				],
				default: 'static',
				description:
					'Dynamic: the image points to a Posty5 link, so you can change where it goes later without reprinting. Social Profile with 2 or more profiles is always dynamic.',
			},
			{
				displayName: 'Mode',
				name: 'mode',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['update'],
					},
					hide: {
						qrType: ['wifi', 'appStore', 'file'],
					},
				},
				options: [
					{
						name: 'Keep Current',
						value: '',
						description: 'Do not change the mode',
					},
					{
						name: 'Static',
						value: 'static',
						description: 'The image encodes the content itself',
					},
					{
						name: 'Dynamic',
						value: 'dynamic',
						description: 'The image encodes a Posty5 link that redirects to the content',
					},
				],
				default: '',
				description:
					'Dynamic: the image points to a Posty5 link, so you can change where it goes later without reprinting. Social Profile with 2 or more profiles is always dynamic.',
			},

			// URL Type fields
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['create', 'createMany', 'update'],
						qrType: ['url'],
					},
				},
				default: '',
				description: 'The URL to encode in the QR code',
			},

			// Free Text fields
			{
				displayName: 'Text',
				name: 'text',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['create', 'createMany', 'update'],
						qrType: ['freeText'],
					},
				},
				default: '',
				description: 'The text to encode in the QR code',
			},

			// Email fields
			{
				displayName: 'Email Address',
				name: 'email',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['create', 'createMany', 'update'],
						qrType: ['email'],
					},
				},
				default: '',
				description: 'The email address',
			},
			{
				displayName: 'Subject',
				name: 'emailSubject',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['create', 'createMany', 'update'],
						qrType: ['email'],
					},
				},
				default: '',
				description: 'Email subject line',
			},
			{
				displayName: 'Body',
				name: 'emailBody',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['create', 'createMany', 'update'],
						qrType: ['email'],
					},
				},
				default: '',
				description: 'Email body text',
			},

			// WiFi fields
			{
				displayName: 'Network Name (SSID)',
				name: 'wifiName',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['create', 'createMany', 'update'],
						qrType: ['wifi'],
					},
				},
				default: '',
				description: 'WiFi network name',
			},
			{
				displayName: 'Authentication Type',
				name: 'wifiAuthType',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['create', 'createMany', 'update'],
						qrType: ['wifi'],
					},
				},
				options: [
					{ name: 'WPA/WPA2', value: 'WPA' },
					{ name: 'WEP', value: 'WEP' },
					{ name: 'No Password', value: 'nopass' },
				],
				default: 'WPA',
				description: 'WiFi security type',
			},
			{
				displayName: 'Password',
				name: 'wifiPassword',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['create', 'createMany', 'update'],
						qrType: ['wifi'],
						wifiAuthType: ['WPA', 'WEP'],
					},
				},
				default: '',
				description: 'WiFi password',
			},

			// Phone Call fields
			{
				displayName: 'Phone Number',
				name: 'phoneNumber',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['create', 'createMany', 'update'],
						qrType: ['call'],
					},
				},
				default: '',
				description: 'Phone number to call',
			},

			// SMS fields
			{
				displayName: 'Phone Number',
				name: 'smsPhoneNumber',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['create', 'createMany', 'update'],
						qrType: ['sms'],
					},
				},
				default: '',
				description: 'Phone number for SMS',
			},
			{
				displayName: 'Message',
				name: 'smsMessage',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['create', 'createMany', 'update'],
						qrType: ['sms'],
					},
				},
				default: '',
				description: 'Pre-filled SMS message',
			},

			// Geolocation fields
			{
				displayName: 'Latitude',
				name: 'latitude',
				type: 'number',
				required: true,
				displayOptions: {
					show: {
						operation: ['create', 'createMany', 'update'],
						qrType: ['geolocation'],
					},
				},
				default: 0,
				description: 'Latitude coordinate',
			},
			{
				displayName: 'Longitude',
				name: 'longitude',
				type: 'number',
				required: true,
				displayOptions: {
					show: {
						operation: ['create', 'createMany', 'update'],
						qrType: ['geolocation'],
					},
				},
				default: 0,
				description: 'Longitude coordinate',
			},

			// vCard fields (first name or organization is required by the API)
			{
				displayName: 'First Name',
				name: 'vcardFirstName',
				type: 'string',
				displayOptions: { show: { operation: ['create', 'createMany', 'update'], qrType: ['vcard'] } },
				default: '',
				description: 'First name. First Name or Organization is required.',
			},
			{
				displayName: 'Last Name',
				name: 'vcardLastName',
				type: 'string',
				displayOptions: { show: { operation: ['create', 'createMany', 'update'], qrType: ['vcard'] } },
				default: '',
			},
			{
				displayName: 'Organization',
				name: 'vcardOrganization',
				type: 'string',
				displayOptions: { show: { operation: ['create', 'createMany', 'update'], qrType: ['vcard'] } },
				default: '',
				description: 'Company or organization. First Name or Organization is required.',
			},
			{
				displayName: 'Job Title',
				name: 'vcardJobTitle',
				type: 'string',
				displayOptions: { show: { operation: ['create', 'createMany', 'update'], qrType: ['vcard'] } },
				default: '',
			},
			{
				displayName: 'Phones',
				name: 'vcardPhones',
				type: 'fixedCollection',
				placeholder: 'Add Phone',
				typeOptions: { multipleValues: true, maxAllowedFields: QR_CONTENT_CONFIG.vcard.phonesMax },
				displayOptions: { show: { operation: ['create', 'createMany', 'update'], qrType: ['vcard'] } },
				default: {},
				description: `Up to ${QR_CONTENT_CONFIG.vcard.phonesMax} phone numbers`,
				options: [
					{
						displayName: 'Phone',
						name: 'phone',
						values: [
							{
								displayName: 'Kind',
								name: 'kind',
								type: 'options',
								options: toNodeOptions(QR_CONTENT_CONFIG.vcard.phoneKinds),
								default: 'mobile',
								description: 'Kind of phone number',
							},
							{
								displayName: 'Number',
								name: 'number',
								type: 'string',
								default: '',
								description: 'Phone number, international format recommended',
							},
						],
					},
				],
			},
			{
				displayName: 'Emails',
				name: 'vcardEmails',
				type: 'string',
				displayOptions: { show: { operation: ['create', 'createMany', 'update'], qrType: ['vcard'] } },
				default: '',
				placeholder: 'name@example.com, other@example.com',
				description: `Comma-separated email addresses, at most ${QR_CONTENT_CONFIG.vcard.emailsMax}`,
			},
			{
				displayName: 'Website',
				name: 'vcardWebsite',
				type: 'string',
				displayOptions: { show: { operation: ['create', 'createMany', 'update'], qrType: ['vcard'] } },
				default: '',
				description: 'Website (http or https URL)',
			},
			{
				displayName: 'Address',
				name: 'vcardAddress',
				type: 'collection',
				placeholder: 'Add Address Field',
				displayOptions: { show: { operation: ['create', 'createMany', 'update'], qrType: ['vcard'] } },
				default: {},
				description: 'Work address',
				options: [
					{ displayName: 'City', name: 'city', type: 'string', default: '' },
					{ displayName: 'Country', name: 'country', type: 'string', default: '' },
					{ displayName: 'Postal Code', name: 'postalCode', type: 'string', default: '' },
					{ displayName: 'Region', name: 'region', type: 'string', default: '', description: 'State or region' },
					{ displayName: 'Street', name: 'street', type: 'string', default: '' },
				],
			},
			{
				displayName: 'Note',
				name: 'vcardNote',
				type: 'string',
				typeOptions: { rows: 2 },
				displayOptions: { show: { operation: ['create', 'createMany', 'update'], qrType: ['vcard'] } },
				default: '',
				description: 'Free note on the contact card',
			},

			// Calendar event fields
			{
				displayName: 'Event Title',
				name: 'eventTitle',
				type: 'string',
				required: true,
				displayOptions: { show: { operation: ['create', 'createMany', 'update'], qrType: ['event'] } },
				default: '',
				description: 'Title of the event',
			},
			{
				displayName: 'Starts At',
				name: 'eventStartsAt',
				type: 'dateTime',
				required: true,
				displayOptions: { show: { operation: ['create', 'createMany', 'update'], qrType: ['event'] } },
				default: '',
				description: 'Start of the event. A value without an offset is read in the event timezone.',
			},
			{
				displayName: 'Ends At',
				name: 'eventEndsAt',
				type: 'dateTime',
				displayOptions: { show: { operation: ['create', 'createMany', 'update'], qrType: ['event'] } },
				default: '',
				description: 'End of the event; must be after the start',
			},
			{
				displayName: 'All Day',
				name: 'eventAllDay',
				type: 'boolean',
				displayOptions: { show: { operation: ['create', 'createMany', 'update'], qrType: ['event'] } },
				default: false,
				description: 'Whether the event lasts the whole day (times are ignored)',
			},
			{
				displayName: 'Timezone',
				name: 'eventTimezone',
				type: 'options',
				options: QR_EVENT_TIMEZONES.map((zone) => ({ name: zone, value: zone })),
				displayOptions: { show: { operation: ['create', 'createMany', 'update'], qrType: ['event'] } },
				default: 'UTC',
				description: 'IANA time zone the start and end are read in. Use an expression for a zone not listed.',
			},
			{
				displayName: 'Location',
				name: 'eventLocation',
				type: 'string',
				displayOptions: { show: { operation: ['create', 'createMany', 'update'], qrType: ['event'] } },
				default: '',
				description: 'Where the event takes place',
			},
			{
				displayName: 'Description',
				name: 'eventDescription',
				type: 'string',
				typeOptions: { rows: 2 },
				displayOptions: { show: { operation: ['create', 'createMany', 'update'], qrType: ['event'] } },
				default: '',
				description: 'Event description',
			},
			{
				displayName: 'Event URL',
				name: 'eventUrl',
				type: 'string',
				displayOptions: { show: { operation: ['create', 'createMany', 'update'], qrType: ['event'] } },
				default: '',
				description: 'Link for the event (http or https URL)',
			},

			// WhatsApp fields
			{
				displayName: 'Phone Number',
				name: 'whatsappPhoneNumber',
				type: 'string',
				required: true,
				displayOptions: { show: { operation: ['create', 'createMany', 'update'], qrType: ['whatsapp'] } },
				default: '',
				placeholder: '+201001234567',
				description: 'WhatsApp number in international format',
			},
			{
				displayName: 'Message',
				name: 'whatsappMessage',
				type: 'string',
				displayOptions: { show: { operation: ['create', 'createMany', 'update'], qrType: ['whatsapp'] } },
				default: '',
				description: 'Pre-filled chat message',
			},

			// Review fields
			{
				displayName: 'Platform',
				name: 'reviewPlatform',
				type: 'options',
				options: toNodeOptions(QR_CONTENT_CONFIG.review.platforms),
				displayOptions: { show: { operation: ['create', 'createMany', 'update'], qrType: ['review'] } },
				default: 'google',
				description: 'Where the review is left',
			},
			{
				displayName: 'Place ID',
				name: 'reviewPlaceId',
				type: 'string',
				displayOptions: {
					show: { operation: ['create', 'createMany', 'update'], qrType: ['review'], reviewPlatform: ['google'] },
				},
				default: '',
				description: 'Google place ID. Google takes a Place ID or a Review URL.',
			},
			{
				displayName: 'Review URL',
				name: 'reviewUrl',
				type: 'string',
				displayOptions: { show: { operation: ['create', 'createMany', 'update'], qrType: ['review'] } },
				default: '',
				description: "Review page URL on the platform's own site",
			},

			// Social profile fields: 1 profile (static or dynamic) or 2-12 (dynamic only)
			{
				displayName: 'Profiles',
				name: 'socialProfiles',
				type: 'fixedCollection',
				placeholder: 'Add Profile',
				required: true,
				typeOptions: { multipleValues: true, maxAllowedFields: QR_CONTENT_CONFIG.social.maxProfilesDynamic },
				displayOptions: { show: { operation: ['create', 'createMany', 'update'], qrType: ['social'] } },
				default: {},
				description: `Up to ${QR_CONTENT_CONFIG.social.maxProfilesDynamic} profiles. With 2 or more the code is always dynamic (its scan page lists them).`,
				options: [
					{
						displayName: 'Profile',
						name: 'profile',
						values: [
							{
								displayName: 'Platform',
								name: 'platform',
								type: 'options',
								options: toNodeOptions(QR_CONTENT_CONFIG.social.platforms),
								default: 'instagram',
								description: 'Social network of the profile',
							},
							{
								displayName: 'Handle',
								name: 'handle',
								type: 'string',
								default: '',
								placeholder: 'posty5',
								description: 'Profile handle. Set a Handle or a Profile URL (Other needs a URL).',
							},
							{
								displayName: 'Profile URL',
								name: 'url',
								type: 'string',
								default: '',
								description: 'Profile URL. Set a Handle or a Profile URL.',
							},
						],
					},
				],
			},
			{
				displayName: 'Page Title',
				name: 'socialTitle',
				type: 'string',
				displayOptions: { show: { operation: ['create', 'createMany', 'update'], qrType: ['social'] } },
				default: '',
				description: 'Title of the profile list page (2 or more profiles)',
			},

			// App store fields (dynamic only)
			{
				displayName: 'Android URL',
				name: 'appStoreAndroidUrl',
				type: 'string',
				displayOptions: { show: { operation: ['create', 'createMany', 'update'], qrType: ['appStore'] } },
				default: '',
				placeholder: 'https://play.google.com/store/apps/…',
				description: 'Google Play link. Set an Android URL, an iOS URL, or both.',
			},
			{
				displayName: 'iOS URL',
				name: 'appStoreIosUrl',
				type: 'string',
				displayOptions: { show: { operation: ['create', 'createMany', 'update'], qrType: ['appStore'] } },
				default: '',
				placeholder: 'https://apps.apple.com/app/id123456789',
				description: 'App Store link. Set an Android URL, an iOS URL, or both.',
			},
			{
				displayName: 'Fallback URL',
				name: 'appStoreFallbackUrl',
				type: 'string',
				required: true,
				displayOptions: { show: { operation: ['create', 'createMany', 'update'], qrType: ['appStore'] } },
				default: '',
				placeholder: 'https://example.com/app',
				description: 'Where desktops and other devices (or a missing store link) go',
			},

			// File fields (dynamic only; not offered on Create Many)
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				required: true,
				displayOptions: { show: { operation: ['create'], qrType: ['file'] } },
				default: 'data',
				description: `Input binary property holding the file: a PDF, JPEG, PNG or WebP of up to ${QR_CONTENT_CONFIG.file.maxUploadBytes / (1024 * 1024)} MB`,
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				displayOptions: { show: { operation: ['update'], qrType: ['file'] } },
				default: '',
				placeholder: QR_CONTENT_CONFIG.file.defaultBinaryProperty,
				description: 'Input binary property holding a new file. Leave empty to keep the stored file.',
			},
			{
				displayName: 'File Name',
				name: 'fileName',
				type: 'string',
				displayOptions: { show: { operation: ['create', 'update'], qrType: ['file'] } },
				default: '',
				description:
					"Name shown for the file. Empty: the binary's own file name (on Update without a new file, the stored name is kept).",
			},

			// Scan rules (dynamic codes only, Starter plan and above). Create: shown
			// only for Dynamic. Update: always (the API answers 400 on a static code).
			{
				displayName: 'Scan Rules',
				name: 'scanRules',
				type: 'collection',
				placeholder: 'Add Rule',
				default: {},
				displayOptions: {
					show: {
						operation: ['create'],
						mode: ['dynamic'],
					},
					hide: {
						qrType: ['wifi', 'appStore', 'file'],
					},
				},
				description: 'Limit when and how often a dynamic QR code works. Leave empty for no rules.',
				options: [
					{
						displayName: 'Active From',
						name: 'activeFrom',
						type: 'dateTime',
						default: '',
						description: 'Scans before this moment go to the Fallback URL',
					},
					{
						displayName: 'Expires At',
						name: 'expiresAt',
						type: 'dateTime',
						default: '',
						description: 'Scans from this moment go to the Fallback URL. Must be after Active From.',
					},
					{
						displayName: 'Max Scans',
						name: 'maxVisits',
						type: 'number',
						typeOptions: { minValue: 1, numberPrecision: 0 },
						default: 1,
						description: 'Scans allowed; later scans go to the Fallback URL',
					},
					{
						displayName: 'Fallback URL',
						name: 'fallbackUrl',
						type: 'string',
						default: '',
						placeholder: 'https://example.com/offer-ended',
						description: 'Where gated scans go (http or https)',
					},
					{
						displayName: 'Clear Scan Rules',
						name: 'clearScanRules',
						type: 'boolean',
						default: false,
						description: 'Whether to remove every scan rule from the code (overrides the other fields)',
					},
				],
			},
			{
				displayName: 'Scan Rules',
				name: 'scanRules',
				type: 'collection',
				placeholder: 'Add Rule',
				default: {},
				displayOptions: {
					show: {
						operation: ['create'],
						qrType: ['appStore', 'file'],
					},
				},
				description: 'Limit when and how often a dynamic QR code works. Leave empty for no rules.',
				options: [
					{
						displayName: 'Active From',
						name: 'activeFrom',
						type: 'dateTime',
						default: '',
						description: 'Scans before this moment go to the Fallback URL',
					},
					{
						displayName: 'Expires At',
						name: 'expiresAt',
						type: 'dateTime',
						default: '',
						description: 'Scans from this moment go to the Fallback URL. Must be after Active From.',
					},
					{
						displayName: 'Max Scans',
						name: 'maxVisits',
						type: 'number',
						typeOptions: { minValue: 1, numberPrecision: 0 },
						default: 1,
						description: 'Scans allowed; later scans go to the Fallback URL',
					},
					{
						displayName: 'Fallback URL',
						name: 'fallbackUrl',
						type: 'string',
						default: '',
						placeholder: 'https://example.com/offer-ended',
						description: 'Where gated scans go (http or https)',
					},
					{
						displayName: 'Clear Scan Rules',
						name: 'clearScanRules',
						type: 'boolean',
						default: false,
						description: 'Whether to remove every scan rule from the code (overrides the other fields)',
					},
				],
			},
			{
				displayName: 'Scan Rules',
				name: 'scanRules',
				type: 'collection',
				placeholder: 'Add Rule',
				default: {},
				displayOptions: {
					show: {
						operation: ['update'],
					},
					hide: {
						qrType: ['wifi'],
					},
				},
				description:
					'Dynamic codes only. Leave empty to keep the current rules; any rule set here replaces all of them.',
				options: [
					{
						displayName: 'Active From',
						name: 'activeFrom',
						type: 'dateTime',
						default: '',
						description: 'Scans before this moment go to the Fallback URL',
					},
					{
						displayName: 'Expires At',
						name: 'expiresAt',
						type: 'dateTime',
						default: '',
						description: 'Scans from this moment go to the Fallback URL. Must be after Active From.',
					},
					{
						displayName: 'Max Scans',
						name: 'maxVisits',
						type: 'number',
						typeOptions: { minValue: 1, numberPrecision: 0 },
						default: 1,
						description: 'Scans allowed; later scans go to the Fallback URL',
					},
					{
						displayName: 'Fallback URL',
						name: 'fallbackUrl',
						type: 'string',
						default: '',
						placeholder: 'https://example.com/offer-ended',
						description: 'Where gated scans go (http or https)',
					},
					{
						displayName: 'Clear Scan Rules',
						name: 'clearScanRules',
						type: 'boolean',
						default: false,
						description: 'Whether to remove every scan rule from the code (overrides the other fields)',
					},
				],
			},

			// Additional fields for Create/Update
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				options: [
					{
						displayName: 'Landing Page',
						name: 'isEnableLandingPage',
						type: 'boolean',
						default: false,
						description:
							'Whether the QR code\'s Posty5 page shows the title and description below',
					},
					{
						displayName: 'Page Description',
						name: 'pageDescription',
						type: 'string',
						displayOptions: {
							show: {
								isEnableLandingPage: [true],
							},
						},
						default: '',
						description: 'Landing page description',
					},
					{
						displayName: 'Page Title',
						name: 'pageTitle',
						type: 'string',
						displayOptions: {
							show: {
								isEnableLandingPage: [true],
							},
						},
						default: '',
						description: 'Landing page title. Required when Landing Page is on.',
					},
					{
						displayName: 'Reference ID',
						name: 'refId',
						type: 'string',
						default: '',
						description: 'External reference ID. On Update, an empty value clears it.',
					},
					{
						displayName: 'Tag',
						name: 'tag',
						type: 'string',
						default: '',
						description: 'Organization tag for filtering. On Update, an empty value clears it.',
					},
					{
						displayName: 'Template ID (Deprecated)',
						name: 'templateId',
						type: 'string',
						default: '',
						description:
							'Use the Template field instead. Read only when Template is empty, so workflows saved before version 4.6.0 keep their template.',
					},
				],
			},

			// Get, Update, Delete operation fields
			{
				displayName: 'QR Code ID',
				name: 'qrCodeId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['get', 'getAnalytics', 'update', 'delete'],
					},
				},
				default: '',
				description: 'The ID of the QR code',
			},

			// List operation fields
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['list'],
					},
				},
				default: false,
				description: 'Whether to return all results or only up to a given limit',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['list'],
						returnAll: [false],
					},
				},
				typeOptions: {
					minValue: 1,
					maxValue: 100,
				},
				default: 50,
				description: 'Max number of results to return',
			},
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: {
					show: {
						operation: ['list'],
					},
				},
				options: [
					{
						displayName: 'Tag',
						name: 'tag',
						type: 'string',
						default: '',
						description: 'Filter by tag',
					},
					{
						displayName: 'Reference ID',
						name: 'refId',
						type: 'string',
						default: '',
						description: 'Filter by reference ID',
					},
					{
						displayName: 'Mode',
						name: 'mode',
						type: 'options',
						options: [
							{ name: 'Static', value: 'static' },
							{ name: 'Dynamic', value: 'dynamic' },
						],
						default: 'static',
						description: 'Only QR codes of this mode',
					},
					{
						displayName: 'Search',
						name: 'search',
						type: 'string',
						default: '',
						description: 'Search term',
					},
				],
			},

			// Get Analytics operation fields (shared with the other link-tool node)
			...LINK_ANALYTICS_PROPERTIES,

			// Get Statistics operation fields (shared with the other link-tool node)
			...LINK_STATISTICS_PROPERTIES,

			// Create Many operation fields (shared with the other link-tool node)
			...buildLinkBulkProperties(false),
		],
	};

	methods = {
		loadOptions: {
			getQrTemplates,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		const credentials = await this.getCredentials('posty5Api');
		const apiKey = credentials.apiKey as string;

		// Create Many reads every item once and answers one item per input item.
		if (operation === 'createMany') {
			if (!items.length) return [[]];
			const defaults = readBulkDefaults(this.getNodeParameter('bulkDefaults', 0, {}) as Record<string, unknown>);
			const options = this.getNodeParameter('bulkOptions', 0, {}) as IBulkNodeOptions;
			const prepared = prepareBulkRows(items.length, (i) => buildQrCodeBulkRow(this, i, defaults));
			return [await executeBulkCreate(this, apiKey, QR_CODE_BULK_ROUTE, prepared, defaults, options)];
		}

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: any = {};

				if (operation === 'create') {
					const qrType = this.getNodeParameter('qrType', i) as string;
					const additionalFields = this.getNodeParameter('additionalFields', i, {}) as ILinkToolAdditionalFields;
					const name = firstText(this.getNodeParameter('name', i, ''));

					const body: IQRCodeWriteRequest = {
						...buildCommonCreateFields(additionalFields),
						templateId: requireTemplateId(this.getNodeParameter('templateId', i, ''), additionalFields),
						qrCodeTarget: buildQrCodeTarget(qrType, (parameter, fallback) =>
							this.getNodeParameter(parameter, i, fallback),
						),
						// Required by the API; the template supplies the design and the
						// server builds `options.text` from `qrCodeTarget`.
						options: {},
					};
					if (name) body.name = name;
					// Static is the API default: send `mode` only for dynamic, so saved
					// workflows (no value) keep sending the same body. A target with no
					// static form (app store, file, 2+ social profiles) is always dynamic.
					const mode =
						requiredQrMode(body.qrCodeTarget) ?? readQrMode(this.getNodeParameter('mode', i, 'static'));
					if (mode === 'dynamic') body.mode = mode;
					if (qrType === 'file') {
						// Upload last, after every local check: the signed URL is short-lived.
						const upload = await uploadQrFile(
							this,
							apiKey,
							i,
							toText(this.getNodeParameter('binaryPropertyName', i, QR_CONTENT_CONFIG.file.defaultBinaryProperty)).trim() ||
								QR_CONTENT_CONFIG.file.defaultBinaryProperty,
							body.qrCodeTarget.file?.fileName,
						);
						body.qrCodeTarget.file = { ...body.qrCodeTarget.file, ...upload };
					}
					if (mode === 'dynamic') {
						const access = buildQrAccess(this.getNodeParameter('scanRules', i, {}) as IQRCodeScanRulesParameter);
						if (access !== undefined) body.access = access;
					}

					responseData = await makeApiRequest.call(this, apiKey, {
						method: 'POST',
						endpoint: `${API_ENDPOINTS.QR_CODE}/${qrType}`,
						body,
					});
				} else if (operation === 'get') {
					const qrCodeId = this.getNodeParameter('qrCodeId', i) as string;
					responseData = await makeApiRequest.call(this, apiKey, {
						method: 'GET',
						endpoint: `${API_ENDPOINTS.QR_CODE}/${qrCodeId}`,
					});
				} else if (operation === 'getAnalytics') {
					responseData = await executeGetAnalytics(
						this,
						apiKey,
						API_ENDPOINTS.QR_CODE,
						this.getNodeParameter('qrCodeId', i),
						i,
					);
				} else if (operation === 'getStatistics') {
					responseData = await executeGetStatistics(this, apiKey, API_ENDPOINTS.QR_CODE, i);
				} else if (operation === 'update') {
					const qrCodeId = this.getNodeParameter('qrCodeId', i) as string;
					const qrType = this.getNodeParameter('qrType', i) as string;
					const additionalFields = this.getNodeParameter('additionalFields', i, {}) as ILinkToolAdditionalFields;
					// Built first, so an unknown type fails before any request.
					const qrCodeTarget = buildQrCodeTarget(qrType, (parameter, fallback) =>
						this.getNodeParameter(parameter, i, fallback),
					);

					// Fetch-then-put: the API names an untitled update after its text and
					// drops an omitted template type, so the stored record is the base.
					const stored = (await makeApiRequest.call(this, apiKey, {
						method: 'GET',
						endpoint: `${API_ENDPOINTS.QR_CODE}/${qrCodeId}`,
					})) as IQRCodeFullDetailsResponse;

					const body: IQRCodeWriteRequest = {
						...buildCommonUpdateFields(additionalFields, stored),
						templateId: requireTemplateId(
							this.getNodeParameter('templateId', i, ''),
							additionalFields,
							stored,
						),
						qrCodeTarget,
						options: {},
					};
					const name = firstText(this.getNodeParameter('name', i, ''), stored.name);
					if (name) body.name = name;
					// Empty ("Keep Current") sends nothing; the API keeps the stored mode.
					// A target with no static form always sends dynamic.
					const mode = requiredQrMode(qrCodeTarget) ?? readQrMode(this.getNodeParameter('mode', i, ''));
					if (mode) body.mode = mode;
					if (qrType === 'file') {
						// No binary property: no upload, no bucketFilePath, the stored file stays.
						const binaryProperty = toText(this.getNodeParameter('binaryPropertyName', i, '')).trim();
						const storedFileName = stored.qrCodeTarget?.file?.fileName;
						if (binaryProperty) {
							const upload = await uploadQrFile(this, apiKey, i, binaryProperty, qrCodeTarget.file?.fileName);
							qrCodeTarget.file = { ...qrCodeTarget.file, ...upload };
						} else if (!qrCodeTarget.file?.fileName && storedFileName) {
							qrCodeTarget.file = { ...qrCodeTarget.file, fileName: storedFileName };
						}
					}
					// Empty Scan Rules keeps the stored rules; Clear sends access: null.
					const access = buildQrAccess(this.getNodeParameter('scanRules', i, {}) as IQRCodeScanRulesParameter);
					if (access !== undefined) body.access = access;

					responseData = await makeApiRequest.call(this, apiKey, {
						method: 'PUT',
						endpoint: `${API_ENDPOINTS.QR_CODE}/${qrType}/${qrCodeId}`,
						body,
					});
				} else if (operation === 'delete') {
					const qrCodeId = this.getNodeParameter('qrCodeId', i) as string;
					responseData = await makeApiRequest.call(this, apiKey, {
						method: 'DELETE',
						endpoint: `${API_ENDPOINTS.QR_CODE}/${qrCodeId}`,
					});
				} else if (operation === 'list') {
					const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
					const filters = this.getNodeParameter('filters', i, {}) as any;

					const qs: IListParams = {};
					if (filters.tag) qs.tag = filters.tag;
					if (filters.refId) qs.refId = filters.refId;
					const modeFilter = readQrMode(filters.mode);
					if (modeFilter) qs.mode = modeFilter;
					if (filters.search) {
						qs.name = filters.search;
					}

					if (returnAll) {
						responseData = await makePaginatedRequest.call(this, apiKey, API_ENDPOINTS.QR_CODE, qs);
					} else {
						const limit = this.getNodeParameter('limit', i, 50) as number;
						const result = await makeApiRequest.call(this, apiKey, {
							method: 'GET',
							endpoint: API_ENDPOINTS.QR_CODE,
							qs: {
								...qs,
								page: 1,
								pageSize: limit,
							},
						});
						responseData = result.items || [];
					}
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
