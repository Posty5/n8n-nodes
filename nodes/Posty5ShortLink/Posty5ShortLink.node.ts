import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	NodeOperationError,
	INodeTypeDescription,
} from 'n8n-workflow';
import { makeApiRequest, makePaginatedRequest } from '../../utils/api.helpers';
import { buildVersionedWriteProperties, resolveWriteVersion } from '../../utils/versioned-write.helpers';
import { executeGetAnalytics, executeGetStatistics } from '../../utils/analytics.helpers';
import { LINK_ANALYTICS_PROPERTIES, LINK_STATISTICS_PROPERTIES } from '../../utils/analytics.properties';
import { API_ENDPOINTS } from '../../utils/constants';
import { executeBulkCreate, prepareBulkRows, readBulkDefaults } from '../../utils/link-bulk.helpers';
import { buildLinkBulkProperties } from '../../utils/link-bulk.properties';
import { buildShortLinkBulkRow, shortLinkBulkRoute } from './helpers';
import type { IBulkNodeOptions } from '../../types/link-bulk.types';
import {
	buildCommonCreateFields,
	buildCommonUpdateFields,
	buildDeepLinkFields,
	firstText,
	toText,
} from '../../utils/link-tool.helpers';
import { getQrTemplates, requireTemplateId } from '../../utils/qr-templates.helpers';
import { SHORT_LINK_CONTROLS, SHORT_LINK_CONTROLS_MESSAGES } from '../../utils/constants';
import {
	buildCampaignBody,
	buildControlFields,
	getCampaigns,
	splitList,
} from '../../utils/short-link-controls.helpers';
import {
	LINK_CAMPAIGN_PROPERTIES,
	SHORT_LINK_CONTROL_ADDITIONAL_FIELDS,
	SHORT_LINK_CONTROL_LIST_FILTERS,
	SHORT_LINK_LIST_TAGS_PROPERTIES,
	SHORT_LINK_SET_RULES_PROPERTIES,
} from '../../utils/short-link-controls.properties';
import type { ILinkCampaignFields, IShortLinkControlFields } from '../../types/short-link-controls.types';
import type {
	ICreateShortLinkRequest,
	IListParams,
	IShortLinkAdditionalFields,
	IShortLinkFullDetailsResponse,
	IShortLinkListFilters,
	IUpdateShortLinkRequest,
} from '../../types/short-link.types';

export class Posty5ShortLink implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Posty5 Short Link',
		name: 'posty5ShortLink',
		icon: 'file:posty5.svg',
		group: ['transform'],
		version: [1, 2],
		defaultVersion: 2,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Create and manage short links with Posty5. v1 is legacy: update and delete overwrite (last write wins)',
		defaults: {
			name: 'Posty5 Short Link',
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
						name: 'Check Health',
						value: 'checkHealth',
						description: 'Queue one destination health check of a short link (once per 10 minutes)',
						action: 'Check the health of a short link',
					},
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new short link',
						action: 'Create a short link',
					},
					{
						name: 'Create Campaign',
						value: 'createCampaign',
						description: 'Create a link campaign',
						action: 'Create a campaign',
					},
					{
						name: 'Create Many',
						value: 'createMany',
						description: 'Create one short link per input item in batched API calls',
						action: 'Create many short links',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a short link',
						action: 'Delete a short link',
					},
					{
						name: 'Delete Campaign',
						value: 'deleteCampaign',
						description: 'Delete a link campaign',
						action: 'Delete a campaign',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a short link by ID',
						action: 'Get a short link',
					},
					{
						name: 'Get Analytics',
						value: 'getAnalytics',
						description: 'Get visits, unique visitors, a series and breakdowns of a short link',
						action: 'Get analytics for a short link',
					},
					{
						name: 'Get Campaign',
						value: 'getCampaign',
						description: 'Get a link campaign with its link count and total visits',
						action: 'Get a campaign',
					},
					{
						name: 'Get Statistics',
						value: 'getStatistics',
						description: 'Get counts over all your short links: totals, visits per day and the top 10 by visits',
						action: 'Get statistics for short links',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List all short links',
						action: 'List short links',
					},
					{
						name: 'List Campaigns',
						value: 'listCampaigns',
						description: 'List your link campaigns',
						action: 'List campaigns',
					},
					{
						name: 'List Tags',
						value: 'listTags',
						description: 'List the distinct tags of your short links',
						action: 'List tags',
					},
					{
						name: 'Set Rules',
						value: 'setRules',
						description: 'Change the access, routing, variants, UTM or pixels of a short link',
						action: 'Set the rules of a short link',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a short link',
						action: 'Update a short link',
					},
					{
						name: 'Update Campaign',
						value: 'updateCampaign',
						description: 'Update a link campaign',
						action: 'Update a campaign',
					},
				],
				default: 'create',
			},

			// Create operation fields
			{
				displayName: 'Destination URL',
				name: 'url',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['create', 'createMany'],
					},
				},
				default: '',
				placeholder: 'https://example.com',
				description: 'The destination URL to shorten. It must start with http:// or https://.',
			},
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
					'The QR code design of the link. Required by the Posty5 API for API-key calls. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
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
					'The QR code design of the link. Leave empty to keep the current one. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
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
				description: 'A friendly name for the short link. On Update, leave it empty to keep the current name.',
			},
			{
				displayName: 'Custom Slug',
				name: 'customLandingId',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['create', 'createMany'],
					},
				},
				default: '',
				description:
					'Custom slug for branded short links (e.g., "my-link"). Lowercase letters, digits and hyphens. It cannot be changed after the link is created.',
			},
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
						displayName: 'Android URL',
						name: 'androidUrl',
						type: 'string',
						default: '',
						placeholder: 'myapp://item/1',
						description:
							'Where Android visitors go: an https:// link or an app link. Left out, the link uses the deep link the destination page declares. On Update, an empty value clears it.',
					},
					{
						displayName: 'Destination URL',
						name: 'baseUrl',
						type: 'string',
						displayOptions: {
							show: {
								'/operation': ['update'],
							},
						},
						default: '',
						placeholder: 'https://example.com',
						description: 'A new destination URL. Left out, the current one is kept.',
					},
					{
						displayName: 'iOS URL',
						name: 'iosUrl',
						type: 'string',
						default: '',
						placeholder: 'myapp://item/1',
						description:
							'Where iPhone and iPad visitors go: an https:// link or an app link. Left out, the link uses the deep link the destination page declares. On Update, an empty value clears it.',
					},
					{
						displayName: 'Landing Page',
						name: 'isEnableLandingPage',
						type: 'boolean',
						default: false,
						description:
							'Whether visitors see a Posty5 page with the title and description below before they continue, instead of a direct redirect',
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
						description: 'Landing page description. Required when Landing Page is on.',
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
						displayName: 'Tag (Deprecated — Use Tags)',
						name: 'tag',
						type: 'string',
						default: '',
						description: 'The primary tag. Kept for saved workflows: use Tags. On Update, an empty value clears it.',
					},
					{
						displayName: 'Template ID (Deprecated)',
						name: 'templateId',
						type: 'string',
						default: '',
						description:
							'Use the Template field instead. Read only when Template is empty, so workflows saved before version 4.6.0 keep their template.',
					},
					...SHORT_LINK_CONTROL_ADDITIONAL_FIELDS,
				],
			},

			// Get, Update, Delete operation fields
			{
				displayName: 'Short Link ID',
				name: 'shortLinkId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['get', 'getAnalytics', 'update', 'delete', 'setRules', 'checkHealth'],
					},
				},
				default: '',
				description: 'The ID of the short link',
			},

			// List operation fields
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['list', 'listCampaigns'],
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
						operation: ['list', 'listCampaigns'],
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
						displayName: 'Destination URL Contains',
						name: 'baseUrl',
						type: 'string',
						default: '',
						description: 'Only links whose destination URL contains this text',
					},
					{
						displayName: 'Landing Page Enabled',
						name: 'isEnableLandingPage',
						type: 'boolean',
						default: true,
						description: 'Whether to return only links with the landing page on (true) or only links without it (false)',
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
						description: 'Only links whose name contains this text',
					},
					{
						displayName: 'Tag (Deprecated — Use Tags)',
						name: 'tag',
						type: 'string',
						default: '',
						description: 'Filter by one tag. Kept for saved workflows: use Tags.',
					},
					...SHORT_LINK_CONTROL_LIST_FILTERS,
				],
			},

			// Get Analytics operation fields (shared with the other link-tool node)
			...LINK_ANALYTICS_PROPERTIES,

			// Get Statistics operation fields (shared with the other link-tool node)
			...LINK_STATISTICS_PROPERTIES,

			// Create Many operation fields (shared with the other link-tool node)
			...buildLinkBulkProperties(true),

			// Short link controls: Set Rules, List Tags, campaigns
			...SHORT_LINK_SET_RULES_PROPERTIES,
			...SHORT_LINK_LIST_TAGS_PROPERTIES,
			...LINK_CAMPAIGN_PROPERTIES,
			...buildVersionedWriteProperties(['update', 'delete']),
		],
	};

	methods = {
		loadOptions: {
			getQrTemplates,
			getCampaigns,
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
			const prepared = prepareBulkRows(items.length, (i) => buildShortLinkBulkRow(this, i, defaults));
			return [await executeBulkCreate(this, apiKey, shortLinkBulkRoute(options.fetchMetadata !== false), prepared, defaults, options)];
		}

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: any = {};

				if (operation === 'create') {
					const additionalFields = this.getNodeParameter(
						'additionalFields',
						i,
						{},
					) as IShortLinkAdditionalFields;
					const name = firstText(this.getNodeParameter('name', i, ''));
					const customLandingId = firstText(this.getNodeParameter('customLandingId', i, ''));

					const body: ICreateShortLinkRequest = {
						baseUrl: toText(this.getNodeParameter('url', i, '')).trim(),
						templateId: requireTemplateId(this.getNodeParameter('templateId', i, ''), additionalFields),
						...buildCommonCreateFields(additionalFields),
						...buildDeepLinkFields(additionalFields, 'create'),
						...buildControlFields(this.getNode(), additionalFields as IShortLinkControlFields, 'create', i),
					};
					if (name) body.name = name;
					if (customLandingId) body.customLandingId = customLandingId;

					responseData = await makeApiRequest.call(this, apiKey, {
						method: 'POST',
						endpoint: API_ENDPOINTS.SHORT_LINK,
						body,
					});
				} else if (operation === 'get') {
					const shortLinkId = this.getNodeParameter('shortLinkId', i) as string;
					responseData = await makeApiRequest.call(this, apiKey, {
						method: 'GET',
						endpoint: `${API_ENDPOINTS.SHORT_LINK}/${shortLinkId}`,
					});
				} else if (operation === 'getAnalytics') {
					responseData = await executeGetAnalytics(
						this,
						apiKey,
						API_ENDPOINTS.SHORT_LINK,
						this.getNodeParameter('shortLinkId', i),
						i,
					);
				} else if (operation === 'getStatistics') {
					responseData = await executeGetStatistics(this, apiKey, API_ENDPOINTS.SHORT_LINK, i);
				} else if (operation === 'update') {
					const shortLinkId = this.getNodeParameter('shortLinkId', i) as string;
					const additionalFields = this.getNodeParameter(
						'additionalFields',
						i,
						{},
					) as IShortLinkAdditionalFields;
					const endpoint = `${API_ENDPOINTS.SHORT_LINK}/${shortLinkId}`;

					// Fetch-then-put: the PUT replaces the record and requires `baseUrl`,
					// so the stored link is the base and the user's fields go on top.
					const stored = (await makeApiRequest.call(this, apiKey, {
						method: 'GET',
						endpoint,
					})) as IShortLinkFullDetailsResponse;

					const body: IUpdateShortLinkRequest = {
						...buildCommonUpdateFields(additionalFields, stored),
						...buildDeepLinkFields(additionalFields, 'update'),
						...buildControlFields(this.getNode(), additionalFields as IShortLinkControlFields, 'update', i),
						baseUrl: firstText(additionalFields.baseUrl, stored.baseUrl) || '',
						templateId: requireTemplateId(
							this.getNodeParameter('templateId', i, ''),
							additionalFields,
							stored,
						),
					};
					const name = firstText(this.getNodeParameter('name', i, ''), stored.name);
					if (name) body.name = name;
					if (typeof stored.subCategory === 'number') body.subCategory = stored.subCategory;

					responseData = await makeApiRequest.call(this, apiKey, {
						method: 'PUT',
						endpoint,
						body,
						version: await resolveWriteVersion(this, apiKey, i, endpoint, stored),
					});
				} else if (operation === 'delete') {
					const shortLinkId = this.getNodeParameter('shortLinkId', i) as string;
					const endpoint = `${API_ENDPOINTS.SHORT_LINK}/${shortLinkId}`;
					responseData = await makeApiRequest.call(this, apiKey, {
						method: 'DELETE',
						endpoint,
						version: await resolveWriteVersion(this, apiKey, i, endpoint),
					});
				} else if (operation === 'setRules') {
					// The update requires baseUrl and templateId, so the link is read first;
					// only the rule sections the user added are sent (absent ones are kept).
					const endpoint = `${API_ENDPOINTS.SHORT_LINK}/${this.getNodeParameter('shortLinkId', i) as string}`;
					const stored = (await makeApiRequest.call(this, apiKey, {
						method: 'GET',
						endpoint,
					})) as IShortLinkFullDetailsResponse;
					const rules = this.getNodeParameter('rules', i, {}) as IShortLinkControlFields;
					const body = {
						...buildControlFields(this.getNode(), rules, 'update', i),
						baseUrl: stored.baseUrl || '',
						templateId: stored.templateId || stored.template?._id || '',
					};
					responseData = await makeApiRequest.call(this, apiKey, { method: 'PUT', endpoint, body });
				} else if (operation === 'listTags') {
					const term = firstText(this.getNodeParameter('term', i, ''));
					const tags = (await makeApiRequest.call(this, apiKey, {
						method: 'GET',
						endpoint: `${API_ENDPOINTS.SHORT_LINK}${SHORT_LINK_CONTROLS.TAGS_PATH}`,
						qs: term ? { term } : undefined,
					})) as string[] | undefined;
					responseData = (tags || []).map((value) => ({ tag: value }));
				} else if (operation === 'checkHealth') {
					const shortLinkId = this.getNodeParameter('shortLinkId', i) as string;
					await makeApiRequest.call(this, apiKey, {
						method: 'POST',
						endpoint: `${API_ENDPOINTS.SHORT_LINK}/${shortLinkId}${SHORT_LINK_CONTROLS.HEALTH_CHECK_PATH}`,
						body: {},
						stampCreatedFrom: false,
					});
					responseData = { shortLinkId, ...SHORT_LINK_CONTROLS.HEALTH_CHECK_QUEUED };
				} else if (operation === 'createCampaign') {
					const name = firstText(this.getNodeParameter('campaignName', i, ''));
					if (!name) {
						throw new NodeOperationError(this.getNode(), SHORT_LINK_CONTROLS_MESSAGES.CAMPAIGN_NAME_REQUIRED, {
							itemIndex: i,
						});
					}
					const fields = this.getNodeParameter('campaignFields', i, {}) as ILinkCampaignFields;
					responseData = await makeApiRequest.call(this, apiKey, {
						method: 'POST',
						endpoint: API_ENDPOINTS.LINK_CAMPAIGN,
						body: buildCampaignBody(name, fields, 'create'),
					});
				} else if (
					operation === 'getCampaign' ||
					operation === 'updateCampaign' ||
					operation === 'deleteCampaign'
				) {
					const campaignId = firstText(this.getNodeParameter('campaignId', i, ''));
					if (!campaignId) {
						throw new NodeOperationError(this.getNode(), SHORT_LINK_CONTROLS_MESSAGES.ID_REQUIRED('Campaign ID'), {
							itemIndex: i,
						});
					}
					const endpoint = `${API_ENDPOINTS.LINK_CAMPAIGN}/${campaignId}`;
					if (operation === 'getCampaign') {
						responseData = await makeApiRequest.call(this, apiKey, { method: 'GET', endpoint });
					} else if (operation === 'updateCampaign') {
						const fields = this.getNodeParameter('campaignFields', i, {}) as ILinkCampaignFields & { name?: string };
						responseData = await makeApiRequest.call(this, apiKey, {
							method: 'PUT',
							endpoint,
							body: buildCampaignBody(firstText(fields.name) || '', fields, 'update'),
						});
					} else {
						const detach = this.getNodeParameter('detach', i, false) as boolean;
						const deleted = await makeApiRequest.call(this, apiKey, {
							method: 'DELETE',
							endpoint,
							qs: detach ? { detach: true } : undefined,
						});
						responseData = deleted || { campaignId, deleted: true };
					}
				} else if (operation === 'listCampaigns') {
					const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
					const filters = this.getNodeParameter('campaignFilters', i, {}) as { archived?: boolean; term?: string };
					const qs: Record<string, string | number | boolean> = {};
					const term = firstText(filters.term);
					if (term) qs.term = term;
					if (typeof filters.archived === 'boolean') qs.archived = filters.archived;
					if (returnAll) {
						responseData = await makePaginatedRequest.call(this, apiKey, API_ENDPOINTS.LINK_CAMPAIGN, qs);
					} else {
						const limit = this.getNodeParameter('limit', i, 50) as number;
						const result = await makeApiRequest.call(this, apiKey, {
							method: 'GET',
							endpoint: API_ENDPOINTS.LINK_CAMPAIGN,
							qs: { ...qs, page: 1, pageSize: limit },
						});
						responseData = result?.items || [];
					}
				} else if (operation === 'list') {
					const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
					const filters = this.getNodeParameter('filters', i, {}) as IShortLinkListFilters;

					// Each filter narrows the list (the API ANDs them), so Search matches
					// the name only and the destination URL has a filter of its own.
					const qs: IListParams = {};
					const tag = firstText(filters.tag);
					const refId = firstText(filters.refId);
					const name = firstText(filters.search);
					const baseUrl = firstText(filters.baseUrl);
					const tags = splitList(filters.tags);
					const campaignId = firstText(filters.campaignId);
					if (tag) qs.tag = tag;
					if (tags.length) qs.tags = tags.join(SHORT_LINK_CONTROLS.TAGS_SEPARATOR);
					if (campaignId) qs.campaignId = campaignId;
					if (refId) qs.refId = refId;
					if (name) qs.name = name;
					if (baseUrl) qs.baseUrl = baseUrl;
					if (typeof filters.isEnableLandingPage === 'boolean') {
						qs.isEnableLandingPage = filters.isEnableLandingPage;
					}

					if (returnAll) {
						responseData = await makePaginatedRequest.call(
							this,
							apiKey,
							API_ENDPOINTS.SHORT_LINK,
							qs,
						);
					} else {
						const limit = this.getNodeParameter('limit', i, 50) as number;
						const result = await makeApiRequest.call(this, apiKey, {
							method: 'GET',
							endpoint: API_ENDPOINTS.SHORT_LINK,
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
