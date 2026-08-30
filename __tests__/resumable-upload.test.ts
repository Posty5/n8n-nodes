import {
	DEFAULT_CHUNK_SIZE,
	supportsResumableUpload,
	uploadResumable,
} from '../utils/resumable-upload';

/**
 * tus helper — protocol-level tests against a mocked httpRequest.
 *
 * These assert the wire behaviour the server requires: the creation POST's
 * headers and base64 metadata, the PATCH loop's offsets, offset re-sync on
 * conflict, and the refusal to retry a 4xx.
 */
describe('resumable upload (tus)', () => {
	const TARGET = {
		fileURL: 'https://cdn.example.com/v.mp4',
		uploadFileURL: 'https://upload.example.com/v?sig=x',
		bucketFilePath: 'k/v.mp4',
		tusEndpoint: 'https://api.example.com/api/uploads/tus',
		ticket: 'payload.signature',
		maxSize: 1024 * 1024 * 1024,
	};
	const UPLOAD_URL = 'https://api.example.com/api/uploads/tus/abc-123';

	type Req = { method: string; url: string; headers: Record<string, string>; bodyLength: number };

	/** Drives a scripted tus server through n8n's httpRequest helper. */
	function mockContext(opts: { total: number; startOffset?: number; patch?: (i: number) => number | undefined } = { total: 0 }) {
		const requests: Req[] = [];
		let served = opts.startOffset ?? 0;
		let patchIndex = 0;

		const httpRequest = jest.fn(async (o: any) => {
			requests.push({
				method: o.method,
				url: o.url,
				headers: o.headers || {},
				bodyLength: o.body?.length ?? 0,
			});

			if (o.method === 'POST') {
				return { statusCode: 201, headers: { location: UPLOAD_URL } };
			}

			if (o.method === 'HEAD') {
				return { statusCode: 200, headers: { 'upload-offset': String(served) } };
			}

			const status = opts.patch?.(patchIndex++);
			if (status) {
				const err: any = new Error('refused');
				err.response = { status, body: { message: 'refused' } };
				throw err;
			}

			served = Math.min(served + (o.body?.length ?? 0), opts.total);
			return { statusCode: 204, headers: { 'upload-offset': String(served) } };
		});

		return { ctx: { helpers: { httpRequest } } as any, requests, served: () => served };
	}

	describe('supportsResumableUpload', () => {
		it('is true only when the server offered both the endpoint and a ticket', () => {
			expect(supportsResumableUpload(TARGET)).toBe(true);
			expect(supportsResumableUpload({ ...TARGET, ticket: undefined })).toBe(false);
			expect(supportsResumableUpload({ ...TARGET, tusEndpoint: undefined })).toBe(false);
		});
	});

	describe('creation', () => {
		it('sends the tus version, the length and the ticket as base64 metadata', async () => {
			const { ctx, requests } = mockContext({ total: 100 });

			await uploadResumable.call(ctx, TARGET, Buffer.alloc(100), {
				chunkSize: 100,
				contentType: 'video/mp4',
				fileName: 'recording.mp4',
			});

			const create = requests[0];
			expect(create.method).toBe('POST');
			expect(create.url).toBe(TARGET.tusEndpoint);
			expect(create.headers['Tus-Resumable']).toBe('1.0.0');
			expect(create.headers['Upload-Length']).toBe('100');

			const pairs = create.headers['Upload-Metadata'].split(',');
			const ticket = pairs.find((p) => p.startsWith('ticket '))!.split(' ')[1];
			expect(Buffer.from(ticket, 'base64').toString('utf8')).toBe(TARGET.ticket);

			const name = pairs.find((p) => p.startsWith('filename '))!.split(' ')[1];
			expect(Buffer.from(name, 'base64').toString('utf8')).toBe('recording.mp4');
		});

		it('refuses a file over the target size before contacting the server', async () => {
			const { ctx, requests } = mockContext({ total: 10 });
			await expect(
				uploadResumable.call(ctx, { ...TARGET, maxSize: 5 }, Buffer.alloc(10)),
			).rejects.toThrow('larger than');
			expect(requests).toHaveLength(0);
		});

		it('refuses a target with no resumable support', async () => {
			const { ctx } = mockContext({ total: 10 });
			await expect(
				uploadResumable.call(ctx, { ...TARGET, ticket: undefined }, Buffer.alloc(10)),
			).rejects.toThrow('does not support resumable');
		});
	});

	describe('the PATCH loop', () => {
		it('sends the file in chunks at the right offsets', async () => {
			const { ctx, requests } = mockContext({ total: 25 });

			await uploadResumable.call(ctx, TARGET, Buffer.alloc(25), { chunkSize: 10 });

			const patches = requests.filter((r) => r.method === 'PATCH');
			expect(patches.map((p) => p.headers['Upload-Offset'])).toEqual(['0', '10', '20']);
			expect(patches.map((p) => p.bodyLength)).toEqual([10, 10, 5]);
			for (const p of patches) {
				expect(p.headers['Content-Type']).toBe('application/offset+octet-stream');
				expect(p.url).toBe(UPLOAD_URL);
			}
		});

		it('defaults to the server’s 8MiB part size', () => {
			expect(DEFAULT_CHUNK_SIZE).toBe(8 * 1024 * 1024);
		});

		it('resolves with the URL the file will be served from', async () => {
			const { ctx } = mockContext({ total: 10 });
			await expect(
				uploadResumable.call(ctx, TARGET, Buffer.alloc(10), { chunkSize: 10 }),
			).resolves.toBe(TARGET.fileURL);
		});

		it('re-syncs from the server when the offset conflicts', async () => {
			const { ctx, requests } = mockContext({ total: 20, patch: (i) => (i === 0 ? 409 : undefined) });

			await uploadResumable.call(ctx, TARGET, Buffer.alloc(20), { chunkSize: 10 });

			expect(requests.filter((r) => r.method === 'HEAD').length).toBeGreaterThanOrEqual(1);
		});

		it('does not retry a 4xx — an expired ticket will never succeed', async () => {
			const { ctx, requests } = mockContext({ total: 10, patch: () => 403 });

			await expect(
				uploadResumable.call(ctx, TARGET, Buffer.alloc(10), { chunkSize: 10 }),
			).rejects.toThrow('Upload rejected (403)');

			expect(requests.filter((r) => r.method === 'PATCH')).toHaveLength(1);
		});
	});
});
