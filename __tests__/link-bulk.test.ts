import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { Posty5ShortLink } from '../nodes/Posty5ShortLink/Posty5ShortLink.node';
import { Posty5QrCode } from '../nodes/Posty5QrCode/Posty5QrCode.node';
import { buildBulkIdempotencyKey, readBatchSize } from '../utils/link-bulk.helpers';
import { createMockExecuteFunctions } from './setup';

/** `count` input items whose json carries the row number. */
function inputItems(count: number): INodeExecutionData[] {
	return Array.from({ length: count }, (_, i) => ({ json: { n: i } }));
}

/** A parameter reader that resolves per item from the item index. */
function perItemParameters(
	mock: IExecuteFunctions,
	parameters: Record<string, any>,
	perItem: Record<string, (i: number) => any> = {},
): void {
	(mock.getNodeParameter as jest.Mock).mockImplementation((name: string, i: number, fallback?: any) => {
		if (perItem[name]) return perItem[name](i);
		return parameters[name] !== undefined ? parameters[name] : fallback;
	});
}

/** An API that creates every row it gets (or refuses the rows listed in `failRows`, 1-based per request). */
function bulkApi(listKey: 'links' | 'items', failRows: number[] = []) {
	return jest.fn().mockImplementation(async (request: any) => {
		const rows: any[] = request.body[listKey];
		const items = rows.map((_, index) =>
			failRows.includes(index + 1)
				? { row: index + 1, status: 'failed', errors: [{ field: 'url', message: 'bad url' }] }
				: { row: index + 1, status: 'created', id: `id-${index}`, shortUrl: `https://pst5.com/${index}` },
		);
		return { result: { created: items.filter((i) => i.status === 'created').length, failed: failRows.length, items } };
	});
}

function calls(mock: IExecuteFunctions): any[] {
	return (mock.helpers.httpRequest as jest.Mock).mock.calls.map((call) => call[0]);
}

describe('Create Many helpers', () => {
	it('clamps the batch size to 1..100', () => {
		expect(readBatchSize(undefined)).toBe(100);
		expect(readBatchSize(0)).toBe(100);
		expect(readBatchSize(250)).toBe(100);
		expect(readBatchSize(25)).toBe(25);
	});

	it('builds n8n-<execution>-<node>-<chunk> keys', () => {
		expect(buildBulkIdempotencyKey('42', 'Make Links', 2)).toBe('n8n-42-Make Links-2');
	});
});

describe('Posty5ShortLink Create Many', () => {
	const node = new Posty5ShortLink();

	it('declares the operation', () => {
		const operation: any = node.description.properties.find((p) => p.name === 'operation');
		expect(operation.options.map((o: any) => o.value)).toContain('createMany');
	});

	it('sends 250 items in 3 requests with chunk keys and answers 250 paired items in order', async () => {
		const mock = createMockExecuteFunctions({}, inputItems(250), { apiKey: 'k' });
		perItemParameters(
			mock,
			{ operation: 'createMany', templateId: 'tpl', bulkDefaults: { tag: 'promo' }, bulkOptions: {} },
			{ url: (i) => `https://example.com/${i}` },
		);
		(mock.helpers as any).httpRequest = bulkApi('links');

		const [output] = await node.execute.call(mock);

		const requests = calls(mock);
		expect(requests).toHaveLength(3);
		expect(requests.map((r) => r.body.links.length)).toEqual([100, 100, 50]);
		expect(requests.map((r) => r.headers['Idempotency-Key'])).toEqual([
			'n8n-exec-1-Posty5 Test Node-0',
			'n8n-exec-1-Posty5 Test Node-1',
			'n8n-exec-1-Posty5 Test Node-2',
		]);
		expect(requests[0].url).toBe('https://api.posty5.com/api/short-link/bulk');
		expect(requests[0].body).toMatchObject({
			defaults: { tag: 'promo' },
			fetchMetadata: true,
			templateType: 'user',
			createdFrom: 'n8n',
		});
		expect(requests[0].body.links[0]).toEqual({ url: 'https://example.com/0', templateId: 'tpl' });
		expect(output).toHaveLength(250);
		expect(output[249].pairedItem).toEqual({ item: 249 });
		expect(output[249].json).toEqual({ status: 'created', id: 'id-49', shortUrl: 'https://pst5.com/49' });
	});

	it('outputs a refused row as a failed item', async () => {
		const mock = createMockExecuteFunctions({}, inputItems(3), { apiKey: 'k' });
		perItemParameters(mock, { operation: 'createMany', templateId: 'tpl', url: 'https://a.com' });
		(mock.helpers as any).httpRequest = bulkApi('links', [2]);

		const [output] = await node.execute.call(mock);

		expect(output.map((item) => item.json.status)).toEqual(['created', 'failed', 'created']);
		expect(output[1].json.errors).toEqual([{ field: 'url', message: 'bad url' }]);
	});

	it('throws on a refused row with Fail on Any Row Error', async () => {
		const mock = createMockExecuteFunctions({}, inputItems(2), { apiKey: 'k' });
		perItemParameters(mock, {
			operation: 'createMany',
			templateId: 'tpl',
			url: 'https://a.com',
			bulkOptions: { failOnRowError: true },
		});
		(mock.helpers as any).httpRequest = bulkApi('links', [2]);

		await expect(node.execute.call(mock)).rejects.toThrow('url: bad url');
	});

	it('keeps an item without any template local as a failed row', async () => {
		const mock = createMockExecuteFunctions({}, inputItems(2), { apiKey: 'k' });
		perItemParameters(mock, { operation: 'createMany', url: 'https://a.com' }, { templateId: (i) => (i === 0 ? 'tpl' : '') });
		(mock.helpers as any).httpRequest = bulkApi('links');

		const [output] = await node.execute.call(mock);

		expect(calls(mock)[0].body.links).toHaveLength(1);
		expect(output[1].json.status).toBe('failed');
		expect(output[0].json.status).toBe('created');
	});

	it('makes no request for zero items', async () => {
		const mock = createMockExecuteFunctions({ operation: 'createMany' }, [], { apiKey: 'k' });
		const [output] = await node.execute.call(mock);
		expect(output).toEqual([]);
		expect(mock.helpers.httpRequest).not.toHaveBeenCalled();
	});

	it('throws a whole-request 403, or outputs it on every item with continueOnFail', async () => {
		const forbidden = Object.assign(new Error('403'), { response: { status: 403, data: { message: 'plan' } } });
		const mock = createMockExecuteFunctions({}, inputItems(2), { apiKey: 'k' });
		perItemParameters(mock, { operation: 'createMany', templateId: 'tpl', url: 'https://a.com' });
		(mock.helpers as any).httpRequest = jest.fn().mockRejectedValue(forbidden);

		await expect(node.execute.call(mock)).rejects.toThrow('Posty5 API Error: plan');

		(mock.continueOnFail as jest.Mock).mockReturnValue(true);
		const [output] = await node.execute.call(mock);
		expect(output.map((item) => item.json.error)).toEqual(['Posty5 API Error: plan', 'Posty5 API Error: plan']);
		expect(output[1].pairedItem).toEqual({ item: 1 });
	});
});

describe('Posty5QrCode Create Many', () => {
	const node = new Posty5QrCode();
	const types: Record<string, Record<string, any>> = {
		url: { url: 'https://a.com' },
		freeText: { text: 'hello' },
		email: { email: 'a@b.com' },
		wifi: { wifiName: 'net', wifiAuthType: 'WPA', wifiPassword: 'pw' },
		call: { phoneNumber: '+201' },
		sms: { smsPhoneNumber: '+201', smsMessage: 'hi' },
		geolocation: { latitude: 30, longitude: 31 },
	};
	const typeNames = Object.keys(types);

	it('sends every type as { type, target } built like qrCodeTarget', async () => {
		const mock = createMockExecuteFunctions({}, inputItems(typeNames.length), { apiKey: 'k' });
		(mock.getNodeParameter as jest.Mock).mockImplementation((name: string, i: number, fallback?: any) => {
			const type = typeNames[i];
			if (name === 'operation') return 'createMany';
			if (name === 'qrType') return type;
			if (name === 'templateId') return 'tpl';
			if (name in types[type]) return types[type][name];
			return fallback;
		});
		(mock.helpers as any).httpRequest = bulkApi('items');

		await node.execute.call(mock);

		const [request] = calls(mock);
		expect(request.url).toBe('https://api.posty5.com/api/qr-code/bulk');
		expect(request.body.templateType).toBe('user');
		expect(request.body.items.map((row: any) => row.type)).toEqual(typeNames);
		expect(request.body.items[0].target).toEqual({ url: 'https://a.com' });
		expect(request.body.items[3].target).toEqual({ name: 'net', authenticationType: 'WPA', password: 'pw' });
		expect(request.body.items[6].target).toEqual({ latitude: 30, longitude: 31 });
		for (const row of request.body.items) expect(row.target).toBeDefined();
	});

	it('sends mode only for dynamic rows', async () => {
		const mock = createMockExecuteFunctions({}, inputItems(2), { apiKey: 'k' });
		perItemParameters(
			mock,
			{ operation: 'createMany', qrType: 'url', url: 'https://a.com', templateId: 'tpl' },
			{ mode: (i) => (i === 0 ? 'dynamic' : 'static') },
		);
		(mock.helpers as any).httpRequest = bulkApi('items');

		await node.execute.call(mock);

		const rows = calls(mock)[0].body.items;
		expect(rows[0].mode).toBe('dynamic');
		expect(rows[1].mode).toBeUndefined();
	});
});
