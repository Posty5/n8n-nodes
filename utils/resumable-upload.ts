import { IExecuteFunctions } from 'n8n-workflow';

/**
 * Resumable uploads (tus 1.0.0) for large media.
 *
 * A signed PUT is all-or-nothing: a dropped connection at 90% of an hour-long
 * video starts the transfer again from zero. The API offers the same
 * destination as a resumable transfer, and this is the client for it.
 *
 * The protocol subset needed is small — create, patch, head — so it goes
 * through n8n's own `httpRequest` helper rather than adding a tus dependency to
 * the node package. That also means the transfer inherits whatever proxy and
 * certificate configuration the n8n instance already has.
 *
 * NOTE: n8n hands binary data to a node as a Buffer, so the whole file is in
 * memory before this is called. Chunking here bounds what a dropped connection
 * costs, not what the workflow allocates.
 */

const TUS_VERSION = '1.0.0';

/**
 * 8MiB matches the server's multipart part size, so one PATCH becomes one R2
 * part with no server-side re-buffering.
 */
export const DEFAULT_CHUNK_SIZE = 8 * 1024 * 1024;

/** Backoff between chunk retries. The chunk is retried, never the whole file. */
const RETRY_DELAYS = [0, 1000, 3000, 5000, 10000];

/** Consecutive rounds ending at the same offset before the transfer is abandoned. */
const MAX_CONSECUTIVE_STALLS = 3;

/** One upload destination the API authorized. */
export interface IUploadTarget {
	fileURL?: string;
	uploadFileURL?: string;
	bucketFilePath?: string;
	/** Absolute tus endpoint, present only when the resumable service is configured. */
	tusEndpoint?: string;
	/** Signed capability naming this destination, sent as tus metadata. */
	ticket?: string;
	ticketExpiresAt?: string;
	maxSize?: number;
}

export interface IResumableUploadOptions {
	/** Bytes per PATCH. Defaults to the server's part size. */
	chunkSize?: number;
	/** Content type stamped on the finished object. */
	contentType?: string;
	/** Carried for diagnostics only — the key lives inside the ticket. */
	fileName?: string;
}

/**
 * Whether this target can be uploaded resumably. A server without the resumable
 * service omits these fields, and callers fall back to the signed PUT.
 */
export function supportsResumableUpload(target: IUploadTarget): boolean {
	return !!target.tusEndpoint && !!target.ticket;
}

/** tus metadata is `key base64value` pairs, comma separated. */
function encodeMetadata(pairs: Record<string, string>): string {
	return Object.entries(pairs)
		.filter(([, value]) => !!value)
		.map(([key, value]) => `${key} ${Buffer.from(value, 'utf8').toString('base64')}`)
		.join(',');
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function readOffset(headers: any, fallback: number): number {
	// Header casing varies by transport, so check both.
	const raw = headers?.['upload-offset'] ?? headers?.['Upload-Offset'];
	const parsed = Number(raw);
	return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Upload a buffer resumably and return the public URL it lands at.
 *
 * `target.fileURL` came back with the ticket, so the final URL is known up
 * front and there is no completion body to parse.
 */
export async function uploadResumable(
	this: IExecuteFunctions,
	target: IUploadTarget,
	data: Buffer,
	options: IResumableUploadOptions = {},
): Promise<string> {
	const {
		chunkSize = DEFAULT_CHUNK_SIZE,
		contentType = 'application/octet-stream',
		fileName = 'upload',
	} = options;

	if (!supportsResumableUpload(target)) {
		throw new Error('This upload target does not support resumable uploads.');
	}
	if (target.maxSize && data.length > target.maxSize) {
		const limitMb = Math.round(target.maxSize / (1024 * 1024));
		throw new Error(`This file is larger than the ${limitMb}MB limit.`);
	}

	// ── Create ────────────────────────────────────────────────────────────
	const createResponse: any = await this.helpers.httpRequest({
		method: 'POST',
		url: target.tusEndpoint as string,
		headers: {
			'Tus-Resumable': TUS_VERSION,
			'Upload-Length': String(data.length),
			'Upload-Metadata': encodeMetadata({
				ticket: target.ticket as string,
				filename: fileName,
				filetype: contentType,
			}),
		},
		returnFullResponse: true,
	});

	const location =
		createResponse?.headers?.location ?? createResponse?.headers?.Location;
	if (!location) {
		throw new Error('Upload was created but the server returned no Location header.');
	}

	// A tus server may answer with a relative Location; resolve it against the
	// endpoint so a gateway-relative path still points somewhere usable.
	const uploadUrl = new URL(String(location), target.tusEndpoint as string).toString();

	// ── Transfer ──────────────────────────────────────────────────────────
	let offset = 0;
	let stalls = 0;

	while (offset < data.length) {
		const end = Math.min(offset + chunkSize, data.length);
		const next = await patchChunk.call(this, uploadUrl, data.subarray(offset, end), offset);

		if (next <= offset) {
			// A round ending where it started is not automatically fatal: a
			// spurious 409 re-syncs to the offset we already had, and retrying
			// that chunk is the right recovery. Only repeated stalls give up.
			if (++stalls >= MAX_CONSECUTIVE_STALLS) {
				throw new Error('The upload stopped making progress and was abandoned.');
			}
			continue;
		}

		stalls = 0;
		offset = next;
	}

	return target.fileURL as string;
}

/**
 * Send one chunk, retrying the chunk itself on a transient failure.
 *
 * Returns the server's new offset, which is authoritative — a chunk can be
 * partially accepted, and trusting our own arithmetic would corrupt everything
 * after it.
 */
async function patchChunk(
	this: IExecuteFunctions,
	uploadUrl: string,
	chunk: Buffer,
	offset: number,
): Promise<number> {
	let lastError: Error | undefined;

	for (const delay of RETRY_DELAYS) {
		if (delay) await wait(delay);

		try {
			const response: any = await this.helpers.httpRequest({
				method: 'PATCH',
				url: uploadUrl,
				headers: {
					'Tus-Resumable': TUS_VERSION,
					'Upload-Offset': String(offset),
					'Content-Type': 'application/offset+octet-stream',
				},
				body: chunk,
				returnFullResponse: true,
			});

			return readOffset(response?.headers, offset + chunk.length);
		} catch (error: any) {
			const status = error?.response?.status ?? error?.httpCode ?? error?.statusCode;

			// 409 means our offset disagrees with the server's. Re-syncing is the
			// correct recovery, not a retry at the same wrong offset.
			if (Number(status) === 409) {
				return await headOffset.call(this, uploadUrl);
			}

			// Any other 4xx is a decision, not a blip — retrying an expired
			// ticket or an oversized file only wastes the workflow's time.
			if (Number(status) >= 400 && Number(status) < 500) {
				const detail = error?.response?.body?.message || error?.message || '';
				throw new Error(`Upload rejected (${status}): ${detail}`);
			}

			lastError = error;
		}
	}

	throw lastError ?? new Error('Upload failed');
}

/** Ask the server how much of this upload it already holds. */
async function headOffset(this: IExecuteFunctions, uploadUrl: string): Promise<number> {
	const response: any = await this.helpers.httpRequest({
		method: 'HEAD',
		url: uploadUrl,
		headers: { 'Tus-Resumable': TUS_VERSION },
		returnFullResponse: true,
	});

	return readOffset(response?.headers, 0);
}
