import { createHmac } from 'crypto';
import { Posty5Trigger } from '../nodes/Posty5Trigger/Posty5Trigger.node';
import { parseMilestones, signPayload, toItems, verifySignature } from '../nodes/Posty5Trigger/helpers';

const WEBHOOK_URL = 'https://n8n.example.com/webhook/abc/webhook';
// Standard Webhooks reference vector (the one the npm SDK's @posty5/webhooks tests use).
const VECTOR = {
	secret: 'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw',
	id: 'msg_p5jXN8AQM9LWM0D4loKWxJek',
	timestamp: '1614265330',
	payload: '{"test": 2432232314}',
	signature: 'v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=',
};

function apiError(status: number, message = 'refused') {
	return Object.assign(new Error(message), { response: { status, data: { message } } });
}

function hookContext(parameters: Record<string, any>, staticData: Record<string, any> = {}, httpRequest = jest.fn()) {
	return {
		getNodeParameter: jest.fn((name: string, fallback?: any) => (parameters[name] !== undefined ? parameters[name] : fallback)),
		getCredentials: jest.fn().mockResolvedValue({ apiKey: 'k' }),
		getNode: jest.fn().mockReturnValue({ name: 'Posty5 Trigger' }),
		getWorkflow: jest.fn().mockReturnValue({ name: 'Clicks to Slack' }),
		getNodeWebhookUrl: jest.fn().mockReturnValue(WEBHOOK_URL),
		getWorkflowStaticData: jest.fn().mockReturnValue(staticData),
		helpers: { httpRequest },
	} as any;
}

const PARAMS = { events: ['short_link.visited'], links: 'all', options: {} };

describe('Posty5Trigger', () => {
	const node = new Posty5Trigger();
	const methods = node.webhookMethods.default;

	describe('description', () => {
		it('is a trigger with one POST webhook', () => {
			expect(node.description.group).toEqual(['trigger']);
			expect(node.description.inputs).toEqual([]);
			expect(node.description.webhooks?.[0]).toMatchObject({ httpMethod: 'POST', path: 'webhook' });
		});
	});

	describe('checkExists', () => {
		it('is false without a stored endpoint', async () => {
			const ctx = hookContext(PARAMS);
			await expect(methods.checkExists.call(ctx)).resolves.toBe(false);
			expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
		});

		it('is false and clears static data on 404', async () => {
			const staticData = { endpointId: 'e1', secret: 's' };
			const ctx = hookContext(PARAMS, staticData, jest.fn().mockRejectedValue(apiError(404)));
			await expect(methods.checkExists.call(ctx)).resolves.toBe(false);
			expect(staticData).toEqual({});
		});

		it('is false when the URL differs, true when everything matches', async () => {
			const endpoint = { _id: 'e1', url: 'https://other', events: ['short_link.visited'], enabled: true };
			const ctx = hookContext(PARAMS, { endpointId: 'e1' }, jest.fn().mockResolvedValue({ result: endpoint }));
			await expect(methods.checkExists.call(ctx)).resolves.toBe(false);

			endpoint.url = WEBHOOK_URL;
			await expect(methods.checkExists.call(ctx)).resolves.toBe(true);
		});

		it('is false for a disabled endpoint', async () => {
			const endpoint = { _id: 'e1', url: WEBHOOK_URL, events: ['short_link.visited'], enabled: false };
			const ctx = hookContext(PARAMS, { endpointId: 'e1' }, jest.fn().mockResolvedValue({ result: endpoint }));
			await expect(methods.checkExists.call(ctx)).resolves.toBe(false);
		});
	});

	describe('create', () => {
		it('posts the endpoint and stores id and secret', async () => {
			const staticData: Record<string, any> = {};
			const http = jest.fn().mockResolvedValue({ result: { _id: 'e9', secret: 'whsec_x' } });
			const ctx = hookContext(
				{
					events: ['short_link.visited', 'short_link.visits_milestone'],
					links: 'shortLinks',
					shortLinkIds: 'a, b',
					options: { includeBots: true, milestones: '100,1000', delivery: 'batch300' },
				},
				staticData,
				http,
			);

			await expect(methods.create.call(ctx)).resolves.toBe(true);

			const request = http.mock.calls[0][0];
			expect(request.url).toBe('https://api.posty5.com/api/webhook-endpoints');
			expect(request.body).toEqual({
				url: WEBHOOK_URL,
				events: ['short_link.visited', 'short_link.visits_milestone'],
				targets: { shortLinkIds: ['a', 'b'] },
				includeBots: true,
				milestones: [100, 1000],
				delivery: { mode: 'batch', windowSeconds: 300 },
				description: 'n8n: Clicks to Slack / Posty5 Trigger',
				createdFrom: 'n8n',
			});
			expect(staticData).toEqual({ endpointId: 'e9', secret: 'whsec_x' });
		});

		it('maps a 400 to the public-HTTPS message and a 403 to the plan message', async () => {
			let ctx = hookContext(PARAMS, {}, jest.fn().mockRejectedValue(apiError(400, 'url is private')));
			await expect(methods.create.call(ctx)).rejects.toThrow('public HTTPS');

			ctx = hookContext(PARAMS, {}, jest.fn().mockRejectedValue(apiError(403, 'Upgrade to Pro')));
			await expect(methods.create.call(ctx)).rejects.toThrow('Upgrade to Pro');
		});
	});

	describe('delete', () => {
		it('treats 404 as success and clears static data', async () => {
			const staticData = { endpointId: 'e1', secret: 's' };
			const ctx = hookContext(PARAMS, staticData, jest.fn().mockRejectedValue(apiError(404)));
			await expect(methods.delete.call(ctx)).resolves.toBe(true);
			expect(staticData).toEqual({});
		});
	});

	describe('verifySignature', () => {
		const headers = {
			'webhook-id': VECTOR.id,
			'webhook-timestamp': VECTOR.timestamp,
			'webhook-signature': VECTOR.signature,
		};
		const now = Number(VECTOR.timestamp);

		it('accepts the reference vector', () => {
			expect(verifySignature(Buffer.from(VECTOR.payload), headers, VECTOR.secret, now)).toEqual({
				event: { test: 2432232314 },
			});
		});

		it('refuses a tampered body', () => {
			expect(verifySignature(Buffer.from('{"test": 1}'), headers, VECTOR.secret, now)).toEqual({
				failure: 'noMatchingSignature',
			});
		});

		it('refuses a stale timestamp', () => {
			expect(verifySignature(VECTOR.payload, headers, VECTOR.secret, now + 301)).toEqual({
				failure: 'timestampOutOfRange',
			});
		});

		it('accepts any signature of a rotation pair', () => {
			const rotating = { ...headers, 'webhook-signature': `v1,AAAA ${VECTOR.signature}` };
			expect('event' in verifySignature(VECTOR.payload, rotating, VECTOR.secret, now)).toBe(true);
		});

		it('refuses missing headers', () => {
			expect(verifySignature(VECTOR.payload, {}, VECTOR.secret, now)).toEqual({ failure: 'missingHeaders' });
		});

		it('signs like the SDK', () => {
			const key = Buffer.from(VECTOR.secret.slice('whsec_'.length), 'base64');
			const expected = createHmac('sha256', key).update(`${VECTOR.id}.${VECTOR.timestamp}.${VECTOR.payload}`).digest('base64');
			expect(signPayload(VECTOR.secret, VECTOR.id, VECTOR.timestamp, VECTOR.payload)).toBe(expected);
		});
	});

	describe('webhook()', () => {
		function webhookContext(rawBody: string, headers: Record<string, string>, options: Record<string, any> = {}) {
			const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
			return {
				ctx: {
					getWorkflowStaticData: jest.fn().mockReturnValue({ secret: VECTOR.secret }),
					getRequestObject: jest.fn().mockReturnValue({ rawBody: Buffer.from(rawBody) }),
					getHeaderData: jest.fn().mockReturnValue(headers),
					getResponseObject: jest.fn().mockReturnValue(response),
					getNodeParameter: jest.fn().mockReturnValue(options),
				} as any,
				response,
			};
		}

		function signed(body: string) {
			const timestamp = String(Math.floor(Date.now() / 1000));
			return {
				'webhook-id': 'msg_1',
				'webhook-timestamp': timestamp,
				'webhook-signature': `v1,${signPayload(VECTOR.secret, 'msg_1', timestamp, body)}`,
			};
		}

		it('answers 401 and runs nothing for a forged request', async () => {
			const { ctx, response } = webhookContext('{}', { 'webhook-id': 'x', 'webhook-timestamp': '1', 'webhook-signature': 'v1,x' });
			await expect(node.webhook.call(ctx)).resolves.toEqual({ noWebhookResponse: true });
			expect(response.status).toHaveBeenCalledWith(401);
		});

		it('passes a verified test event through as one item with webhookId', async () => {
			const body = JSON.stringify({ id: 'evt_1', type: 'webhook.test', createdAt: 'now', data: {} });
			const { ctx } = webhookContext(body, signed(body));
			const result = await node.webhook.call(ctx);
			expect(result.workflowData?.[0]).toEqual([
				{ json: { id: 'evt_1', type: 'webhook.test', createdAt: 'now', data: {}, webhookId: 'msg_1' } },
			]);
		});
	});

	describe('toItems', () => {
		const batch = {
			id: 'evt_b',
			type: 'batch' as const,
			createdAt: 'now',
			data: { events: [{ id: 'e1', type: 'short_link.visited' as const, createdAt: 'a', data: {} }, { id: 'e2', type: 'short_link.visited' as const, createdAt: 'b', data: {} }] },
		};

		it('splits a batch into one item per event', () => {
			expect(toItems(batch, 'm', true).map((item) => item.json.id)).toEqual(['e1', 'e2']);
		});

		it('keeps a batch as one item when splitting is off', () => {
			expect(toItems(batch, 'm', false)).toHaveLength(1);
		});
	});

	describe('parseMilestones', () => {
		it('parses and validates', () => {
			expect(parseMilestones('100, 1000')).toEqual([100, 1000]);
			expect(parseMilestones('')).toBeUndefined();
			expect(() => parseMilestones('10,abc')).toThrow('Milestones');
			expect(() => parseMilestones('1,2,3,4,5,6,7,8,9,10,11')).toThrow('Milestones');
		});
	});
});
