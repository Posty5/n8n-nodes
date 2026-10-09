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
export type QrCodeTargetType =
	| 'freeText'
	| 'email'
	| 'wifi'
	| 'call'
	| 'sms'
	| 'url'
	| 'geolocation'
	| 'vcard'
	| 'event'
	| 'whatsapp'
	| 'review'
	| 'social'
	| 'appStore'
	| 'file';

/** vCard phone kinds. Default `mobile`. */
export type QrCodeVCardPhoneKind = 'mobile' | 'work' | 'home';

/** Review platforms of a `review` code. */
export type QrCodeReviewPlatform = 'google' | 'tripadvisor' | 'trustpilot' | 'yelp' | 'facebook' | 'other';

/** Social profile platforms of a `social` code. */
export type QrCodeSocialPlatform =
	| 'instagram'
	| 'facebook'
	| 'tiktok'
	| 'x'
	| 'youtube'
	| 'linkedin'
	| 'snapchat'
	| 'telegram'
	| 'threads'
	| 'pinterest'
	| 'other';

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

/** One vCard phone. */
export interface IQRCodeVCardPhone {
	kind?: QrCodeVCardPhoneKind;
	number: string;
}

/** A vCard's work address. */
export interface IQRCodeVCardAddress {
	street?: string;
	city?: string;
	region?: string;
	postalCode?: string;
	country?: string;
}

/** vCard target: `firstName` or `organization` is required (API 400 otherwise). */
export interface IQRCodeVCardTarget {
	firstName?: string;
	lastName?: string;
	organization?: string;
	jobTitle?: string;
	phones?: IQRCodeVCardPhone[];
	emails?: string[];
	website?: string;
	address?: IQRCodeVCardAddress;
	note?: string;
}

/** Calendar event target. ISO strings sent as typed; a wall-clock value is read in `timezone`. */
export interface IQRCodeEventTarget {
	title: string;
	location?: string;
	description?: string;
	startsAt: string;
	endsAt?: string;
	allDay?: boolean;
	timezone?: string;
	url?: string;
}

/** WhatsApp chat target. */
export interface IQRCodeWhatsappTarget {
	phoneNumber: string;
	message?: string;
}

/** Review target: Google takes `placeId` or `url`; the others a `url`. */
export interface IQRCodeReviewTarget {
	platform: QrCodeReviewPlatform;
	placeId?: string;
	url?: string;
}

/** One social profile: `handle` or `url`. */
export interface IQRCodeSocialProfile {
	platform: QrCodeSocialPlatform;
	handle?: string;
	url?: string;
}

/** App store target (dynamic-only): Android and/or iOS store URL, plus a required fallback. */
export interface IQRCodeAppStoreTarget {
	androidUrl?: string;
	iosUrl?: string;
	fallbackUrl: string;
}

/**
 * File target (dynamic-only). `bucketFilePath` comes from the upload-url route;
 * omitted on update keeps the stored file. `fileURL`, `mimeType`, `sizeBytes`
 * are server-set (read only).
 */
export interface IQRCodeFileTarget {
	bucketFilePath?: string;
	fileName?: string;
	fileURL?: string;
	mimeType?: string;
	sizeBytes?: number;
}

/** `POST /api/qr-code/file/upload-url` body. */
export interface IQRCodeFileUploadRequest {
	fileName: string;
	mimeType: string;
	sizeBytes: number;
}

/** What the upload-url route answers: a signed PUT URL valid `expiresInSeconds`. */
export interface IQRCodeFileUploadTicket {
	uploadFileURL: string;
	bucketFilePath: string;
	expiresInSeconds: number;
}

/** The node's Social Profiles fixedCollection as n8n hands it over. */
export interface IQRCodeSocialProfilesParameter {
	profile?: Array<{ platform?: unknown; handle?: unknown; url?: unknown }>;
}

/** Social target. A static code takes one profile; 2+ (up to 12) make it dynamic-only. */
export interface IQRCodeSocialTarget {
	profiles: IQRCodeSocialProfile[];
	title?: string;
}

/** The node's vCard Phones fixedCollection as n8n hands it over. */
export interface IQRCodeVCardPhonesParameter {
	phone?: Array<{ kind?: unknown; number?: unknown }>;
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
	vcard?: IQRCodeVCardTarget;
	event?: IQRCodeEventTarget;
	whatsapp?: IQRCodeWhatsappTarget;
	review?: IQRCodeReviewTarget;
	social?: IQRCodeSocialTarget;
	appStore?: IQRCodeAppStoreTarget;
	file?: IQRCodeFileTarget;
}

/** Static: the image encodes the content. Dynamic: it encodes a Posty5 link that redirects. */
export type QrCodeMode = 'static' | 'dynamic';

/**
 * Scan rules of a dynamic QR code (Starter plan and above). Each value or null;
 * all empty means never gated. A sent object replaces the stored rules whole.
 */
export interface IQRCodeAccess {
	/** ISO date-time; scans before it are gated. */
	activeFrom?: string | null;
	/** ISO date-time, after activeFrom; scans from it are gated. */
	expiresAt?: string | null;
	/** Integer ≥ 1; scans beyond it are gated. */
	maxVisits?: number | null;
	/** http(s) URL (≤ 2048) that gated scans go to. */
	fallbackUrl?: string | null;
}

/** The node's Scan Rules collection as n8n hands it over. */
export interface IQRCodeScanRulesParameter {
	activeFrom?: unknown;
	expiresAt?: unknown;
	maxVisits?: unknown;
	fallbackUrl?: unknown;
	clearScanRules?: unknown;
}

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
	/** Scan rules; `null` when the code has none. */
	access?: IQRCodeAccess | null;
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
	/** Absent: unchanged on update. `null`: clear every scan rule. Dynamic codes only. */
	access?: IQRCodeAccess | null;
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
