/**
 * Common Types for Posty5 N8N Nodes
 * Shared interfaces and types used across multiple nodes
 */

/**
 * Standard API response wrapper
 */
export interface IResponse<T> {
	message: string;
	isSuccess?: boolean;
	noMoreOfResult?: boolean;
	result?: T;
	exeption?: any;
}

/**
 * Pagination parameters
 */
export interface IPaginationParams {
	page?: number;
	pageSize?: number;
}

/**
 * Paginated response
 */
export interface IPaginationResponse<T> {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

/**
 * User reference (populated in responses)
 */
export interface IUser {
	_id: string;
	fullName: string;
	email: string;
}

/**
 * API Key reference (populated in responses)
 */
export interface IApiKey {
	_id: string;
	name: string;
	key: string;
}

/**
 * Delete response
 */
export interface IDeleteResponse {
	message: string;
}

/**
 * Created from sources
 */
export type CreatedFromType =
	| 'dashboard'
	| 'npmPackage'
	| 'dotnetPackage'
	| 'n8n'
	| 'zapier'
	| 'api';
