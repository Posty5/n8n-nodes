/**
 * Posty5 API Helper Functions
 * Utility functions for making API requests using n8n's native HTTP helpers
 */

import { IExecuteFunctions, IHookFunctions, IHttpRequestOptions, ILoadOptionsFunctions } from 'n8n-workflow';
import { POSTY5_API_BASE_URL, Posty5ClientConst } from './constants';
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
			// API returns { success, result, message } format
			if ('result' in response) {
				return response.result;
			}
			return response;
		}

		return response;
	} catch (error: any) {
		throw toPosty5ApiError(error);
	}
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
