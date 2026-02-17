/**
 * Social Publisher Task Types for Posty5 N8N Nodes
 * Type definitions for Social Publisher Task operations
 */

import { IPaginationResponse } from './common';
import { SocialPublisherAccountStatusType } from './workspace.types';

/**
 * Social publisher task status type
 */
export type SocialPublisherTaskStatusType =
	| 'pending'
	| 'processing'
	| 'processingInPlatform'
	| 'failedByPlatform'
	| 'done'
	| 'error'
	| 'canceled'
	| 'needsMaintenance'
	| 'invalidVideoURL'
	| 'invalidPostVideoURL'
	| 'retrying';

/**
 * Social publisher task type
 */
export type SocialPublisherTaskType = 'shortVideo';

/**
 * Social publisher task account type
 */
export type SocialPublisherTaskAccountType = 'youtube' | 'facebook' | 'instagram' | 'tiktok';

/**
 * Social publisher task schedule type
 */
export type SocialPublisherTaskScheduleType = 'now' | 'schedule';

/**
 * Social publisher task source type
 */
export type SocialPublisherTaskSourceType =
	| 'video-file'
	| 'video-url'
	| 'facebook-video'
	| 'youtube-video'
	| 'tiktok-video';

/**
 * Upload config for video and thumbnail
 */
export interface IUploadConfig {
	url: string;
	fields: Record<string, string>;
}

/**
 * Generate upload URLs response
 */
export interface IGenerateUploadUrlsResponse {
	taskId: string;
	thumb: {
		fileURL: string | undefined;
		uploadFileURL: string | undefined;
		bucketFilePath: string | undefined;
	};
	video: {
		fileURL: string | undefined;
		uploadFileURL: string | undefined;
		bucketFilePath: string | undefined;
	};
}

/**
 * Social publisher task status log
 */
export interface ISocialPublisherTaskStatusLog {
	status: SocialPublisherTaskStatusType;
	error: string;
	changedAt: Date;
}

/**
 * Social publisher task post info
 */
export interface ISocialPublisherTaskPostInfo {
	platformAccountId: string;
	currentError: string;
	isAllow: boolean;
	currentStatus: SocialPublisherTaskStatusType;
	currentStatusChangedAt: Date;
	publishId: string;
	videoId: string;
	videoURL: string;
	statusHistory: { status: SocialPublisherTaskStatusType; changedAt: Date }[];
	socialPublisherAccountId: string | any;
}

/**
 * Social publisher task platform
 */
export interface ISocialPublisherTaskPlatform {
	postInfo: ISocialPublisherTaskPostInfo;
}

/**
 * Social publisher task response
 */
export interface ISocialPublisherTaskResponse {
	_id: string;
	numbering: string;
	caption: string;
	createdAt: Date;
	currentStatus: SocialPublisherTaskStatusType;
	isAllow: {
		tiktok: boolean;
		facebookPage: boolean;
		instagram: boolean;
		youtube: boolean;
	};
	workspace: {
		_id: string;
		name: string;
	};
	schedule: {
		type: 'schedule' | 'now';
		scheduledAt: Date;
		executedAt: Date;
	};
	refId: string;
	tag: string;
}

/**
 * Base status history grouped day
 */
export interface IBaseStatusHistoryGroupedDay<StatusType> {
	day: Date;
	history: IBaseStatusHistoryGroupedItem<StatusType>[];
}

/**
 * Base status history grouped item
 */
export interface IBaseStatusHistoryGroupedItem<StatusType> {
	time: Date;
	status: StatusType;
}

/**
 * Social publisher task status response
 */
export interface ISocialPublisherTaskStatusResponse {
	_id: string;
	numbering: string;
	type: 'shortVideo';
	source: SocialPublisherTaskSourceType;
	sourceURLs: {
		thumbURL?: string | null;
		videoURL?: string;
		postURL?: string;
	};
	currentStatus: SocialPublisherTaskStatusType;
	currentError: string;
	currentStatusChangedAt: string;
	statusHistoryGrouped: IBaseStatusHistoryGroupedDay<SocialPublisherTaskStatusType>[];
	tiktok?: ISocialPublisherTaskTikTokPostDetails;
	facebook?: ISocialPublisherTaskFacebookPagePostDetails;
	instagram?: ISocialPublisherTaskInstagramPostDetails;
	youtube?: ISocialPublisherTaskYouTubePostDetails;
	workspace: ISocialPublisherWorkspace;
	createdAt: Date;
	startedAt: Date;
	schedule: {
		type: 'schedule' | 'now';
		scheduledAt: Date;
		executedAt: Date;
	};
}

/**
 * Social publisher workspace
 */
export interface ISocialPublisherWorkspace {
	_id: string;
	name: string;
	description: string;
	createdAt: Date;
	account: {
		youtube?: ISocialPublisherAccount;
		tiktok?: ISocialPublisherAccount;
		facebook?: ISocialPublisherAccount;
		instagram?: ISocialPublisherAccount;
	};
}

/**
 * Social publisher account
 */
export interface ISocialPublisherAccount {
	_id: string;
	status: SocialPublisherAccountStatusType;
	link: string;
	name: string;
	thumbnail: string;
	platformAccountId: string;
}

/**
 * Social publisher task account
 */
export interface ISocialPublisherTaskAccount {
	tags: string[];
	postInfo: {
		isAllow: boolean;
		currentStatus: SocialPublisherTaskStatusType;
		statusHistoryGrouped: IBaseStatusHistoryGroupedDay<SocialPublisherTaskStatusType>[];
		videoURL: string;
		socialPublisherAccount: ISocialPublisherAccount;
	};
}

/**
 * Social publisher task TikTok post details
 */
export interface ISocialPublisherTaskTikTokPostDetails extends ISocialPublisherTaskAccount {
	caption: string;
	disable_duet: boolean;
	disable_stitch: boolean;
	disable_comment: boolean;
	privacy_level: string;
}

/**
 * Social publisher task Facebook page post details
 */
export interface ISocialPublisherTaskFacebookPagePostDetails extends ISocialPublisherTaskAccount {
	description: string;
	title: string;
}

/**
 * Social publisher task Instagram post details
 */
export interface ISocialPublisherTaskInstagramPostDetails extends ISocialPublisherTaskAccount {
	description: string;
	share_to_feed: boolean;
	is_published_to_both_feed_and_story: boolean;
}

/**
 * Social publisher task YouTube post details
 */
export interface ISocialPublisherTaskYouTubePostDetails extends ISocialPublisherTaskAccount {
	title: string;
	description: string;
	tags: string[];
	madeForKids: boolean;
	defaultLanguage: string;
	defaultAudioLanguage: string;
	categoryId: string;
	localizationLanguages: string[];
	localizations: any;
}

/**
 * Social publisher task next/previous response
 */
export interface ISocialPublisherTaskNextPreviousResponse {
	nextId?: string;
	previousId?: string;
}

/**
 * YouTube configuration
 */
export interface IYouTubeConfig {
	title: string;
	description: string;
	tags: string[];
	madeForKids?: boolean;
	defaultLanguage?: string;
	defaultAudioLanguage?: string;
	categoryId?: string;
	localizationLanguages?: string[];
}

/**
 * TikTok configuration
 */
export interface ITikTokConfig {
	caption: string;
	disable_duet: boolean;
	disable_stitch: boolean;
	disable_comment: boolean;
	privacy_level: string;
}

/**
 * Facebook page configuration
 */
export interface IFacebookPageConfig {
	description: string;
	title?: string;
}

/**
 * Instagram configuration
 */
export interface IInstagramConfig {
	description: string;
	share_to_feed?: boolean;
	is_published_to_both_feed_and_story?: boolean;
}

/**
 * Schedule configuration
 */
export interface IScheduleConfig {
	type: SocialPublisherTaskScheduleType;
	scheduledAt?: Date;
}

/**
 * Create social publisher task request
 */
export interface ICreateSocialPublisherTaskRequest {
	workspaceId: string;
	source: SocialPublisherTaskSourceType;
	isAllowYouTube: boolean;
	isAllowTiktok: boolean;
	isAllowFacebookPage: boolean;
	isAllowInstagram: boolean;
	youtube?: IYouTubeConfig;
	tiktok?: ITikTokConfig;
	facebook?: IFacebookPageConfig;
	instagram?: IInstagramConfig;
	videoURL?: string;
	thumbURL?: string;
	postURL?: string;
	schedule?: IScheduleConfig;
	tag?: string;
	refId?: string;
}

/**
 * Generate upload URLs request
 */
export interface IGenerateUploadUrlsRequest {
	thumbFileType?: string;
	videoFileType?: string;
}

/**
 * List parameters for filtering tasks
 */
export interface IListParams {
	caption?: string;
	numbering?: string;
	currentStatus?: string;
	workspaceId?: string;
	refId?: string;
	tag?: string;
	'youtube.postInfo.isAllow'?: boolean;
	'facebook.postInfo.isAllow'?: boolean;
	'instagram.postInfo.isAllow'?: boolean;
	'tiktok.postInfo.isAllow'?: boolean;
}

// Response type aliases
export type ISearchSocialPublisherTaskResponse = IPaginationResponse<ISocialPublisherTaskResponse>;
export type IGetTaskResponse = ISocialPublisherTaskStatusResponse;
export type IGetTaskStatusResponse = ISocialPublisherTaskStatusResponse;
export interface IDeleteTaskResponse {
	message?: string;
}
