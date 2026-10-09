/**
 * Posty5 API Helper Functions
 * Utility functions for making API requests using n8n's native HTTP helpers
 */

import {
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	JsonObject,
	NodeApiError,
} from 'n8n-workflow';
import { POSTY5_API_BASE_URL, Posty5ClientConst, VERSIONED_WRITES } from './constants';
import type { IPosty5ApiError } from '../types/common';

export interface IApiRequestOptions {
	method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	endpoint: string;
	body?: any;
	qs?: any;
	/**
	 * Add `createdFrom: 'n8n'` to a POST body (the default). The store node turns
	 * it off for `/api/store-suppliers`: those bodies are validated by schemas that
	 * never declared the key, and a body should not carry what its route ignores.
	 */
	stampCreatedFrom?: boolean;
	/** Extra request headers (e.g. `Idempotency-Key`), merged over the fixed ones. */
	headers?: Record<string, string>;
	/**
	 * The document version the caller read (`__v`). Sent as `If-Match: "<v>"`
	 * (optimistic concurrency, D-5), and the answer's envelope `version` is
	 * copied onto the result as `__v` so the next step can chain it.
	 */
	version?: number;
	/** Return the whole `{ message, result, version }` envelope instead of `result`. */
	returnEnvelope?: boolean;
}

/**
 * Make an API request to Posty5 API using n8n's HTTP request helper
 * @param context - N8n execution context, or a `loadOptions` context (both carry `helpers.httpRequest`)
 * @param apiKey - Posty5 API key
 * @param options - Request options
 * @returns API response
 */
export async function makeApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	apiKey: string,
	options: IApiRequestOptions,
): Promise<any> {
	const baseUrl = POSTY5_API_BASE_URL;

	const requestOptions: IHttpRequestOptions = {
		method: options.method,
		url: `${baseUrl}${options.endpoint}`,
		headers: {
			'X-API-Key': apiKey,
			'Content-Type': 'application/json',
			[Posty5ClientConst.HEADER]: Posty5ClientConst.VALUE,
			...(typeof options.version === 'number'
				? { [VERSIONED_WRITES.IF_MATCH_HEADER]: `"${options.version}"` }
				: {}),
			...(options.headers || {}),
		},
		json: true,
	};

	if (options.body) {
		requestOptions.body = options.body;
	}

	// Add createdFrom to POST request bodies, unless the caller opts out
	if (options.method === 'POST' && options.stampCreatedFrom !== false) {
		requestOptions.body = { ...(requestOptions.body as Record<string, any>), createdFrom: 'n8n' };
	}

	if (options.qs) {
		requestOptions.qs = options.qs;
	}

	try {
		const response = await this.helpers.httpRequest(requestOptions);

		// Handle standard Posty5 API response format
		if (response && typeof response === 'object') {
			if (options.returnEnvelope) return response;
			// API returns { success, result, message } format
			if ('result' in response) {
				return withEnvelopeVersion(response.result, response.version, options.version);
			}
			return response;
		}

		return response;
	} catch (error: any) {
		throw toPosty5NodeApiError(this, error);
	}
}

/**
 * On a versioned write, the envelope's `version` becomes the result's `__v`
 * (a DELETE answers without one, so its result is returned as is).
 */
function withEnvelopeVersion(result: any, envelopeVersion: unknown, sentVersion?: number): any {
	if (typeof sentVersion !== 'number' || typeof envelopeVersion !== 'number') return result;
	if (!result || typeof result !== 'object' || Array.isArray(result)) return result;
	return { ...result, __v: envelopeVersion };
}

/**
 * The `NodeApiError` `makeApiRequest` throws. Its message stays
 * `Posty5 API Error: <message>` (except a version conflict, which says how to
 * fix it); `httpCode`, `apiMessage`, the API's `code` and, on a
 * `VERSION_CONFLICT`, `currentVersion` ride along. A context without
 * `getNode` (never in n8n) gets the plain error.
 */
export function toPosty5NodeApiError(
	context: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	error: any,
): IPosty5ApiError {
	const plain = toPosty5ApiError(error);
	if (typeof (context as any)?.getNode !== 'function') return plain;

	const message = plain.code === VERSIONED_WRITES.CONFLICT_CODE
		? VERSIONED_WRITES.CONFLICT_MESSAGE(plain.currentVersion)
		: plain.message;
	const apiError = new NodeApiError(
		context.getNode(),
		{ message, httpCode: plain.httpCode ?? null, code: plain.code ?? null } as JsonObject,
		{ message, ...(plain.httpCode ? { httpCode: plain.httpCode } : {}), description: plain.apiMessage },
	) as unknown as IPosty5ApiError;
	if (plain.httpCode) apiError.httpCode = plain.httpCode;
	if (plain.apiMessage) apiError.apiMessage = plain.apiMessage;
	if (plain.code) apiError.code = plain.code;
	if (plain.currentVersion !== undefined) apiError.currentVersion = plain.currentVersion;
	return apiError;
}

/**
 * The error `makeApiRequest` throws for a failed request. The API's message is
 * read from the answer: `response.data` is where n8n's `httpRequest` (axios)
 * puts the parsed body, `response.body` is the older request-library shape.
 * The HTTP status is kept as `httpCode` so a caller can map one status (the
 * analytics plan-gate 403) to a `NodeApiError` without parsing the message.
 */
export function toPosty5ApiError(error: any): IPosty5ApiError {
	const apiMessage: string | undefined = error?.response?.data?.message || error?.response?.body?.message || undefined;
	const errorMessage = apiMessage || error?.message || 'Unknown error';
	const apiError: IPosty5ApiError = new Error(`Posty5 API Error: ${errorMessage}`);
	const status = error?.response?.status ?? error?.response?.statusCode ?? error?.statusCode ?? error?.httpCode;
	if (status !== undefined && status !== null) apiError.httpCode = String(status);
	if (apiMessage) apiError.apiMessage = apiMessage;
	const body = error?.response?.data ?? error?.response?.body;
	if (body && typeof body === 'object') {
		if (typeof body.code === 'string') apiError.code = body.code;
		const currentVersion = body.result?.currentVersion ?? body.currentVersion;
		if (typeof currentVersion === 'number') apiError.currentVersion = currentVersion;
	}
	return apiError;
}

/**
 * Make a paginated list request
 * @param context - N8n execution context
 * @param apiKey - Posty5 API key
 * @param endpoint - API endpoint
 * @param filters - Filter parameters
 * @param pagination - Pagination parameters
 * @returns Paginated response
 */
export async function makePaginatedRequest(
	this: IExecuteFunctions,
	apiKey: string,
	endpoint: string,
	filters: any = {},
	pagination: { page?: number; pageSize?: number } = {},
): Promise<any> {
	return makeApiRequest.call(this, apiKey, {
		method: 'GET',
		endpoint,
		qs: {
			...filters,
			...pagination,
		},
	});
}

/**
 * Upload file to a pre-signed URL (direct upload to cloud storage)
 * @param uploadUrl - Pre-signed URL to upload to
 * @param fileBuffer - File buffer to upload
 * @returns Upload result
 */
export async function uploadFile(
	this: IExecuteFunctions,
	uploadUrl: string,
	fileBuffer: Buffer,
): Promise<any> {
	const requestOptions: IHttpRequestOptions = {
		method: 'PUT',
		url: uploadUrl,
		body: fileBuffer,
		headers: {
			'Content-Type': 'application/octet-stream',
		},
		returnFullResponse: true,
	};

	try {
		const response = await this.helpers.httpRequest(requestOptions);
		return response;
	} catch (error: any) {
		const errorMessage = error.response?.body?.message || error.message || 'Unknown error';
		throw new Error(`File Upload Error: ${errorMessage}`);
	}
}
