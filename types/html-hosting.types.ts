/**
 * HTML Hosting Types for Posty5 N8N Nodes
 * Type definitions for HTML Hosting operations
 */

import { IPaginationResponse } from './common';

/**
 * HTML Hosting status type
 */
export type HtmlHostingStatusType = 'new' | 'pending' | 'rejected' | 'approved';

/**
 * HTML Hosting source type
 */
export type HtmlHostingSourceType = 'file' | 'github';

/**
 * GitHub information in response
 */
export interface IGithubInfoResponse {
	fileURL: string;
	finalFileRawURL?: string;
}

/**
 * GitHub information for requests
 */
export interface IGithubInfo {
	fileURL: string;
}

/**
 * Form submission data
 */
export interface IFormSubmissionData {
	lasFormSubmissionAt?: string;
	numberOfFormSubmission: number;
	lasExportTime?: Date;
	forms?: {
		formId?: string;
		formFields?: string[];
		spreadsheetId?: string;
	}[];
}

/**
 * Preview reason
 */
export interface IPreviewReason {
	key: string;
	value: number;
}

/**
 * HTML page response
 */
export interface IHtmlPageResponse {
	_id: string;
	htmlHostingId: string;
	name?: string;
	lastVisitorDate?: string;
	numberOfVisitors: number;
	createdAt: string;
	updatedAt?: string;
	user: string;
	isEnableMonetization?: boolean;
	autoSaveInGoogleSheet?: boolean;
	isTemp: boolean;
	status: HtmlHostingStatusType;
	isCachedInLocalStorage: boolean;
	sourceType?: HtmlHostingSourceType;
	formSubmission?: IFormSubmissionData;
	shorterLink: string;
	fileUrl?: string;
	githubInfo?: IGithubInfoResponse;
	fileName?: string;
	refId?: string;
	tag?: string;
}

/**
 * HTML page lookup item (simplified)
 */
export interface IHtmlPageLookupItem {
	_id: string;
	name: string;
	htmlHostingId: string;
}

/**
 * Form lookup item
 */
export interface IFormLookupItem {
	_id: string;
	formId: string;
	formFields: string[];
}

/**
 * GitHub file proxy response
 */
export interface IGithubFileProxyResponse {
	content: string;
	encoding?: string;
}

/**
 * File content response
 */
export interface IFileContentResponse {
	content: string;
	contentType?: string;
}

/**
 * AWS S3 upload configuration
 */
export interface IUploadFileConfig {
	uploadUrl: string;
}

/**
 * Create HTML page response (returns uploadFileConfig + details)
 */
export interface ICreateHtmlPageResponse {
	uploadFileConfig: IUploadFileConfig;
	details: IHtmlPageResponse;
}

/**
 * Update HTML page response (returns uploadFileConfig + details when isNewFile=true)
 */
export interface IUpdateHtmlPageResponse {
	uploadFileConfig: IUploadFileConfig | null;
	details: IHtmlPageResponse;
}

/**
 * Request interface for creating an HTML page
 */
export interface ICreateHtmlPageRequest {
	name: string;
	customLandingId?: string | null;
	isEnableMonetization?: boolean | null;
	autoSaveInGoogleSheet?: boolean | null;
	tag?: string;
	refId?: string;
}

export interface ICreateHtmlPageRequestWithFile extends ICreateHtmlPageRequest {
	fileName: string;
}

export interface ICreateHtmlPageRequestWithGithub extends ICreateHtmlPageRequest {
	githubInfo: IGithubInfo;
}

/**
 * Request interface for updating an HTML page
 */
export interface IUpdateHtmlPageRequest {
	name: string;
	customLandingId?: string | null;
	isEnableMonetization?: boolean | null;
	autoSaveInGoogleSheet?: boolean | null;
}

export interface IUpdateHtmlPageRequestWithFile extends IUpdateHtmlPageRequest {
	fileName: string;
}

export interface IUpdateHtmlPageRequestWithGithub extends IUpdateHtmlPageRequest {
	githubInfo: IGithubInfo;
}

/**
 * List parameters for filtering HTML pages
 */
export interface IListParams {
	name?: string;
	htmlHostingId?: string;
	tag?: string;
	refId?: string;
	status?: HtmlHostingStatusType;
	sourceType?: HtmlHostingSourceType;
	isEnableMonetization?: boolean;
	autoSaveInGoogleSheet?: boolean;
	isTemp?: boolean;
	isCachedInLocalStorage?: boolean;
}

// Response type aliases
export type ISearchHtmlPagesResponse = IPaginationResponse<IHtmlPageResponse>;
export type ILookupHtmlPagesResponse = IHtmlPageLookupItem[];
export type ILookupFormsResponse = IFormLookupItem[];
export type IGetHtmlPageResponse = IHtmlPageResponse;
export interface IDeleteHtmlPageResponse {
	message: string;
}
