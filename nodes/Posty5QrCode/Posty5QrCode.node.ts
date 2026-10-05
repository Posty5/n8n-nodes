import {
	IExecuteFunctions,
	INodeExecutionData,
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
import { buildCommonCreateFields, buildCommonUpdateFields, firstText } from '../../utils/link-tool.helpers';
import { buildQrAccess, buildQrCodeTarget, readQrMode } from '../../utils/qr-target.helpers';
import { getQrTemplates, requireTemplateId } from '../../utils/qr-templates.helpers';
import type { ILinkToolAdditionalFields } from '../../types/common';
import type {
	IListParams,
	IQRCodeFullDetailsResponse,
	IQRCodeScanRulesParameter,
	IQRCodeWriteRequest,
} from '../../types/qr-code.types';

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

			// QR Type selection for Create/Update
			{
				displayName: 'QR Type',
				name: 'qrType',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['create', 'createMany', 'update'],
					},
				},
				options: [
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
				],
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
						qrType: ['wifi'],
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
					'Dynamic: the image points to a Posty5 link, so you can change where it goes later without reprinting',
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
						qrType: ['wifi'],
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
					'Dynamic: the image points to a Posty5 link, so you can change where it goes later without reprinting',
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
						qrType: ['wifi'],
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
					// workflows (no value) keep sending the same body.
					const mode = readQrMode(this.getNodeParameter('mode', i, 'static'));
					if (mode === 'dynamic') body.mode = mode;
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
					const mode = readQrMode(this.getNodeParameter('mode', i, ''));
					if (mode) body.mode = mode;
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
