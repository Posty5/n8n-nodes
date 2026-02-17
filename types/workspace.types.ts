/**
 * Social Publisher Workspace Types for Posty5 N8N Nodes
 * Type definitions for Social Publisher Workspace operations
 */

import { IPaginationResponse } from './common';

/**
 * Social publisher account status type
 */
export type SocialPublisherAccountStatusType = 'active' | 'inactive' | 'authenticationExpired';

/**
 * Account sample details
 */
export interface IAccountSampleDetails {
	link: string;
	name: string;
	thumbnail: string;
	platformAccountId: string;
	status: SocialPublisherAccountStatusType;
}

/**
 * Workspace account configuration
 */
export interface IWorkspaceAccount {
	youtube?: IAccountSampleDetails | any;
	facebook?: IAccountSampleDetails | any;
	instagram?: IAccountSampleDetails | any;
	tiktok?: IAccountSampleDetails | any;
}

/**
 * Workspace response
 */
export interface IWorkspaceResponse {
	_id: string;
	name: string;
	description: string;
	imageUrl?: string;
	account: IWorkspaceAccount;
}

/**
 * Workspace sample details (used in lists)
 */
export interface IWorkspaceSampleDetails {
	_id: string;
	name: string;
	description: string;
	imageUrl?: string;
	createdAt: string;
	updatedAt?: string;
	refId?: string;
	tag: string;
}

/**
 * Upload image configuration returned by API
 */
export interface IUploadImageConfig {
	uploadUrl: string;
	imageUrl: string;
}

/**
 * Workspace details with upload config
 */
export interface IWorkspaceWithUploadConfig {
	workspaceId: string;
	uploadImageConfig: IUploadImageConfig | null;
}

/**
 * Workspace details formatted for new post creation with populated accounts
 */
export interface IWorkspaceForNewPostResponse {
	_id: string;
	name: string;
	description: string;
	imageUrl?: string;
	account: IWorkspaceAccount;
}

/**
 * Workspace request
 */
export interface IWorkspaceRequest {
	name: string;
	description: string;
	tag?: string;
	refId?: string;
}

/**
 * List parameters for filtering workspaces
 */
export interface IListParams {
	name?: string;
	description?: string;
	tag?: string;
	refId?: string;
}

// Response type aliases
export type ISearchWorkspaceResponse = IPaginationResponse<IWorkspaceSampleDetails>;
export type ICreateWorkspaceRequest = IWorkspaceRequest;
export type IUpdateWorkspaceRequest = IWorkspaceRequest;
export type ICreateWorkspaceResponse = IWorkspaceWithUploadConfig;
export type IUpdateWorkspaceResponse = IWorkspaceWithUploadConfig;
export type IGetWorkspaceResponse = IWorkspaceResponse;
export interface IDeleteWorkspaceResponse {
	message?: string;
}
