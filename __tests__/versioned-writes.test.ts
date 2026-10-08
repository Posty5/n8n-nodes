import { makeApiRequest } from '../utils/api.helpers';
import { VERSIONED_WRITES, Posty5ClientConst } from '../utils/constants';
import { resolveWriteVersion, buildVersionedWriteProperties } from '../utils/versioned-write.helpers';
import { createMockExecuteFunctions } from './setup';

const withTypeVersion = (mock: any, typeVersion: number) => {
	mock.getNode.mockReturnValue({ name: 'Posty5 Test Node', type: 'test', typeVersion });
	return mock;
};

describe('makeApiRequest — versioned writes', () => {
	it('sends If-Match from version and the client header, and maps the envelope version to __v', async () => {
		const mock = createMockExecuteFunctions({}, [{ json: {} }], { apiKey: 'k' }, { result: { _id: 'a', __v: 4 }, version: 5 });
		const out = await makeApiRequest.call(mock, 'k', { method: 'PUT', endpoint: '/api/short-link/a', body: {}, version: 4 });
		const req = (mock.helpers.httpRequest as jest.Mock).mock.calls[0][0];
		expect(req.headers['If-Match']).toBe('"4"');
		expect(req.headers[Posty5ClientConst.HEADER]).toBe(Posty5ClientConst.VALUE);
		expect(out.__v).toBe(5);
	});

	it('throws NodeApiError with httpCode, code and currentVersion on a conflict', async () => {
		const mock = createMockExecuteFunctions();
		(mock.helpers.httpRequest as jest.Mock).mockRejectedValue({
			response: { status: 409, data: { code: 'VERSION_CONFLICT', message: 'conflict', result: { _id: 'a', currentVersion: 7 } } },
		});
		await expect(makeApiRequest.call(mock, 'k', { method: 'DELETE', endpoint: '/x', version: 3 })).rejects.toMatchObject({
			name: 'NodeApiError',
			httpCode: '409',
			code: 'VERSION_CONFLICT',
			currentVersion: 7,
			message: VERSIONED_WRITES.CONFLICT_MESSAGE(7),
		});
	});
});

describe('resolveWriteVersion', () => {
	it('v2 uses the Version field', async () => {
		const mock = withTypeVersion(createMockExecuteFunctions({ expectedVersion: 6 }), 2);
		await expect(resolveWriteVersion(mock, 'k', 0, '/x')).resolves.toBe(6);
		expect(mock.helpers.httpRequest).not.toHaveBeenCalled();
	});

	it('v2 fails on an empty Version by default', async () => {
		const mock = withTypeVersion(createMockExecuteFunctions({ expectedVersion: '' }), 2);
		await expect(resolveWriteVersion(mock, 'k', 0, '/x')).rejects.toThrow(VERSIONED_WRITES.UNKNOWN_VERSION_MESSAGE);
	});

	it('v2 Use Latest reads the item', async () => {
		const mock = withTypeVersion(
			createMockExecuteFunctions({ versionOptions: { onUnknownVersion: 'useLatest' } }, [{ json: {} }], { apiKey: 'k' }, { result: { __v: 9 } }),
			2,
		);
		await expect(resolveWriteVersion(mock, 'k', 0, '/x')).resolves.toBe(9);
		expect((mock.helpers.httpRequest as jest.Mock).mock.calls[0][0].method).toBe('GET');
	});

	it('v1 reads the item (legacy last write wins)', async () => {
		const mock = createMockExecuteFunctions({}, [{ json: {} }], { apiKey: 'k' }, { result: { __v: 2 } });
		await expect(resolveWriteVersion(mock, 'k', 0, '/x')).resolves.toBe(2);
	});

	it('the Version field is shown on v2 only', () => {
		const [field] = buildVersionedWriteProperties(['update']);
		expect(field.default).toBe('={{ $json.__v }}');
		expect(field.displayOptions?.show?.['@version']).toEqual([2]);
	});
});
