import { Posty5ShortLink } from '../nodes/Posty5ShortLink/Posty5ShortLink.node';
import { version } from '../package.json';
import { makeApiRequest, makePaginatedRequest } from '../utils/api.helpers';
import { Posty5ClientConst } from '../utils/constants';
import { createMockExecuteFunctions } from './setup';

/**
 * The shared request helper every node goes through. What it puts on the wire
 * is what the API sees from n8n, so the headers are asserted exactly.
 */
describe('makeApiRequest', () => {
	const API_KEY = 'test-api-key';
	const CLIENT = `posty5-n8n/${version}`;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('names the client from package.json, not from a copy that can go stale', () => {
		expect(Posty5ClientConst).toEqual({ HEADER: 'X-Posty5-Client', VALUE: CLIENT });
	});

	it('sends X-Posty5-Client beside the key and content type', async () => {
		const context = createMockExecuteFunctions({}, [{ json: {} }], {}, { result: { ok: true } });

		const result = await makeApiRequest.call(context, API_KEY, {
			method: 'GET',
			endpoint: '/api/short-link/sl1',
		});

		expect(result).toEqual({ ok: true });
		expect(context.helpers.httpRequest).toHaveBeenCalledTimes(1);
		expect(context.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				method: 'GET',
				url: 'https://api.posty5.com/api/short-link/sl1',
				headers: {
					'X-API-Key': API_KEY,
					'Content-Type': 'application/json',
					'X-Posty5-Client': CLIENT,
				},
			}),
		);
	});

	it('sends it on POST, where the body is still stamped createdFrom n8n', async () => {
		const context = createMockExecuteFunctions({}, [{ json: {} }], {}, { result: {} });

		await makeApiRequest.call(context, API_KEY, {
			method: 'POST',
			endpoint: '/api/short-link',
			body: { baseUrl: 'https://example.com' },
		});

		expect(context.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				headers: expect.objectContaining({ 'X-Posty5-Client': CLIENT }),
				body: { baseUrl: 'https://example.com', createdFrom: 'n8n' },
			}),
		);
	});

	it('sends it on list requests made through makePaginatedRequest', async () => {
		const context = createMockExecuteFunctions({}, [{ json: {} }], {}, { result: { items: [] } });

		await makePaginatedRequest.call(context, API_KEY, '/api/qr-code', {}, { page: 1, pageSize: 10 });

		expect(context.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				headers: expect.objectContaining({ 'X-Posty5-Client': CLIENT }),
				qs: { page: 1, pageSize: 10 },
			}),
		);
	});

	it('reaches the wire from a node operation', async () => {
		const context = createMockExecuteFunctions(
			{ operation: 'get', shortLinkId: 'sl1' },
			[{ json: {} }],
			{ apiKey: API_KEY },
			{ id: 'sl1' },
		);

		await new Posty5ShortLink().execute.call(context);

		expect(context.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				headers: expect.objectContaining({
					'X-API-Key': API_KEY,
					'X-Posty5-Client': CLIENT,
				}),
			}),
		);
	});
});
