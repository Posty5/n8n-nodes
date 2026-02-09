/**
 * Form Submission Types for Posty5 N8N Nodes
 * Type definitions for HTML Hosting Form Submission operations
 */

import { IPaginationResponse } from './common';

/**
 * Form status type
 */
export type IFormStatusType =
	| 'new'
	| 'pendingReview'
	| 'inProgress'
	| 'onHold'
	| 'needMoreInfo'
	| 'approved'
	| 'partiallyApproved'
	| 'rejected'
	| 'completed'
	| 'archived'
	| 'cancelled';

/**
 * HTML hosting object (populated)
 */
export interface IHtmlHosting {
	_id: string;
	name: string;
	customLandingId?: string;
}

/**
 * Form object (populated)
 */
export interface IForm {
	_id: string;
	name: string;
	fields?: any[];
}

/**
 * Status history entry
 */
export interface IStatusHistoryEntry {
	status: IFormStatusType;
	rejectedReason?: string;
	changedAt: string;
	notes?: string;
}

/**
 * Syncing status
 */
export interface ISyncingStatus {
	isDone: boolean;
	lastError?: string;
	lastAttemptAt?: string;
}

/**
 * HTML hosting form submission response
 */
export interface IHtmlHostingFormSubmissionResponse {
	_id: string;
	htmlHostingId: string;
	formId: string;
	visitorId: string;
	numbering: string;
	data: Record<string, any>;
	fields?: string[];
	refId?: string;
	tag?: string;
	status: IFormStatusType;
	statusHistory: IStatusHistoryEntry[];
	syncing: ISyncingStatus;
	createdAt: string;
	updatedAt?: string;
}

/**
 * HTML hosting form submission full details response (from GET by ID)
 */
export interface IHtmlHostingFormSubmissionFullDetailsResponse
	extends IHtmlHostingFormSubmissionResponse {
	htmlHosting?: IHtmlHosting;
	form?: IForm;
}

/**
 * Next and previous submission navigation
 */
export interface INextPreviousSubmission {
	_id: string;
	numbering: string;
}

/**
 * Next and previous submissions response
 */
export interface INextPreviousSubmissionsResponse {
	previous?: INextPreviousSubmission;
	next?: INextPreviousSubmission;
}

/**
 * Request interface for changing form submission status
 */
export interface IChangeStatusRequest {
	status: IFormStatusType;
	rejectedReason?: string | null;
	notes?: string | null;
}

/**
 * List parameters for filtering form submissions
 */
export interface IListParams {
	filteredFields?: string;
	htmlHostingId: string;
	formId?: string;
	numbering?: string;
	status?: IFormStatusType;
}

// Response type aliases
export type ISearchFormSubmissionsResponse =
	IPaginationResponse<IHtmlHostingFormSubmissionResponse>;
export type IGetFormSubmissionResponse = IHtmlHostingFormSubmissionFullDetailsResponse;
export interface IChangeStatusResponse {
	message?: string;
	statusHistory?: any[];
}
export interface IDeleteFormSubmissionResponse {
	message?: string;
}
