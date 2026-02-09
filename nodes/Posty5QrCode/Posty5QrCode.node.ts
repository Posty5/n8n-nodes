import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { makeApiRequest, makePaginatedRequest } from '../../utils/api.helpers';
import { API_ENDPOINTS } from '../../utils/constants';
import type { IListParams } from '../../types/qr-code.types';

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
						operation: ['create', 'update'],
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
				displayName: 'Name',
				name: 'name',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				default: '',
				description: 'A friendly name for the QR code',
			},

			// URL Type fields
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['create', 'update'],
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
						operation: ['create', 'update'],
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
						operation: ['create', 'update'],
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
						operation: ['create', 'update'],
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
						operation: ['create', 'update'],
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
						operation: ['create', 'update'],
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
						operation: ['create', 'update'],
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
						operation: ['create', 'update'],
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
						operation: ['create', 'update'],
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
						operation: ['create', 'update'],
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
						operation: ['create', 'update'],
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
						operation: ['create', 'update'],
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
						operation: ['create', 'update'],
						qrType: ['geolocation'],
					},
				},
				default: 0,
				description: 'Longitude coordinate',
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
						displayName: 'Tag',
						name: 'tag',
						type: 'string',
						default: '',
						description: 'Organization tag for filtering',
					},
					{
						displayName: 'Reference ID',
						name: 'refId',
						type: 'string',
						default: '',
						description: 'External reference ID',
					},
					{
						displayName: 'Template ID',
						name: 'templateId',
						type: 'string',
						default: '',
						description: 'QR code template/style ID',
					},
					{
						displayName: 'Enable Monetization',
						name: 'isEnableMonetization',
						type: 'boolean',
						default: false,
						description: 'Whether to enable monetization for this QR code',
					},
					{
						displayName: 'Page Title',
						name: 'pageTitle',
						type: 'string',
						default: '',
						description: 'Landing page title',
					},
					{
						displayName: 'Page Description',
						name: 'pageDescription',
						type: 'string',
						default: '',
						description: 'Landing page description',
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
						operation: ['get', 'update', 'delete'],
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
						displayName: 'Search',
						name: 'search',
						type: 'string',
						default: '',
						description: 'Search term',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		const credentials = await this.getCredentials('posty5Api');
		const apiKey = credentials.apiKey as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: any = {};

				if (operation === 'create') {
					const qrType = this.getNodeParameter('qrType', i) as string;
					const name = this.getNodeParameter('name', i, '') as string;
					const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;

					const body: any = {};
					if (name) body.name = name;
					if (additionalFields.tag) body.tag = additionalFields.tag;
					if (additionalFields.refId) body.refId = additionalFields.refId;
					if (additionalFields.templateId) body.templateId = additionalFields.templateId;
					if (additionalFields.isEnableMonetization !== undefined) {
						body.isEnableMonetization = additionalFields.isEnableMonetization;
					}
					if (additionalFields.pageTitle || additionalFields.pageDescription) {
						body.pageInfo = {
							title: additionalFields.pageTitle || '',
							description: additionalFields.pageDescription || '',
						};
					}

					// Add type-specific fields
					switch (qrType) {
						case 'url': {
							const url = this.getNodeParameter('url', i) as string;
							body.url = { url };
							break;
						}
						case 'freeText': {
							const text = this.getNodeParameter('text', i) as string;
							body.text = text;
							break;
						}
						case 'email': {
							const email = this.getNodeParameter('email', i) as string;
							const subject = this.getNodeParameter('emailSubject', i, '') as string;
							const emailBody = this.getNodeParameter('emailBody', i, '') as string;
							body.email = { email, subject, body: emailBody };
							break;
						}
						case 'wifi': {
							const wifiName = this.getNodeParameter('wifiName', i) as string;
							const authenticationType = this.getNodeParameter('wifiAuthType', i) as string;
							const password = this.getNodeParameter('wifiPassword', i, '') as string;
							body.wifi = { name: wifiName, authenticationType, password };
							break;
						}
						case 'call': {
							const phoneNumber = this.getNodeParameter('phoneNumber', i) as string;
							body.call = { phoneNumber };
							break;
						}
						case 'sms': {
							const phoneNumber = this.getNodeParameter('smsPhoneNumber', i) as string;
							const message = this.getNodeParameter('smsMessage', i, '') as string;
							body.sms = { phoneNumber, message };
							break;
						}
						case 'geolocation': {
							const latitude = this.getNodeParameter('latitude', i) as number;
							const longitude = this.getNodeParameter('longitude', i) as number;
							body.geolocation = { latitude, longitude };
							break;
						}
					}

					responseData = await makeApiRequest.call(this, apiKey, {
						method: 'POST',
						endpoint: API_ENDPOINTS.QR_CODE,
						body,
					});
				} else if (operation === 'get') {
					const qrCodeId = this.getNodeParameter('qrCodeId', i) as string;
					responseData = await makeApiRequest.call(this, apiKey, {
						method: 'GET',
						endpoint: `${API_ENDPOINTS.QR_CODE}/${qrCodeId}`,
					});
				} else if (operation === 'update') {
					const qrCodeId = this.getNodeParameter('qrCodeId', i) as string;
					const qrType = this.getNodeParameter('qrType', i) as string;
					const name = this.getNodeParameter('name', i, '') as string;
					const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;

					const body: any = {};
					if (name) body.name = name;
					if (additionalFields.tag) body.tag = additionalFields.tag;
					if (additionalFields.refId) body.refId = additionalFields.refId;
					if (additionalFields.templateId) body.templateId = additionalFields.templateId;
					if (additionalFields.isEnableMonetization !== undefined) {
						body.isEnableMonetization = additionalFields.isEnableMonetization;
					}
					if (additionalFields.pageTitle || additionalFields.pageDescription) {
						body.pageInfo = {
							title: additionalFields.pageTitle || '',
							description: additionalFields.pageDescription || '',
						};
					}

					// Add type-specific fields
					switch (qrType) {
						case 'url': {
							const url = this.getNodeParameter('url', i) as string;
							body.url = { url };
							break;
						}
						case 'freeText': {
							const text = this.getNodeParameter('text', i) as string;
							body.qrCodeTarget = { text };
							break;
						}
						case 'email': {
							const email = this.getNodeParameter('email', i) as string;
							const subject = this.getNodeParameter('emailSubject', i, '') as string;
							const emailBody = this.getNodeParameter('emailBody', i, '') as string;
							body.email = { email, subject, body: emailBody };
							break;
						}
						case 'wifi': {
							const wifiName = this.getNodeParameter('wifiName', i) as string;
							const authenticationType = this.getNodeParameter('wifiAuthType', i) as string;
							const password = this.getNodeParameter('wifiPassword', i, '') as string;
							body.wifi = { name: wifiName, authenticationType, password };
							break;
						}
						case 'call': {
							const phoneNumber = this.getNodeParameter('phoneNumber', i) as string;
							body.call = { phoneNumber };
							break;
						}
						case 'sms': {
							const phoneNumber = this.getNodeParameter('smsPhoneNumber', i) as string;
							const message = this.getNodeParameter('smsMessage', i, '') as string;
							body.sms = { phoneNumber, message };
							break;
						}
						case 'geolocation': {
							const latitude = this.getNodeParameter('latitude', i) as number;
							const longitude = this.getNodeParameter('longitude', i) as number;
							body.geolocation = { latitude, longitude };
							break;
						}
					}

					responseData = await makeApiRequest.call(this, apiKey, {
						method: 'PUT',
						endpoint: `${API_ENDPOINTS.QR_CODE}/${qrCodeId}`,
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
					if (filters.search) {
						qs.name = filters.search;
					}

					if (returnAll) {
						responseData = await makePaginatedRequest.call(
							this,
							apiKey,
							API_ENDPOINTS.QR_CODE,
							qs,
						);
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
