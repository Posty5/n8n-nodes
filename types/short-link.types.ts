/**
 * Short Link Types for Posty5 N8N Nodes
 * Type definitions for Short Link operations
 */

import { IPaginationResponse } from './common';

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
	title?: string;
	description?: string;
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
	isEnableMonetization?: boolean;
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
 * Create short link request
 */
export interface ICreateShortLinkRequest {
	name?: string | null;
	baseUrl: string;
	refId?: string | null;
	tag?: string | null;
	templateId?: string | null;
	customLandingId?: string | null;
	isEnableMonetization?: boolean | null;
	pageInfo?: IPageInfo;
}

/**
 * Update short link request
 */
export interface IUpdateShortLinkRequest {
	name?: string | null;
	baseUrl: string;
	refId?: string | null;
	tag?: string | null;
	templateId?: string | null;
	templateType?: string | null;
	recaptcha?: string | null;
	isEnableLandingPage?: boolean | null;
	isEnableMonetization?: boolean | null;
	pageInfo?: IPageInfo;
	subCategory?: number | null;
	createdFrom?: string | null;
}

/**
 * List parameters for filtering
 */
export interface IListParams {
	baseUrl?: string;
	name?: string;
	'pageinfo.title'?: string;
	createdFrom?: string;
	shortLinkId?: string;
	refId?: string;
	tag?: string;
	templateId?: string;
	status?: string;
	isForDeepLink?: boolean;
	isEnableMonetization?: boolean;
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
