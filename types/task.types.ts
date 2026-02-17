/**
 * Social Publisher Post Types for Posty5 N8N Nodes
 * Type definitions for Social Publisher Post operations
 */

import { IPaginationResponse } from './common';
import { SocialPublisherAccountStatusType } from './workspace.types';

/**
 * Social publisher post status type
 */
export type SocialPublisherPostStatusType =
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
 * Social publisher post type
 */
export type SocialPublisherPostType = 'shortVideo';

/**
 * Social publisher post account type
 */
export type SocialPublisherPostAccountType = 'youtube' | 'facebook' | 'instagram' | 'tiktok';

/**
 * Social publisher post schedule type
 */
export type SocialPublisherPostScheduleType = 'now' | 'schedule';

/**
 * Social publisher post source type
 */
export type SocialPublisherPostSourceType =
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
	postId: string;
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
 * Social publisher post status log
 */
export interface ISocialPublisherPostStatusLog {
	status: SocialPublisherPostStatusType;
	error: string;
	changedAt: Date;
}

/**
 * Social publisher post post info
 */
export interface ISocialPublisherPostInfo {
	platformAccountId: string;
	currentError: string;
	isAllow: boolean;
	currentStatus: SocialPublisherPostStatusType;
	currentStatusChangedAt: Date;
	publishId: string;
	videoId: string;
	videoURL: string;
	statusHistory: { status: SocialPublisherPostStatusType; changedAt: Date }[];
	socialPublisherAccountId: string | any;
}

/**
 * Social publisher post platform
 */
export interface ISocialPublisherPostPlatform {
	postInfo: ISocialPublisherPostInfo;
}

/**
 * Social publisher post response
 */
export interface ISocialPublisherPostResponse {
	_id: string;
	numbering: string;
	caption: string;
	createdAt: Date;
	currentStatus: SocialPublisherPostStatusType;
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
 * Social publisher post status response
 */
export interface ISocialPublisherPostStatusResponse {
	_id: string;
	numbering: string;
	type: 'shortVideo';
	source: SocialPublisherPostSourceType;
	sourceURLs: {
		thumbURL?: string | null;
		videoURL?: string;
		postURL?: string;
	};
	currentStatus: SocialPublisherPostStatusType;
	currentError: string;
	currentStatusChangedAt: string;
	statusHistoryGrouped: IBaseStatusHistoryGroupedDay<SocialPublisherPostStatusType>[];
	tiktok?: ISocialPublisherPostTikTokPostDetails;
	facebook?: ISocialPublisherPostFacebookPagePostDetails;
	instagram?: ISocialPublisherPostInstagramPostDetails;
	youtube?: ISocialPublisherPostYouTubePostDetails;
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
 * Social publisher post account
 */
export interface ISocialPublisherPostAccount {
	tags: string[];
	postInfo: {
		isAllow: boolean;
		currentStatus: SocialPublisherPostStatusType;
		statusHistoryGrouped: IBaseStatusHistoryGroupedDay<SocialPublisherPostStatusType>[];
		videoURL: string;
		socialPublisherAccount: ISocialPublisherAccount;
	};
}

/**
 * Social publisher post TikTok post details
 */
export interface ISocialPublisherPostTikTokPostDetails extends ISocialPublisherPostAccount {
	caption: string;
	disable_duet: boolean;
	disable_stitch: boolean;
	disable_comment: boolean;
	privacy_level: string;
}

/**
 * Social publisher post Facebook page post details
 */
export interface ISocialPublisherPostFacebookPagePostDetails extends ISocialPublisherPostAccount {
	description: string;
	title: string;
}

/**
 * Social publisher post Instagram post details
 */
export interface ISocialPublisherPostInstagramPostDetails extends ISocialPublisherPostAccount {
	description: string;
	share_to_feed: boolean;
	is_published_to_both_feed_and_story: boolean;
}

/**
 * Social publisher post YouTube post details
 */
export interface ISocialPublisherPostYouTubePostDetails extends ISocialPublisherPostAccount {
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
 * Social publisher post next/previous response
 */
export interface ISocialPublisherPostNextPreviousResponse {
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
	type: SocialPublisherPostScheduleType;
	scheduledAt?: Date;
}

/**
 * Create social publisher post request
 */
export interface ICreateSocialPublisherPostRequest {
	workspaceId: string;
	source: SocialPublisherPostSourceType;
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
 * List parameters for filtering posts
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
export type ISearchSocialPublisherPostResponse = IPaginationResponse<ISocialPublisherPostResponse>;
export type IGetPostResponse = ISocialPublisherPostStatusResponse;
export type IGetPostStatusResponse = ISocialPublisherPostStatusResponse;
export interface IDeletePostResponse {
	message?: string;
}
