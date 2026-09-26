import type { INodeExecutionData } from 'n8n-workflow';
import { Posty5Store } from '../nodes/Posty5Store/Posty5Store.node';
import { Posty5ShortLink } from '../nodes/Posty5ShortLink/Posty5ShortLink.node';
import { STORE_SUPPLIER_PAGE_SIZES } from '../utils/constants';
import { createMockExecuteFunctions } from './setup';

const BASE = 'https://api.posty5.com/api/store-suppliers/s1';

async function run(parameters: Record<string, any>, response: any = {}, inputData?: INodeExecutionData[]) {
	const node = new Posty5Store();
	const fns = createMockExecuteFunctions({ storeId: 's1', ...parameters }, inputData, { apiKey: 'k' }, { result: response });
	const output = await node.execute.call(fns);
	const calls = (fns.helpers.httpRequest as jest.Mock).mock.calls.map(([options]) => options);
	return { output: output[0], calls, fns };
}

describe('Posty5Store', () => {
	describe('Node Structure', () => {
		const node = new Posty5Store();
		const property = (name: string, resource?: string) =>
			node.description.properties.find(
				(p) => p.name === name && (!resource || (p.displayOptions?.show?.resource as string[] | undefined)?.includes(resource)),
			) as any;

		it('is the Posty5 Store node with one required credential', () => {
			expect(node.description.displayName).toBe('Posty5 Store');
			expect(node.description.name).toBe('posty5Store');
			expect(node.description.credentials).toEqual([{ name: 'posty5Api', required: true }]);
		});

		it('offers six resources, sorted by name', () => {
			const names = property('resource').options.map((o: any) => o.name);
			expect(names).toEqual([...names].sort());
			expect(property('resource').options.map((o: any) => o.value)).toEqual([
				'fulfilmentGroup',
				'order',
				'productLink',
				'supplier',
				'supplierOrder',
				'supplierProduct',
			]);
		});

		it.each([
			['fulfilmentGroup', ['fulfilManually', 'submit']],
			['order', ['get', 'getMany']],
			['productLink', ['getMany', 'sync']],
			['supplier', ['getBalance', 'getCatalogue', 'getMany', 'test']],
			['supplierOrder', ['cancel', 'get', 'getMany', 'pay', 'retry']],
			['supplierProduct', ['get', 'getImportStatus', 'getMany', 'import', 'previewImport', 'resolveUrl']],
		])('%s has its operations, sorted by name, each with an action', (resource, values) => {
			const options = property('operation', resource).options;
			expect(options.map((o: any) => o.value)).toEqual(values);
			const names = options.map((o: any) => o.name);
			expect(names).toEqual([...names].sort());
			expect(options.every((o: any) => typeof o.action === 'string')).toBe(true);
		});

		it('caps each page-number Limit at what the api accepts', () => {
			// The api refuses (400) rather than clamps: catalogue pageSize ≤ 48, supplier orders ≤ 100.
			const browse = property('limit', 'supplierProduct');
			expect(browse.typeOptions.maxValue).toBe(48);
			expect(browse.default).toBe(STORE_SUPPLIER_PAGE_SIZES.CATALOGUE_MAX);
			expect(STORE_SUPPLIER_PAGE_SIZES.CATALOGUE_MAX).toBe(48);
			const queue = property('limit', 'supplierOrder');
			expect(queue.typeOptions.maxValue).toBe(100);
			expect(queue.default).toBeLessThanOrEqual(100);
		});

		it('has no field that could hold a supplier credential', () => {
			const names = node.description.properties.map((p) => p.name.toLowerCase());
			expect(names.some((n) => /apikey|secret|password|credential|token/.test(n))).toBe(false);
		});
	});

	describe('Requests', () => {
		it('lists supplier orders needing review, one item per row, empty filters stripped', async () => {
			const { output, calls } = await run(
				{ resource: 'supplierOrder', operation: 'getMany', page: 1, limit: 20, filters: { needsReview: true, status: '' } },
				{ items: [{ _id: 'a' }, { _id: 'b' }], page: 1, pageSize: 20, total: 2 },
			);
			expect(calls[0].method).toBe('GET');
			expect(calls[0].url).toBe(`${BASE}/orders`);
			expect(calls[0].qs).toEqual({ needsReview: true, page: 1, pageSize: 20 });
			expect(output.map((item) => item.json._id)).toEqual(['a', 'b']);
		});

		it('browses the catalogue with a pageSize the api accepts on default settings', async () => {
			const node = new Posty5Store();
			const limitDefault = (node.description.properties.find(
				(p) => p.name === 'limit' && (p.displayOptions?.show?.resource as string[]).includes('supplierProduct'),
			) as any).default;
			const withDefault = await run(
				{ resource: 'supplierProduct', operation: 'getMany', integrationId: 'i1', page: 1, limit: limitDefault },
				{ items: [] },
			);
			expect(withDefault.calls[0].url).toBe(`${BASE}/i1/products`);
			expect(withDefault.calls[0].qs.pageSize).toBeLessThanOrEqual(48);
			// No limit parameter at all (the execute fallback) must stay inside the cap too.
			const withFallback = await run({ resource: 'supplierProduct', operation: 'getMany', integrationId: 'i1' }, { items: [] });
			expect(withFallback.calls[0].qs).toEqual({ page: 1, pageSize: 48 });
		});

		it('retries a supplier order by its id, without createdFrom', async () => {
			const { calls } = await run({ resource: 'supplierOrder', operation: 'retry', supplierOrderId: 'so1', acceptCost: true });
			expect(calls[0]).toEqual(expect.objectContaining({ method: 'POST', url: `${BASE}/orders/so1/retry`, body: { acceptCost: true } }));
		});

		it.each(['pay', 'cancel'])('%s posts to the supplier order route with an empty body', async (operation) => {
			const { calls } = await run({ resource: 'supplierOrder', operation, supplierOrderId: 'so1' });
			expect(calls[0].url).toBe(`${BASE}/orders/so1/${operation}`);
			expect(calls[0].body).toEqual({});
		});

		it('submits a part with its key encoded', async () => {
			const { calls } = await run({ resource: 'fulfilmentGroup', operation: 'submit', orderId: 'o1', groupKey: 'supplier:i1', payNow: true });
			expect(calls[0].url).toBe(`${BASE}/orders/o1/groups/supplier%3Ai1/submit`);
			expect(calls[0].body).toEqual({ payNow: true });
		});

		it('fulfils a part manually', async () => {
			const { calls } = await run({ resource: 'fulfilmentGroup', operation: 'fulfilManually', orderId: 'o1', groupKey: 'supplier:i1' });
			expect(calls[0].url).toBe(`${BASE}/orders/o1/groups/supplier%3Ai1/fulfil-manually`);
		});

		it('imports products from a comma list, with defaults', async () => {
			const { calls } = await run({
				resource: 'supplierProduct',
				operation: 'import',
				integrationId: 'i1',
				supplierProductIds: 'p1, p2',
				importOptions: { status: 'draft', tagNames: 'summer, cj', allowDuplicate: true },
			});
			expect(calls[0].url).toBe(`${BASE}/i1/import`);
			expect(calls[0].body).toEqual({
				items: [{ supplierProductId: 'p1' }, { supplierProductId: 'p2' }],
				defaults: { status: 'draft', tagNames: ['summer', 'cj'] },
				allowDuplicate: true,
			});
		});

		it('previews an import without allowDuplicate', async () => {
			const { calls } = await run({
				resource: 'supplierProduct',
				operation: 'previewImport',
				integrationId: 'i1',
				supplierProductIds: 'p1',
				importOptions: { allowDuplicate: true },
			});
			expect(calls[0].url).toBe(`${BASE}/i1/import/preview`);
			expect(calls[0].body).toEqual({ items: [{ supplierProductId: 'p1' }] });
		});

		it('maps the remaining supplier, product and link routes', async () => {
			const cases: [Record<string, any>, string, string][] = [
				[{ resource: 'supplier', operation: 'getCatalogue' }, 'GET', `${BASE}/catalogue`],
				[{ resource: 'supplier', operation: 'getMany' }, 'GET', BASE],
				[{ resource: 'supplier', operation: 'test', integrationId: 'i1' }, 'POST', `${BASE}/i1/test`],
				[{ resource: 'supplier', operation: 'getBalance', integrationId: 'i1' }, 'GET', `${BASE}/i1/balance`],
				[{ resource: 'supplierProduct', operation: 'get', integrationId: 'i1', supplierProductId: 'p/1' }, 'GET', `${BASE}/i1/products/p%2F1`],
				[{ resource: 'supplierProduct', operation: 'resolveUrl', integrationId: 'i1', url: 'https://x' }, 'POST', `${BASE}/i1/products/resolve-url`],
				[{ resource: 'supplierProduct', operation: 'getImportStatus', jobId: 'j1' }, 'GET', `${BASE}/imports/j1`],
				[{ resource: 'productLink', operation: 'getMany' }, 'GET', `${BASE}/links`],
				[{ resource: 'productLink', operation: 'sync', linkId: 'l1' }, 'POST', `${BASE}/links/l1/sync`],
				[{ resource: 'supplierOrder', operation: 'get', supplierOrderId: 'so1' }, 'GET', `${BASE}/orders/so1`],
			];
			for (const [parameters, method, url] of cases) {
				const { calls } = await run(parameters, { items: [] });
				expect([calls[0].method, calls[0].url]).toEqual([method, url]);
				if (method === 'POST') expect(calls[0].body).not.toHaveProperty('createdFrom');
			}
		});

		it('splits an order into one item per part with its supplier order attached', async () => {
			const order = {
				_id: 'o1',
				orderNumber: '1042',
				fulfilmentGroups: [
					{ key: 'merchant', kind: 'merchant', label: 'Shipped by the store', status: 'shipped' },
					{ key: 'supplier:i1', kind: 'thirdParty', label: 'Shipped by a partner', status: 'processing' },
				],
				supplierOrders: [{ _id: 'so1', fulfilmentGroupKey: 'supplier:i1', status: 'confirmed' }],
			};
			const { output, calls } = await run({ resource: 'order', operation: 'get', orderId: 'o1', splitParts: true }, order);
			expect(calls[0].url).toBe('https://api.posty5.com/api/store-orders/s1/o1');
			expect(output).toHaveLength(2);
			expect(output[0].json).toEqual(expect.objectContaining({ key: 'merchant', orderNumber: '1042', supplierOrder: null }));
			expect((output[1].json.supplierOrder as any)._id).toBe('so1');
		});

		it('lists orders needing attention and carries the cursor on the last row', async () => {
			const { output, calls } = await run(
				{ resource: 'order', operation: 'getMany', limit: 10, filters: { needsAttention: true } },
				{ items: [{ _id: 'a' }, { _id: 'b' }], pagination: { nextCursor: 'c2' } },
			);
			expect(calls[0].qs).toEqual({ needsAttention: true, pageSize: 10 });
			expect(output[1].json.nextCursor).toBe('c2');
			expect(output[0].json.nextCursor).toBeUndefined();
		});

		it('reads each item for its own parameters', async () => {
			const { calls } = await run(
				{ resource: 'supplierOrder', operation: 'get', supplierOrderId: 'so1' },
				{},
				[{ json: {} }, { json: {} }],
			);
			expect(calls).toHaveLength(2);
		});
	});

	describe('Errors', () => {
		it('returns the error per item with Continue On Fail', async () => {
			const node = new Posty5Store();
			const fns = createMockExecuteFunctions({ storeId: 's1', resource: 'supplier', operation: 'getMany' });
			(fns.helpers.httpRequest as jest.Mock).mockRejectedValue(new Error('boom'));
			(fns.continueOnFail as jest.Mock).mockReturnValue(true);
			const [output] = await node.execute.call(fns);
			expect(output[0].json.error).toContain('boom');
		});

		it('throws without Continue On Fail', async () => {
			const node = new Posty5Store();
			const fns = createMockExecuteFunctions({ storeId: 's1', resource: 'supplier', operation: 'getMany' });
			(fns.helpers.httpRequest as jest.Mock).mockRejectedValue(new Error('boom'));
			await expect(node.execute.call(fns)).rejects.toThrow('boom');
		});
	});

	describe('createdFrom stamp', () => {
		it('is still added for the existing nodes', async () => {
			const fns = createMockExecuteFunctions({ operation: 'create', url: 'https://posty5.com' }, undefined, { apiKey: 'k' }, { result: {} });
			await new Posty5ShortLink().execute.call(fns);
			const [options] = (fns.helpers.httpRequest as jest.Mock).mock.calls[0];
			expect(options.body.createdFrom).toBe('n8n');
		});
	});
});
