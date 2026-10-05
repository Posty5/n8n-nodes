/**
 * QR Code Types for Posty5 N8N Nodes
 * Type definitions for QR Code operations
 */

import { IPaginationResponse } from './common';

/**
 * QR Code status type
 */
export type QrCodeStatusType = 'new' | 'pending' | 'rejected' | 'approved';

/**
 * QR Code target type
 */
export type QrCodeTargetType = 'freeText' | 'email' | 'wifi' | 'call' | 'sms' | 'url' | 'geolocation';

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
 * QR Code page information
 */
export interface IQRCodePageInfo {
	title?: string;
	description?: string;
}

/**
 * QR Code styling options
 */
export interface IQRCodeOptions {
	text?: string;
	width?: number;
	height?: number;
	correctLevel?: number;
	dotScale?: number;
	dotScaleTiming_H?: number;
	dotScaleTiming_V?: number;
	dotScaleAO?: number;
	dotScaleAI?: number;
	quietZone?: number;
	quietZoneColor?: string;
	colorDark?: string;
	colorLight?: string;
	PO_TL?: string;
	PO_TR?: string;
	PO_BL?: string;
	PI_TL?: string;
	PI_TR?: string;
	PI_BL?: string;
	AI?: string;
	AO?: string;
	timing_V?: string;
	timing_H?: string;
	title?: string;
	titleFont?: string;
	titleColor?: string;
	titleBackgroundColor?: string;
	titleHeight?: number;
	titleTop?: number;
	logo?: string;
	logoWidth?: number;
	logoHeight?: number;
	logoBackgroundColor?: string;
	logoBackgroundTransparent?: boolean;
}

/**
 * Email QR code target
 */
export interface IQRCodeEmailTarget {
	email?: string;
	subject?: string;
	body?: string;
}

/**
 * Free text QR code target
 */
export interface IQRFreeTextTarget {
	text?: string;
}

/**
 * WiFi QR code target
 */
export interface IQRCodeWifiTarget {
	name?: string;
	authenticationType?: string;
	password?: string;
}

/**
 * Call QR code target
 */
export interface IQRCodeCallTarget {
	phoneNumber?: string;
}

/**
 * SMS QR code target
 */
export interface IQRCodeSmsTarget {
	phoneNumber?: string;
	message?: string;
}

/**
 * URL QR code target
 */
export interface IQRCodeUrlTarget {
	url?: string;
}

/**
 * Geolocation QR code target
 */
export interface IQRCodeGeolocationTarget {
	latitude: string | number;
	longitude: string | number;
}

/**
 * QR Code target configuration (`qrCodeTarget`). `type` names the one block the
 * API reads; the node sends that block and no other.
 */
export interface IQRCodeTarget {
	type: QrCodeTargetType;
	freeText?: IQRFreeTextTarget;
	email?: IQRCodeEmailTarget;
	wifi?: IQRCodeWifiTarget;
	call?: IQRCodeCallTarget;
	sms?: IQRCodeSmsTarget;
	url?: IQRCodeUrlTarget;
	geolocation?: IQRCodeGeolocationTarget;
}

/** Static: the image encodes the content. Dynamic: it encodes a Posty5 link that redirects. */
export type QrCodeMode = 'static' | 'dynamic';

/**
 * QR Code response interface
 */
export interface IQRCode {
	_id: string;
	qrCodeId: string;
	templateId?: string;
	numberOfVisitors?: number;
	isEnableLandingPage?: boolean;
	name: string;
	lastVisitorDate?: string;
	refId?: string;
	tag?: string;
	pageInfo?: IQRCodePageInfo;
	qrCodeTarget?: IQRCodeTarget;
	status: QrCodeStatusType;
	previewReasons?: IPreviewReason[];
	createdAt?: string;
	updatedAt?: string;
	qrCodeLandingPageURL?: string;
	qrCodeDownloadURL?: string;
	/** `static` when absent (codes stored before dynamic QR codes existed). */
	mode?: QrCodeMode;
	/** When the code last became dynamic; `null` for a static code. */
	dynamicSince?: string | null;
}

/**
 * QR Code full details response (from GET by ID)
 */
export interface IQRCodeFullDetailsResponse extends IQRCode {
	userId?: string;
	template?: IQRCodeTemplate;
	templateType?: string;
	options?: IQRCodeOptions;
	createdFrom?: string;
}

/**
 * Body of `POST /api/qr-code/:type` and `PUT /api/qr-code/:type/:id`.
 *
 * `options` is required by the API but the node sends it empty: the template
 * supplies the design, and the server builds `options.text` from
 * `qrCodeTarget`, so nothing a client puts there changes what the image encodes.
 */
export interface IQRCodeWriteRequest {
	name?: string;
	/** Required for every API-key call. */
	templateId: string;
	templateType?: string;
	refId?: string;
	tag?: string;
	isEnableLandingPage?: boolean;
	pageInfo?: IQRCodePageInfo;
	createdFrom?: string;
	qrCodeTarget: IQRCodeTarget;
	options: IQRCodeOptions;
	/** Absent: static on create, unchanged on update. Wi-Fi cannot be dynamic (API 400). */
	mode?: QrCodeMode;
}

/**
 * Reads one node parameter for the QR target builder. The node passes
 * `(name, fallback) => this.getNodeParameter(name, itemIndex, fallback)`;
 * tests pass a plain lookup.
 */
export type QrParameterReader = (name: string, fallback?: unknown) => unknown;

/**
 * List parameters for searching QR codes
 */
export interface IListParams {
	name?: string;
	qrCodeId?: string;
	templateId?: string;
	tag?: string;
	refId?: string;
	isEnableLandingPage?: boolean;
	status?: QrCodeStatusType;
	createdFrom?: string;
	mode?: QrCodeMode;
}

/**
 * Lookup item for QR code selection
 */
export interface IQRCodeLookupItem {
	_id: string;
	name: string;
}

/**
 * One row of `GET /api/qr-code-template/user-lookup` or `/public-lookup`
 * (both select only `name`).
 */
export interface IQRCodeTemplateLookupItem {
	_id: string;
	name?: string;
}

/** The cursor-paged envelope both template lookups answer with. */
export interface IQRCodeTemplateLookupPage {
	items?: IQRCodeTemplateLookupItem[];
	pagination?: {
		nextCursor?: string | null;
		hasMore?: boolean;
	};
}

// Response type aliases
export type ICreateQRCodeResponse = IQRCode;
export type IUpdateQRCodeResponse = IQRCode;
export type IGetQRCodeResponse = IQRCodeFullDetailsResponse;
export type ISearchQRCodesResponse = IPaginationResponse<IQRCode>;
export type ILookupQRCodesResponse = IQRCodeLookupItem[];
export interface IDeleteQRCodeResponse {
	message: string;
}
