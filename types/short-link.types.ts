/**
 * Short Link Types for Posty5 N8N Nodes
 * Type definitions for Short Link operations
 */

import { ILinkToolAdditionalFields, IPaginationResponse } from './common';
import type { IShortLinkControlBody, IShortLinkControlFields } from './short-link-controls.types';

/**
 * The Short Link node's Additional Fields: the shared ones plus the device
 * destinations and, on Update, a new destination URL.
 */
export interface IShortLinkAdditionalFields extends ILinkToolAdditionalFields, IShortLinkControlFields {
	/** Update only: a new destination. Left out, the stored one is sent. */
	baseUrl?: string;
	androidUrl?: string;
	iosUrl?: string;
}

/** The Short Link node's List filters. */
export interface IShortLinkListFilters {
	tag?: string;
	/** Comma-separated. */
	tags?: string;
	campaignId?: string;
	refId?: string;
	/** Matched against the name only. */
	search?: string;
	/** "Destination URL Contains". */
	baseUrl?: string;
	isEnableLandingPage?: boolean;
}

/** The device destinations the node sends (only the keys it decided to send). */
export interface IShortLinkDeepLinks {
	androidUrl?: string;
	iosUrl?: string;
}

/**
 * Short link status type
 */
export type ShortLinkStatusType = 'new' | 'pending' | 'rejected' | 'approved';

/**
 * Preview reason (moderation score)
 */
export interface IPreviewReason {
	category: string;
	score: number;
}

/**
 * QR Code template information
 */
export interface IQRCodeTemplate {
	_id: string;
	name?: string;
	numberOfSubQrCodes?: number;
	numberOfSubShortLinks?: number;
	qrCodeDownloadURL?: string;
}

/**
 * Short link metadata information
 */
export interface IShortLinkMetaData {
	image?: string;
	title?: string;
	description?: string;
}

/**
 * Page info response
 */
export interface IPageInfoResponse {
	title?: string | null;
	description?: string | null;
	descriptionIsHtmlFile?: boolean | null;
	/** Read-only (taken from the target page); the update schema refuses it. */
	image?: string | null;
}

/**
 * Short link response interface
 */
export interface IShortLinkResponse {
	_id: string;
	shorterLink: string;
	shortLinkId: string;
	name?: string;
	baseUrl?: string;
	status: ShortLinkStatusType;
	refId?: string;
	tag?: string;
	numberOfVisitors: number;
	numberOfReports?: number;
	lastVisitorDate?: string;
	createdAt?: string;
	updatedAt?: string;
	templateId?: string;
	qrCodeTemplateName?: string;
	isEnableLandingPage?: boolean;
	pageInfo?: IPageInfoResponse;
	qrCodeLandingPageURL: string;
	qrCodeDownloadURL: string;
}

/**
 * Short link full details response (from GET by ID)
 */
export interface IShortLinkFullDetailsResponse extends IShortLinkResponse {
	androidUrl?: string;
	iosUrl?: string;
	numberOfCreated?: number;
	templateType?: string;
	template?: IQRCodeTemplate;
	userId?: string;
	linkMetaData?: IShortLinkMetaData;
	user?: any;
	apiKeyId?: string;
	apiKey?: any;
	isSupportIOSDeepUrl?: boolean;
	isSupportAndroidDeepUrl?: boolean;
	isForDeepLink?: boolean;
	createdFrom?: string;
	subCategory?: number | null;
	previewReasons?: IPreviewReason[];
}

/**
 * Short link lookup item
 */
export interface IShortLinkLookupItem {
	_id: string;
	name: string;
}

/**
 * Page info for requests
 */
export interface IPageInfo {
	title?: string;
	description?: string;
	descriptionIsHtmlFile?: boolean;
}

/**
 * Create short link request (`POST /api/short-link`)
 */
export interface ICreateShortLinkRequest extends IShortLinkControlBody {
	name?: string | null;
	baseUrl: string;
	refId?: string | null;
	tag?: string | null;
	/** Required for every API-key call; the node refuses to send a create without it. */
	templateId: string;
	customLandingId?: string | null;
	isEnableLandingPage?: boolean | null;
	pageInfo?: IPageInfo;
	/** An http(s) link or an app link; left out, the target page's own deep link is used. */
	androidUrl?: string | null;
	iosUrl?: string | null;
}

/**
 * Update short link request (`PUT /api/short-link/:id`). The API replaces the
 * record with this body, so the node sends the stored value of everything the
 * user did not change. It never carries `customLandingId`: the API refuses it on
 * update.
 */
export interface IUpdateShortLinkRequest extends IShortLinkControlBody {
	name?: string | null;
	baseUrl: string;
	refId?: string | null;
	tag?: string | null;
	/** Required for every API-key call; the node falls back to the stored one. */
	templateId: string;
	templateType?: string | null;
	isEnableLandingPage?: boolean | null;
	pageInfo?: IPageInfo;
	subCategory?: number | null;
	createdFrom?: string | null;
	/**
	 * Sent only when the user set it, so the API decides the rest: present means
	 * that value (`""` clears it); absent keeps the stored one, or re-reads the
	 * new target page's deep link when `baseUrl` changed.
	 */
	androidUrl?: string | null;
	iosUrl?: string | null;
}

/**
 * List parameters for filtering
 */
export interface IListParams {
	baseUrl?: string;
	name?: string;
	'pageInfo.title'?: string;
	createdFrom?: string;
	shortLinkId?: string;
	refId?: string;
	tag?: string;
	/** Comma-joined tags. */
	tags?: string;
	campaignId?: string;
	templateId?: string;
	status?: string;
	isForDeepLink?: boolean;
	isEnableLandingPage?: boolean;
}

// Response type aliases
export type ISearchShortLinkResponse = IPaginationResponse<IShortLinkResponse>;
export type ILookupShortLinkResponse = IShortLinkLookupItem[];
export type ICreateShortLinkResponse = IShortLinkResponse;
export type IUpdateShortLinkResponse = IShortLinkResponse;
export type IGetShortLinkResponse = IShortLinkFullDetailsResponse;
export interface IDeleteShortLinkResponse {
	message: string;
}
