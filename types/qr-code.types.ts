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
 * QR Code target configuration
 */
export interface IQRCodeTarget {
	type: QrCodeTargetType;
	freeText?: IQRFreeTextTarget;
	email?: IQRCodeEmailTarget;
	wifi?: IQRCodeWifiTarget;
	call?: IQRCodeCallTarget;
	sms?: IQRCodeSmsTarget;
	geolocation?: IQRCodeGeolocationTarget;
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
	isEnableMonetization?: boolean;
	pageInfo?: IQRCodePageInfo;
	qrCodeTarget?: IQRCodeTarget;
	status: QrCodeStatusType;
	previewReasons?: IPreviewReason[];
	createdAt?: string;
	updatedAt?: string;
	qrCodeLandingPageURL?: string;
	qrCodeDownloadURL?: string;
}

/**
 * QR Code full details response (from GET by ID)
 */
export interface IQRCodeFullDetailsResponse extends IQRCode {
	userId?: string;
	template?: IQRCodeTemplate;
	templateType?: string;
	options?: IQRCodeOptions;
}

/**
 * Base request interface for creating/updating QR codes
 */
export interface IQRCodeRequest {
	name?: string;
	templateId: string;
	refId?: string;
	tag?: string;
	customLandingId?: string;
	isEnableMonetization?: boolean;
	pageInfo?: IQRCodePageInfo;
}

export interface ICreateFreeTextQRCodeRequest extends IQRCodeRequest {
	text: string;
}

export interface ICreateEmailQRCodeRequest extends IQRCodeRequest {
	email: IQRCodeEmailTarget;
}

export interface ICreateWifiQRCodeRequest extends IQRCodeRequest {
	wifi: IQRCodeWifiTarget;
}

export interface ICreateCallQRCodeRequest extends IQRCodeRequest {
	call: IQRCodeCallTarget;
}

export interface ICreateSMSQRCodeRequest extends IQRCodeRequest {
	sms: IQRCodeSmsTarget;
}

export interface ICreateURLQRCodeRequest extends IQRCodeRequest {
	url: IQRCodeUrlTarget;
}

export interface ICreateGeolocationQRCodeRequest extends IQRCodeRequest {
	geolocation: IQRCodeGeolocationTarget;
}

/**
 * Request interface for updating a QR code
 */
export interface IUpdateQRCodeRequest extends IQRCodeRequest {
	name: string;
}

export interface IUpdateFreeTextQRCodeRequest extends IUpdateQRCodeRequest {
	qrCodeTarget: {
		text: string;
	};
}

export interface IUpdateEmailQRCodeRequest extends IUpdateQRCodeRequest {
	email: IQRCodeEmailTarget;
}

export interface IUpdateWifiQRCodeRequest extends IUpdateQRCodeRequest {
	wifi: IQRCodeWifiTarget;
}

export interface IUpdateCallQRCodeRequest extends IUpdateQRCodeRequest {
	call: IQRCodeCallTarget;
}

export interface IUpdateSMSQRCodeRequest extends IUpdateQRCodeRequest {
	sms: IQRCodeSmsTarget;
}

export interface IUpdateURLQRCodeRequest extends IUpdateQRCodeRequest {
	url: IQRCodeUrlTarget;
}

export interface IUpdateGeolocationQRCodeRequest extends IUpdateQRCodeRequest {
	geolocation: IQRCodeGeolocationTarget;
}

/**
 * List parameters for searching QR codes
 */
export interface IListParams {
	name?: string;
	qrCodeId?: string;
	templateId?: string;
	tag?: string;
	refId?: string;
	isEnableMonetization?: boolean;
	status?: QrCodeStatusType;
	createdFrom?: string;
}

/**
 * Lookup item for QR code selection
 */
export interface IQRCodeLookupItem {
	_id: string;
	name: string;
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
