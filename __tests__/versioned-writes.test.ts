import { makeApiRequest } from '../utils/api.helpers';
import { VERSIONED_WRITES, Posty5ClientConst } from '../utils/constants';
import { resolveWriteVersion, buildVersionedWriteProperties } from '../utils/versioned-write.helpers';
import { createMockExecuteFunctions } from './setup';
import type { INodeTypeDescription } from 'n8n-workflow';
import { Posty5ShortLink } from '../nodes/Posty5ShortLink/Posty5ShortLink.node';
import { Posty5QrCode } from '../nodes/Posty5QrCode/Posty5QrCode.node';
import { Posty5HtmlHosting } from '../nodes/Posty5HtmlHosting/Posty5HtmlHosting.node';
import { Posty5FormSubmission } from '../nodes/Posty5FormSubmission/Posty5FormSubmission.node';
import { Posty5SocialPublisherPost } from '../nodes/Posty5SocialPublisherPost/Posty5SocialPublisherPost.node';

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
		const field = buildVersionedWriteProperties(['update']).find((p) => p.name === VERSIONED_WRITES.VERSION_PARAMETER)!;
		expect(field.default).toBe('={{ $json.__v }}');
		expect(field.required).toBe(true);
		expect(field.displayOptions?.show?.['@version']).toEqual([2]);
	});

	it('a stored item is reused: no second read, even without __v', async () => {
		const mock = createMockExecuteFunctions();
		await expect(resolveWriteVersion(mock, 'k', 0, '/x', { _id: 'a', __v: 3 })).resolves.toBe(3);
		await expect(resolveWriteVersion(mock, 'k', 0, '/x', { _id: 'a' })).resolves.toBeUndefined();
		expect(mock.helpers.httpRequest).not.toHaveBeenCalled();
	});
});

// The tus upload keeps its own 409 meaning (offset mismatch): it does not go
// through makeApiRequest, see `resumable-upload.test.ts` ("re-syncs on 409").

type NodeCtor = new () => { description: INodeTypeDescription; execute: (this: any) => Promise<any> };

const VERSIONED_NODES: Array<{ name: string; Node: NodeCtor; writeOps: string[] }> = [
	{ name: 'ShortLink', Node: Posty5ShortLink, writeOps: ['update', 'delete', 'setRules', 'updateCampaign', 'deleteCampaign'] },
	{ name: 'QrCode', Node: Posty5QrCode, writeOps: ['update', 'delete'] },
	{ name: 'HtmlHosting', Node: Posty5HtmlHosting, writeOps: ['updateFromFile', 'updateFromGithub', 'delete'] },
	{ name: 'FormSubmission', Node: Posty5FormSubmission, writeOps: ['changeStatus'] },
	{ name: 'SocialPublisherPost', Node: Posty5SocialPublisherPost, writeOps: ['reschedulePost', 'deletePost'] },
];

/** The property names a node shows at a type version (the `@version` rule only). */
function namesAtVersion(description: INodeTypeDescription, version: number): string[] {
	return description.properties
		.filter((p) => {
			const shown = p.displayOptions?.show?.['@version'] as number[] | undefined;
			return !shown || shown.includes(version);
		})
		.filter((p) => p.type !== 'notice')
		.map((p) => p.name);
}

describe.each(VERSIONED_NODES)('$name node versions', ({ Node, writeOps }) => {
	const description = new Node().description;

	it('is versioned [1, 2] with 2 as the default', () => {
		expect(description.version).toEqual([1, 2]);
		expect(description.defaultVersion).toBe(2);
	});

	it('v2 shows Version and Version Options on exactly the write operations', () => {
		const field = description.properties.find((p) => p.name === VERSIONED_WRITES.VERSION_PARAMETER)!;
		expect(field.displayOptions?.show?.operation).toEqual(writeOps);
		expect(namesAtVersion(description, 2)).toEqual(
			expect.arrayContaining([VERSIONED_WRITES.VERSION_PARAMETER, VERSIONED_WRITES.OPTIONS_PARAMETER]),
		);
	});

	it('v1 shows no new input field, only the legacy notice', () => {
		const v1 = namesAtVersion(description, 1);
		expect(v1).not.toContain(VERSIONED_WRITES.VERSION_PARAMETER);
		expect(v1).not.toContain(VERSIONED_WRITES.OPTIONS_PARAMETER);
		const notice = description.properties.find((p) => p.name === VERSIONED_WRITES.V1_NOTICE_PARAMETER)!;
		expect(notice.type).toBe('notice');
		expect(notice.displayOptions?.show?.['@version']).toEqual([1]);
	});
});

describe('v2 writes', () => {
	const requests = (mock: any) => (mock.helpers.httpRequest as jest.Mock).mock.calls.map(([req]) => req);

	it('ShortLink delete sends the Version field as If-Match, with no read', async () => {
		const mock = withTypeVersion(
			createMockExecuteFunctions({ operation: 'delete', shortLinkId: 'sl1', expectedVersion: 7 }, [{ json: {} }], { apiKey: 'k' }, { result: {} }),
			2,
		);
		await new Posty5ShortLink().execute.call(mock);
		const calls = requests(mock);
		expect(calls).toHaveLength(1);
		expect(calls[0].method).toBe('DELETE');
		expect(calls[0].headers['If-Match']).toBe('"7"');
	});

	it('QrCode delete sends the Version field as If-Match', async () => {
		const mock = withTypeVersion(
			createMockExecuteFunctions({ operation: 'delete', qrCodeId: 'qr1', expectedVersion: '2' }, [{ json: {} }], { apiKey: 'k' }, { result: {} }),
			2,
		);
		await new Posty5QrCode().execute.call(mock);
		expect(requests(mock).map((r: any) => r.headers['If-Match'])).toEqual(['"2"']);
	});

	it('FormSubmission status fails on an empty Version before any request', async () => {
		const mock = withTypeVersion(
			createMockExecuteFunctions({ operation: 'changeStatus', submissionId: 'fs1', status: 'approved', expectedVersion: '' }),
			2,
		);
		await expect(new Posty5FormSubmission().execute.call(mock)).rejects.toThrow(VERSIONED_WRITES.UNKNOWN_VERSION_MESSAGE);
		expect(mock.helpers.httpRequest).not.toHaveBeenCalled();
	});

	it('HtmlHosting delete with Use Latest reads the page, then deletes with its __v', async () => {
		const mock = withTypeVersion(
			createMockExecuteFunctions(
				{ operation: 'delete', htmlHostingId: 'hh1', expectedVersion: '', versionOptions: { onUnknownVersion: 'useLatest' } },
				[{ json: {} }],
				{ apiKey: 'k' },
				{ result: {} },
			),
			2,
		);
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce({ result: { _id: 'hh1', __v: 11 } });
		await new Posty5HtmlHosting().execute.call(mock);
		const [read, del] = requests(mock);
		expect(read.method).toBe('GET');
		expect(read.url).toMatch(/\/api\/html-hosting\/hh1$/);
		expect(del.method).toBe('DELETE');
		expect(del.headers['If-Match']).toBe('"11"');
	});

	it('SocialPublisherPost reschedule with Use Latest reads /status, then PUTs with its __v', async () => {
		const mock = withTypeVersion(
			createMockExecuteFunctions(
				{
					operation: 'reschedulePost',
					reschedulePostId: 'p1',
					rescheduleWhen: 'now',
					rescheduleCaption: '',
					expectedVersion: '',
					versionOptions: { onUnknownVersion: 'useLatest' },
				},
				[{ json: {} }],
				{ apiKey: 'k' },
				{ result: { _id: 'p1' }, version: 5 },
			),
			2,
		);
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce({ result: { _id: 'p1', __v: 4 } });
		const out = await new Posty5SocialPublisherPost().execute.call(mock);
		const [read, put] = requests(mock);
		expect(read.url).toMatch(/\/api\/social-publisher-post\/p1\/status$/);
		expect(put.method).toBe('PUT');
		expect(put.headers['If-Match']).toBe('"4"');
		// The answer's envelope version is the next step's __v.
		expect(out[0][0].json.__v).toBe(5);
	});

	it('HtmlHosting file update carries the new version onto the returned details', async () => {
		const mock = withTypeVersion(
			createMockExecuteFunctions(
				{ operation: 'updateFromFile', htmlHostingId: 'hh1', name: 'P', fileName: 'index.html', htmlFile: 'data', expectedVersion: 3, additionalFields: {} },
				[{ json: {} }],
				{ apiKey: 'k' },
			),
			2,
		);
		(mock.helpers.httpRequest as jest.Mock)
			.mockResolvedValueOnce({ result: { details: { _id: 'hh1' } }, version: 4 })
			.mockResolvedValueOnce({});
		const out = await new Posty5HtmlHosting().execute.call(mock);
		expect(requests(mock)[0].headers['If-Match']).toBe('"3"');
		expect(out[0][0].json).toEqual({ _id: 'hh1', __v: 4 });
	});
});
