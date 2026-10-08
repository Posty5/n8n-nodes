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

/**
 * The Additional Fields the Short Link and QR Code nodes share, as n8n hands
 * them over. A key is present only when the user added that field; on Update a
 * present key is what the user wants stored.
 */
export interface ILinkToolAdditionalFields {
	tag?: string;
	refId?: string;
	isEnableLandingPage?: boolean;
	pageTitle?: string;
	pageDescription?: string;
	/** Deprecated (≤ 4.4.0 put the template here); read only when Template is empty. */
	templateId?: string;
}

/** The stored page info a GET returns (it may carry read-only keys the write schemas refuse). */
export interface ILinkToolStoredPageInfo {
	title?: string | null;
	description?: string | null;
	descriptionIsHtmlFile?: boolean | null;
}

/** What a fetch-then-put Update carries over from `GET /:id` when the user left it alone. */
export interface ILinkToolStoredFields {
	name?: string | null;
	templateId?: string | null;
	templateType?: string | null;
	refId?: string | null;
	tag?: string | null;
	isEnableLandingPage?: boolean | null;
	pageInfo?: ILinkToolStoredPageInfo | null;
	createdFrom?: string | null;
}

/** The page info both write schemas accept: `title`, `description`, `descriptionIsHtmlFile`. */
export interface ILinkToolPageInfo {
	title?: string;
	description?: string;
	descriptionIsHtmlFile?: boolean;
}

/** The body keys the two nodes build the same way. */
export interface ILinkToolCommonBody {
	tag?: string;
	refId?: string;
	templateType?: string;
	createdFrom?: string;
	isEnableLandingPage?: boolean;
	pageInfo?: ILinkToolPageInfo;
}

/**
 * The error `makeApiRequest` throws. Its message stays
 * `Posty5 API Error: <message>`; the HTTP status and the API's own message ride
 * along so an operation can map a status (e.g. the plan-gate 403) without
 * parsing the text.
 */
export interface IPosty5ApiError extends Error {
	/** HTTP status as a string (`'403'`), when the request got an answer. */
	httpCode?: string;
	/** The API's `message`, unprefixed, when the answer carried one. */
	apiMessage?: string;
	/** The API's stable error `code` (e.g. `VERSION_CONFLICT`), when the answer carried one. */
	code?: string;
	/** On a `VERSION_CONFLICT`, the document's stored version. */
	currentVersion?: number;
}
