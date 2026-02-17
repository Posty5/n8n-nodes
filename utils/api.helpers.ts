/**
 * Posty5 API Helper Functions
 * Utility functions for making API requests using n8n's native HTTP helpers
 */

import { IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';
import { POSTY5_API_BASE_URL } from './constants';

export interface IApiRequestOptions {
	method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	endpoint: string;
	body?: any;
	qs?: any;
}

/**
 * Make an API request to Posty5 API using n8n's HTTP request helper
 * @param context - N8n execution context
 * @param apiKey - Posty5 API key
 * @param options - Request options
 * @returns API response
 */
export async function makeApiRequest(
	this: IExecuteFunctions,
	apiKey: string,
	options: IApiRequestOptions,
): Promise<any> {
	const baseUrl = process.env.POSTY5_BASE_URL || POSTY5_API_BASE_URL;

	const requestOptions: IHttpRequestOptions = {
		method: options.method,
		url: `${baseUrl}${options.endpoint}`,
		headers: {
			'X-API-Key': apiKey,
			'Content-Type': 'application/json',
		},
		json: true,
	};

	if (options.body) {
		requestOptions.body = options.body;
	}

	// Add createdFrom to all POST request bodies
	if (options.method === 'POST') {
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
		// Enhance error message with API details
		const errorMessage = error.response?.body?.message || error.message || 'Unknown error';
		throw new Error(`Posty5 API Error: ${errorMessage}`);
	}
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
