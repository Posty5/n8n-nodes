import {
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	NodeOperationError,
} from 'n8n-workflow';
import { makeApiRequest } from '../../utils/api.helpers';
import { API_ENDPOINTS } from '../../utils/constants';
import { TRIGGER_CONFIG, TRIGGER_MESSAGES, TRIGGER_SIGNATURE } from './config';
import { POSTY5_TRIGGER_PROPERTIES } from './descriptions';
import { buildEndpointBody, buildTargets, endpointMatches, readHeader, toItems, verifySignature } from './helpers';
import type { IPosty5ApiError } from '../../types/common';
import type {
	ICreateWebhookEndpointResponse,
	IPosty5TriggerOptions,
	IPosty5TriggerStaticData,
	IWebhookEndpoint,
	IWebhookTargets,
	WebhookEventType,
	WebhookHeaders,
} from '../../types/webhook.types';

/** The node's API key. */
async function readApiKey(ctx: IHookFunctions): Promise<string> {
	const credentials = await ctx.getCredentials('posty5Api');
	return credentials.apiKey as string;
}

/** Events and targets as set on the node. */
function readSubscription(ctx: IHookFunctions): { events: WebhookEventType[]; targets: IWebhookTargets | undefined } {
	const links = ctx.getNodeParameter('links', 'all') as string;
	const ids = ctx.getNodeParameter(links === 'qrCodes' ? 'qrCodeIds' : 'shortLinkIds', '');
	return {
		events: ctx.getNodeParameter('events', []) as WebhookEventType[],
		targets: buildTargets(links, ids),
	};
}

/** Delete an endpoint; a 404 (already gone) is success. */
async function removeEndpoint(ctx: IHookFunctions, apiKey: string, id: string): Promise<void> {
	try {
		await makeApiRequest.call(ctx, apiKey, { method: 'DELETE', endpoint: `${API_ENDPOINTS.WEBHOOK_ENDPOINTS}/${id}` });
	} catch (error) {
		if ((error as IPosty5ApiError).httpCode !== TRIGGER_CONFIG.NOT_FOUND_HTTP_CODE) throw error;
	}
}

export class Posty5Trigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Posty5 Trigger',
		name: 'posty5Trigger',
		icon: 'file:posty5.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Starts the workflow when a Posty5 short link is visited, a QR code is scanned or a milestone is reached',
		defaults: {
			name: 'Posty5 Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'posty5Api',
				required: true,
			},
		],
		webhooks: [
			{
				name: TRIGGER_CONFIG.WEBHOOK_NAME,
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: TRIGGER_CONFIG.WEBHOOK_PATH,
			},
		],
		properties: POSTY5_TRIGGER_PROPERTIES,
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node') as IPosty5TriggerStaticData;
				if (!staticData.endpointId) return false;
				const apiKey = await readApiKey(this);
				let endpoint: IWebhookEndpoint;
				try {
					endpoint = (await makeApiRequest.call(this, apiKey, {
						method: 'GET',
						endpoint: `${API_ENDPOINTS.WEBHOOK_ENDPOINTS}/${staticData.endpointId}`,
					})) as IWebhookEndpoint;
				} catch (error) {
					if ((error as IPosty5ApiError).httpCode === TRIGGER_CONFIG.NOT_FOUND_HTTP_CODE) {
						delete staticData.endpointId;
						delete staticData.secret;
						return false;
					}
					throw error;
				}
				const { events, targets } = readSubscription(this);
				const url = this.getNodeWebhookUrl(TRIGGER_CONFIG.WEBHOOK_NAME) || '';
				// A mismatch (or a disabled endpoint) answers false: n8n then calls create, which replaces it.
				return endpointMatches(endpoint, url, events, targets);
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node') as IPosty5TriggerStaticData;
				const apiKey = await readApiKey(this);
				const url = this.getNodeWebhookUrl(TRIGGER_CONFIG.WEBHOOK_NAME);
				if (!url) throw new NodeOperationError(this.getNode(), TRIGGER_MESSAGES.NO_WEBHOOK_URL);

				if (staticData.endpointId) {
					await removeEndpoint(this, apiKey, staticData.endpointId);
					delete staticData.endpointId;
					delete staticData.secret;
				}

				const { events, targets } = readSubscription(this);
				const options = this.getNodeParameter('options', {}) as IPosty5TriggerOptions;
				let body;
				try {
					body = buildEndpointBody(
						url,
						events,
						targets,
						options,
						`${TRIGGER_CONFIG.DESCRIPTION_PREFIX} ${this.getWorkflow().name ?? ''} / ${this.getNode().name}`.slice(
							0,
							TRIGGER_CONFIG.MAX_DESCRIPTION_LENGTH,
						),
					);
				} catch (error) {
					throw new NodeOperationError(this.getNode(), error as Error);
				}

				let created: ICreateWebhookEndpointResponse;
				try {
					created = (await makeApiRequest.call(this, apiKey, {
						method: 'POST',
						endpoint: API_ENDPOINTS.WEBHOOK_ENDPOINTS,
						body,
					})) as ICreateWebhookEndpointResponse;
				} catch (error) {
					const apiError = error as IPosty5ApiError;
					if (apiError.httpCode === TRIGGER_CONFIG.INVALID_URL_HTTP_CODE) {
						throw new NodeOperationError(this.getNode(), TRIGGER_MESSAGES.PUBLIC_HTTPS_REQUIRED, {
							description: apiError.apiMessage,
						});
					}
					if (apiError.httpCode === TRIGGER_CONFIG.PLAN_GATE_HTTP_CODE) {
						throw new NodeOperationError(this.getNode(), apiError.apiMessage || TRIGGER_MESSAGES.PLAN_REQUIRED);
					}
					throw error;
				}

				staticData.endpointId = created.endpoint._id;
				staticData.secret = created.secret;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node') as IPosty5TriggerStaticData;
				if (staticData.endpointId) {
					await removeEndpoint(this, await readApiKey(this), staticData.endpointId);
				}
				delete staticData.endpointId;
				delete staticData.secret;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const staticData = this.getWorkflowStaticData('node') as IPosty5TriggerStaticData;
		const request = this.getRequestObject() as unknown as { rawBody?: Buffer };
		const headers = this.getHeaderData() as WebhookHeaders;

		// The raw body, never a re-serialised `req.body`: the signature covers the exact bytes.
		const verified = verifySignature(request.rawBody, headers, staticData.secret);
		if ('failure' in verified) {
			this.getResponseObject().status(TRIGGER_CONFIG.UNAUTHORIZED_STATUS).json({ message: TRIGGER_MESSAGES.SIGNATURE_REJECTED });
			return { noWebhookResponse: true };
		}

		const options = this.getNodeParameter('options', {}) as IPosty5TriggerOptions;
		const items = toItems(
			verified.event,
			readHeader(headers, TRIGGER_SIGNATURE.HEADER_ID),
			options.splitBatches !== false,
		);
		return { workflowData: [items] };
	}
}
