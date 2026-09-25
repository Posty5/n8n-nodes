import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { makeApiRequest, makePaginatedRequest, uploadFile } from '../../utils/api.helpers';
import { API_ENDPOINTS } from '../../utils/constants';
import { supportsResumableUpload, uploadResumable } from '../../utils/resumable-upload';
import { buildCommentsPayload } from '../../utils/post-comments';

export class Posty5SocialPublisherPost implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Posty5 Social Publisher Post',
		name: 'posty5SocialPublisherPost',
		icon: 'file:posty5.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description:
			'Publish videos to social media platforms. Supports up to five post-publish comments (25 credits each) for YouTube, Facebook and Instagram — TikTok is not supported.',
		defaults: {
			name: 'Posty5 Social Publisher Post',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'posty5Api',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Publish Video to Workspace',
						value: 'publishVideo',
						description: 'Publish a video to social media platforms via workspace',
						action: 'Publish a video to workspace',
					},
					{
						name: 'Publish Video to Account',
						value: 'publishVideoToAccount',
						description: 'Publish a video to social media platforms via account',
						action: 'Publish a video to account',
					},
					{
						name: 'Publish Image to Workspace',
						value: 'publishImage',
						description: 'Publish an image to social media platforms via workspace (50 credits, plus 25 per comment)',
						action: 'Publish an image to workspace',
					},
					{
						name: 'Publish Image to Account',
						value: 'publishImageToAccount',
						description: 'Publish an image to a single connected account (50 credits, plus 25 per comment)',
						action: 'Publish an image to account',
					},
					{
						name: 'Publish Long Video to Workspace',
						value: 'publishLongVideo',
						description:
							'Publish a video of up to 60 minutes via workspace. Charged by duration: 50 credits per started 5 minutes.',
						action: 'Publish a long video to workspace',
					},
					{
						name: 'Publish Long Video to Account',
						value: 'publishLongVideoToAccount',
						description:
							'Publish a video of up to 60 minutes to a single connected account. Charged by duration: 50 credits per started 5 minutes.',
						action: 'Publish a long video to account',
					},
					{
						name: 'Quote Long Video',
						value: 'getLongVideoQuote',
						description:
							'Measure a video and return its exact credit cost plus which platforms accept it. Creates nothing and charges nothing.',
						action: 'Quote a long video',
					},
					{
						name: 'Reschedule Post',
						value: 'reschedulePost',
						description:
							'Move a not-yet-published post to another time, or publish it now. Costs no credits.',
						action: 'Reschedule a post',
					},
					{
						name: 'Delete Post',
						value: 'deletePost',
						description:
							'Delete a post that has not published yet and release its uploaded media. Free — nothing was charged for a post that never went out.',
						action: 'Delete a post',
					},
					{
						name: 'Get Post Status',
						value: 'getPostStatus',
						description: 'Get the status of a publishing post',
						action: 'Get Post Status',
					},
					{
						name: 'List Posts',
						value: 'listPosts',
						description: 'List all publishing posts',
						action: 'List Posts',
					},
					{
						name: 'Get Default Settings',
						value: 'getDefaultSettings',
						description: 'Get default platform settings',
						action: 'Get default settings',
					},
				],
				default: 'publishVideo',
			},

			// Publish Video operation fields
			{
				displayName: 'Workspace ID',
				name: 'workspaceId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['publishVideo', 'publishLongVideo', 'publishLongVideoToAccount'],
					},
				},
				default: '',
				description: 'The workspace ID to publish under',
			},
			{
				displayName: 'Account ID',
				name: 'accountId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['publishVideoToAccount', 'publishLongVideoToAccount'],
					},
				},
				default: '',
				description: 'The account ID to publish under',
			},
			{
				displayName: 'Video Source',
				name: 'videoSource',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['publishVideo', 'publishLongVideo', 'publishLongVideoToAccount'],
					},
				},
				options: [
					{ name: 'Binary Data', value: 'binary' },
					{ name: 'URL', value: 'url' },
				],
				default: 'binary',
				description: 'Whether to use binary data or a URL',
			},
			{
				displayName: 'Video Binary Property',
				name: 'videoBinaryProperty',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['publishVideo', 'publishLongVideo', 'publishLongVideoToAccount'],
						videoSource: ['binary'],
					},
				},
				default: 'data',
				description: 'Name of the binary property containing the video file',
			},
			{
				displayName: 'Video URL',
				name: 'videoUrl',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['publishVideo', 'publishLongVideo', 'publishLongVideoToAccount'],
						videoSource: ['url'],
					},
				},
				default: '',
				description:
					'URL of the video to publish (can be direct URL, Facebook, TikTok, or YouTube Shorts)',
			},
			{
				displayName: 'Thumbnail Source',
				name: 'thumbnailSource',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['publishVideo', 'publishLongVideo', 'publishLongVideoToAccount'],
					},
				},
				options: [
					{ name: 'None', value: 'none' },
					{ name: 'Binary Data', value: 'binary' },
					{ name: 'URL', value: 'url' },
				],
				default: 'none',
				description: 'Thumbnail source (optional)',
			},
			{
				displayName: 'Thumbnail Binary Property',
				name: 'thumbnailBinaryProperty',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['publishVideo', 'publishLongVideo', 'publishLongVideoToAccount'],
						thumbnailSource: ['binary'],
					},
				},
				default: 'thumbnail',
				description: 'Name of the binary property containing the thumbnail image',
			},
			{
				displayName: 'Thumbnail URL',
				name: 'thumbnailUrl',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['publishVideo', 'publishLongVideo', 'publishLongVideoToAccount'],
						thumbnailSource: ['url'],
					},
				},
				default: '',
				description: 'URL of the thumbnail image',
			},
			{
				displayName: 'Scheduled Publish Time',
				name: 'scheduledPublishTime',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['publishVideo', 'publishLongVideo', 'publishLongVideoToAccount'],
					},
				},
				options: [
					{ name: 'Now', value: 'now' },
					{ name: 'Schedule for Later', value: 'later' },
				],
				default: 'now',
				description: 'When to publish the video',
			},
			{
				displayName: 'Schedule Date',
				name: 'scheduleDate',
				type: 'dateTime',
				displayOptions: {
					show: {
						operation: ['publishVideo', 'publishLongVideo', 'publishLongVideoToAccount'],
						scheduledPublishTime: ['later'],
					},
				},
				default: '',
				description: 'The date and time to publish',
			},

			// YouTube Settings
			{
				displayName:
					'Only used if your workspace has a YouTube account connected — otherwise ignored.',
				name: 'youtubeSettingsNotice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						operation: ['publishVideo', 'publishLongVideo', 'publishLongVideoToAccount'],
					},
				},
			},
			{
				displayName: 'YouTube Settings',
				name: 'youtubeSettings',
				type: 'collection',
				placeholder: 'Add Setting',
				default: {},
				displayOptions: {
					show: {
						operation: ['publishVideo', 'publishLongVideo', 'publishLongVideoToAccount'],
					},
				},
				options: [
					{
						displayName: 'Title',
						name: 'title',
						type: 'string',
						default: '',
						description: 'Video title (max 100 characters)',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Video description (max 5000 characters)',
					},
					{
						displayName: 'Tags',
						name: 'tags',
						type: 'string',
						default: '',
						description: 'Comma-separated tags',
					},
					{
						displayName: 'Made for Kids',
						name: 'madeForKids',
						type: 'boolean',
						default: false,
						description: 'Whether the video is made for kids',
					},
				],
			},

			// TikTok Settings
			{
				displayName:
					'Only used if your workspace has a TikTok account connected — otherwise ignored.',
				name: 'tiktokSettingsNotice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						operation: ['publishVideo', 'publishLongVideo', 'publishLongVideoToAccount'],
					},
				},
			},
			{
				displayName: 'TikTok Settings',
				name: 'tiktokSettings',
				type: 'collection',
				placeholder: 'Add Setting',
				default: {},
				displayOptions: {
					show: {
						operation: ['publishVideo', 'publishLongVideo', 'publishLongVideoToAccount'],
					},
				},
				options: [
					{
						displayName: 'Caption',
						name: 'caption',
						type: 'string',
						default: '',
						description: 'Video caption',
					},
					{
						displayName: 'Privacy Level',
						name: 'privacy_level',
						type: 'options',
						options: [
							{ name: 'Public', value: 'PUBLIC_TO_EVERYONE' },
							{ name: 'Friends', value: 'MUTUAL_FOLLOW_FRIENDS' },
							{ name: 'Private', value: 'SELF_ONLY' },
						],
						default: 'PUBLIC_TO_EVERYONE',
						description: 'Video privacy setting',
					},
					{
						displayName: 'Disable Duet',
						name: 'disable_duet',
						type: 'boolean',
						default: false,
						description: 'Whether to disable duet',
					},
					{
						displayName: 'Disable Stitch',
						name: 'disable_stitch',
						type: 'boolean',
						default: false,
						description: 'Whether to disable stitch',
					},
					{
						displayName: 'Disable Comment',
						name: 'disable_comment',
						type: 'boolean',
						default: false,
						description: 'Whether to disable comments',
					},
				],
			},

			// Facebook Settings
			{
				displayName:
					'Only used if your workspace has a Facebook Page connected — otherwise ignored.',
				name: 'facebookSettingsNotice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						operation: ['publishVideo', 'publishLongVideo', 'publishLongVideoToAccount'],
					},
				},
			},
			{
				displayName: 'Facebook Settings',
				name: 'facebookSettings',
				type: 'collection',
				placeholder: 'Add Setting',
				default: {},
				displayOptions: {
					show: {
						operation: ['publishVideo', 'publishLongVideo', 'publishLongVideoToAccount'],
					},
				},
				options: [
					{
						displayName: 'Title',
						name: 'title',
						type: 'string',
						default: '',
						description: 'Video title',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Video description',
					},
				],
			},

			// Instagram Settings
			{
				displayName:
					'Only used if your workspace has an Instagram account connected — otherwise ignored.',
				name: 'instagramSettingsNotice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						operation: ['publishVideo', 'publishLongVideo', 'publishLongVideoToAccount'],
					},
				},
			},
			{
				displayName: 'Instagram Settings',
				name: 'instagramSettings',
				type: 'collection',
				placeholder: 'Add Setting',
				default: {},
				displayOptions: {
					show: {
						operation: ['publishVideo', 'publishLongVideo', 'publishLongVideoToAccount'],
					},
				},
				options: [
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Video caption/description',
					},
					{
						displayName: 'Share to Feed',
						name: 'share_to_feed',
						type: 'boolean',
						default: true,
						description: 'Whether to share to feed',
					},
				],
			},

			// Post-publish comments — 25 credits each
			{
				displayName: 'Comment',
				name: 'comment',
				type: 'collection',
				placeholder: 'Add Comment',
				default: {},
				displayOptions: {
					show: {
						operation: ['publishVideo', 'publishVideoToAccount', 'publishImage', 'publishImageToAccount'],
					},
				},
				description:
					'DEPRECATED — use Comments instead. Kept so existing workflows keep running; it is mapped into the first entry of Comments when that is empty, and the two are never sent together.',
				options: [
					{
						displayName: 'Text',
						name: 'text',
						type: 'string',
						typeOptions: { rows: 3 },
						default: '',
						description:
							'Comment text (1-2200 characters). Leave empty to skip commenting.',
					},
					{
						displayName: 'Post to Facebook',
						name: 'postToFacebook',
						type: 'boolean',
						default: true,
						description: 'Whether to add the comment under the Facebook post',
					},
					{
						displayName: 'Post to Instagram',
						name: 'postToInstagram',
						type: 'boolean',
						default: true,
						description: 'Whether to add the comment under the Instagram post',
					},
					{
						displayName: 'Post to YouTube',
						name: 'postToYoutube',
						type: 'boolean',
						default: true,
						description: 'Whether to add the comment under the YouTube post',
					},
					{
						displayName: 'TikTok',
						name: 'tiktokNotice',
						type: 'notice',
						default: '',
						description:
							'TikTok comments are not supported by the platform. TikTok will always report "notSupported" on the comment status response.',
					},
				],
			},

			// Up to five comments, in the order they post. A fixedCollection
			// rather than a plain collection because n8n's `multipleValues` is
			// what gives an "Add Comment" button that produces a LIST.
			{
				displayName: 'Comments',
				name: 'comments',
				type: 'fixedCollection',
				placeholder: 'Add Comment',
				default: {},
				typeOptions: { multipleValues: true, maxValue: 5, sortable: true },
				displayOptions: {
					show: {
						operation: ['publishVideo', 'publishVideoToAccount', 'publishImage', 'publishImageToAccount'],
					},
				},
				description:
					'Up to five comments posted under each enabled platform once the post is published. 25 credits each, charged per comment that actually posts. TikTok is never one of them.',
				options: [
					{
						displayName: 'Comment',
						name: 'comment',
						values: [
							{
								displayName: 'Text',
								name: 'text',
								type: 'string',
								typeOptions: { rows: 3 },
								default: '',
								required: true,
								description: 'Comment text (1-2200 characters)',
							},
							{
								displayName: 'Delay (Minutes)',
								name: 'delayMinutes',
								type: 'number',
								default: 0,
								typeOptions: { minValue: 0, maxValue: 1440 },
								description:
									'How long to wait after the post is published. 0 posts it straight away; the maximum is 1440 (24 hours).',
							},
							{
								displayName: 'Image URL',
								name: 'imageUrl',
								type: 'string',
								default: '',
								description:
									'A publicly reachable image to attach. Facebook only — Instagram and YouTube comments are text-only, so an image bound for either is dropped with a reason rather than failing the comment.',
							},
							{
								displayName: 'Post to Facebook',
								name: 'postToFacebook',
								type: 'boolean',
								default: true,
								description: 'Whether to add this comment under the Facebook post',
							},
							{
								displayName: 'Post to Instagram',
								name: 'postToInstagram',
								type: 'boolean',
								default: true,
								description: 'Whether to add this comment under the Instagram post',
							},
							{
								displayName: 'Post to YouTube',
								name: 'postToYoutube',
								type: 'boolean',
								default: true,
								description: 'Whether to add this comment under the YouTube post',
							},
						],
					},
				],
			},

			// ─── Image post fields (task 6) ───────────────────────────────────
			// Image post shares the per-platform settings collections + the
			// Comment block above with the video flow. The only new inputs are
			// the image source + URL + shared caption + AI-enhance flag, plus
			// the Workspace ID / Account ID and (for account-target) the
			// platform selector.
			{
				displayName: 'Workspace ID',
				name: 'imageWorkspaceId',
				type: 'string',
				required: true,
				displayOptions: { show: { operation: ['publishImage'] } },
				default: '',
				description: 'The workspace ID to publish under',
			},
			{
				displayName: 'Account ID',
				name: 'imageAccountId',
				type: 'string',
				required: true,
				displayOptions: { show: { operation: ['publishImageToAccount'] } },
				default: '',
				description: 'The account ID to publish under',
			},
			{
				displayName: 'Image Source',
				name: 'imageSource',
				type: 'options',
				displayOptions: {
					show: { operation: ['publishImage', 'publishImageToAccount'] },
				},
				options: [
					{ name: 'External URL', value: 'image-url' },
					{ name: 'Uploaded Bucket File', value: 'image-file' },
				],
				default: 'image-url',
				description:
					'Where the image lives. "External URL" sends the URL directly; "Uploaded Bucket File" requires uploading via /generate-upload-urls first, and keeping the postId it returns.',
			},
			{
				displayName: 'Image URL',
				name: 'imageExternalUrl',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['publishImage', 'publishImageToAccount'],
						imageSource: ['image-url'],
					},
				},
				default: '',
				description: 'Public URL of the image to publish',
			},
			{
				displayName: 'Bucket File URL',
				name: 'imageBucketKey',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['publishImage', 'publishImageToAccount'],
						imageSource: ['image-file'],
					},
				},
				default: '',
				description: 'fileURL returned by /generate-upload-urls after you uploaded the image',
			},
			{
				displayName: 'Upload Post ID',
				name: 'imageUploadPostId',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['publishImage', 'publishImageToAccount'],
						imageSource: ['image-file'],
					},
				},
				default: '',
				description:
					'The postId returned together with the Bucket File URL when you requested the upload. The post is created under it so it owns the uploaded image. Leave it empty and the image is never deleted from storage — not when the post is deleted, and not by the cleanup after publishing.',
			},
			{
				displayName: 'Caption',
				name: 'imageCaption',
				type: 'string',
				typeOptions: { rows: 3 },
				required: true,
				displayOptions: {
					show: { operation: ['publishImage', 'publishImageToAccount'] },
				},
				default: '',
				description:
					'Shared caption used as the default per-platform description (1-8000 characters). Per-platform overrides still apply.',
			},
			{
				displayName: 'AI-Enhanced',
				name: 'imageAiEnhanced',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: { operation: ['publishImage', 'publishImageToAccount'] },
				},
				description: 'Marks the caption as AI-enhanced; surfaces on the status page only',
			},
			{
				displayName:
					'YouTube community image posts are not supported by the YouTube Data API and will be reported as "notSupported" on the status response.',
				name: 'imageYoutubeNotice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: { operation: ['publishImage', 'publishImageToAccount'] },
				},
			},

			// Get post status fields
			{
				displayName: 'Post ID',
				name: 'postId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['getPostStatus'],
					},
				},
				default: '',
				description: 'The ID of the post',
			},

			// List posts fields
			{
				displayName: 'Workspace ID',
				name: 'listWorkspaceId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['listPosts'],
					},
				},
				default: '',
				description: 'Filter posts by workspace ID',
			},
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['listPosts'],
					},
				},
				default: false,
				description: 'Whether to return all results or only up to a given limit',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['listPosts'],
						returnAll: [false],
					},
				},
				typeOptions: {
					minValue: 1,
					maxValue: 100,
				},
				default: 50,
				description: 'Max number of results to return',
			},
			{
				displayName: 'Post ID',
				name: 'deletePostId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['deletePost'],
					},
				},
				default: '',
				description:
					'The post to delete. Only posts that have not published yet are eligible; a published post must be taken down with Remove instead.',
			},

			// ─── Long video: quote + reschedule ──────────────────────────────
			{
				displayName: 'Video URL',
				name: 'quoteVideoUrl',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['getLongVideoQuote'],
					},
				},
				default: '',
				description:
					'URL of an uploaded or externally hosted video to measure and price. The duration is read server-side; nothing is created or charged.',
			},
			{
				displayName: 'Post ID',
				name: 'reschedulePostId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['reschedulePost'],
					},
				},
				default: '',
				description:
					'The post to move. Only posts still pending with a future publish time are eligible.',
			},
			{
				displayName: 'New Publish Time',
				name: 'rescheduleWhen',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['reschedulePost'],
					},
				},
				options: [
					{ name: 'Now', value: 'now' },
					{ name: 'Schedule for Later', value: 'later' },
				],
				default: 'later',
				description: 'Publish the post immediately, or move it to a new date',
			},
			{
				displayName: 'New Schedule Date',
				name: 'rescheduleDate',
				type: 'dateTime',
				required: true,
				displayOptions: {
					show: {
						operation: ['reschedulePost'],
						rescheduleWhen: ['later'],
					},
				},
				default: '',
				description: 'The new date and time to publish the post',
			},
			{
				displayName: 'New Caption',
				name: 'rescheduleCaption',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['reschedulePost'],
					},
				},
				default: '',
				description: 'Optionally replace the caption at the same time. Leave empty to keep it.',
			},
			{
				displayName:
					'Long video is capped at 60 minutes and charged by duration — 50 credits for every started 5 minutes. Platform limits differ: YouTube and Facebook take an hour, Instagram Reels stop at 15 minutes, and TikTok depends on the connected creator. Targets that cannot take the video are reported in "refusedTargets" and the post still publishes to the rest.',
				name: 'longVideoNotice',
				type: 'notice',
				displayOptions: {
					show: {
						operation: ['publishLongVideo', 'publishLongVideoToAccount'],
					},
				},
				default: '',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		const credentials = await this.getCredentials('posty5Api');
		const apiKey = credentials.apiKey as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: any = {};

				if (operation === 'publishVideo' || operation === 'publishVideoToAccount') {
					const workspaceId =
						operation === 'publishVideo'
							? (this.getNodeParameter('workspaceId', i) as string)
							: undefined;
					const accountId =
						operation === 'publishVideoToAccount'
							? (this.getNodeParameter('accountId', i) as string)
							: undefined;
					const videoSource = this.getNodeParameter('videoSource', i) as string;
					const thumbnailSource = this.getNodeParameter('thumbnailSource', i, 'none') as string;
					const scheduledPublishTime = this.getNodeParameter('scheduledPublishTime', i) as string;

					let videoURL: string;
					let thumbURL: string | undefined;
					let source: string;
					let uploadedPostId: string | undefined;

					// Handle video
					if (videoSource === 'binary') {
						const videoBinaryProperty = this.getNodeParameter('videoBinaryProperty', i) as string;
						const videoBuffer = await this.helpers.getBinaryDataBuffer(i, videoBinaryProperty);

						// Generate upload URLs
						const uploadUrlsResponse: any = await makeApiRequest.call(this, apiKey, {
							method: 'POST',
							endpoint: `${API_ENDPOINTS.SOCIAL_PUBLISHER_POST}/generate-upload-urls`,
							body: {
								videoFileType: 'mp4',
								thumbFileType: 'jpg',
							},
						});

						// Upload video. The post stores the public `fileURL`, not the
						// signed URL minus its query: that one is the storage API
						// host, which the publisher cannot fetch and the cleanup does
						// not recognise as ours.
						await uploadFile.call(this, uploadUrlsResponse.video.uploadFileURL, videoBuffer);
						videoURL = uploadUrlsResponse.video.fileURL;
						source = 'video-upload';
						uploadedPostId = uploadUrlsResponse.postId;

						// Handle thumbnail
						if (thumbnailSource === 'binary') {
							const thumbnailBinaryProperty = this.getNodeParameter(
								'thumbnailBinaryProperty',
								i,
							) as string;
							if (items[i].binary?.[thumbnailBinaryProperty]) {
								const thumbnailBuffer = await this.helpers.getBinaryDataBuffer(
									i,
									thumbnailBinaryProperty,
								);
								await uploadFile.call(
									this,
									uploadUrlsResponse.thumb.uploadFileURL,
									thumbnailBuffer,
								);
								thumbURL = uploadUrlsResponse.thumb.fileURL;
							}
						} else if (thumbnailSource === 'url') {
							thumbURL = this.getNodeParameter('thumbnailUrl', i) as string;
						}
					} else {
						// URL-based video
						videoURL = this.getNodeParameter('videoUrl', i) as string;

						source = 'video-url';

						if (thumbnailSource === 'url') {
							thumbURL = this.getNodeParameter('thumbnailUrl', i) as string;
						}
					}

					// Prepare post body.
					// The server derives which platforms a post lands on from the
					// workspace's connected accounts (or the account's platform).
					// We forward every settings collection the user filled in —
					// the API ignores any block whose platform isn't connected.
					const postBody: any = {
						workspaceId,
						accountId,
						videoURL,
						source,
					};

					if (thumbURL) {
						postBody.thumbURL = thumbURL;
					}

					// Handle scheduling
					if (scheduledPublishTime === 'later') {
						const scheduleDate = this.getNodeParameter('scheduleDate', i) as string;
						postBody.scheduledPublishTime = new Date(scheduleDate).toISOString();
					} else {
						postBody.scheduledPublishTime = 'now';
					}

					// Platform-specific settings — forward every non-empty block.
					// The user only fills the platforms relevant to their workspace;
					// the API ignores configs for unconnected platforms.
					const youtubeSettings = this.getNodeParameter('youtubeSettings', i, {}) as any;
					if (Object.keys(youtubeSettings).length > 0) {
						postBody.youtubeConfig = { ...youtubeSettings };
						if (youtubeSettings.tags && typeof youtubeSettings.tags === 'string') {
							postBody.youtubeConfig.tags = youtubeSettings.tags
								.split(',')
								.map((t: string) => t.trim());
						}
					}

					const tiktokSettings = this.getNodeParameter('tiktokSettings', i, {}) as any;
					if (Object.keys(tiktokSettings).length > 0) {
						postBody.tiktokConfig = tiktokSettings;
					}

					const facebookSettings = this.getNodeParameter('facebookSettings', i, {}) as any;
					if (Object.keys(facebookSettings).length > 0) {
						postBody.facebookPageConfig = facebookSettings;
					}

					const instagramSettings = this.getNodeParameter('instagramSettings', i, {}) as any;
					if (Object.keys(instagramSettings).length > 0) {
						postBody.instagramConfig = instagramSettings;
					}

					// Post-publish comments — 25 credits each, and never both shapes:
					// `comments` wins, the deprecated singular is used only when
					// the list is empty. TikTok always reports `notSupported`.
					const postComments = buildCommentsPayload(
						this.getNodeParameter('comments', i, {}) as any,
						this.getNodeParameter('comment', i, {}) as any,
					);
					if (postComments.length) {
						postBody.comments = postComments;
					}

					// Create post. An uploaded video is created under the id
					// `generate-upload-urls` reserved: its files live in that id's
					// folder, and the server only ever deletes a folder whose id
					// matches the post's own — a post given a fresh id leaks its
					// upload for good.
					const target = operation === 'publishVideo' ? 'workspace' : 'account';
					const bySegment = source === 'video-upload' ? 'by-file' : 'by-url';
					const endpoint =
						`${API_ENDPOINTS.SOCIAL_PUBLISHER_POST}/short-video/${target}/${bySegment}` +
						(uploadedPostId ? `/${uploadedPostId}` : '');

					responseData = await makeApiRequest.call(this, apiKey, {
						method: 'POST',
						endpoint,
						body: postBody,
					});
				} else if (operation === 'publishImage' || operation === 'publishImageToAccount') {
					// ─── Image post (task 6) ─────────────────────────────────
					// Image posts share most plumbing with video posts. The
					// API auto-synthesizes per-platform description blocks
					// from `caption` if not provided, so the n8n form only
					// needs source + URL/bucketKey + caption + optional comment.
					const isWorkspace = operation === 'publishImage';
					const workspaceId = isWorkspace
						? (this.getNodeParameter('imageWorkspaceId', i) as string)
						: undefined;
					const accountId = !isWorkspace
						? (this.getNodeParameter('imageAccountId', i) as string)
						: undefined;
					const imageSource = this.getNodeParameter('imageSource', i) as string;
					const caption = this.getNodeParameter('imageCaption', i) as string;
					const aiEnhanced = this.getNodeParameter('imageAiEnhanced', i, false) as boolean;

					// The image was uploaded outside this node, so the node cannot
					// reserve its id — the caller did, with `generate-upload-urls`,
					// and passes it back. The server deletes an uploaded image's
					// folder only when the folder's id is the post's own.
					const image: any = { source: imageSource };
					let uploadedPostId = '';
					if (imageSource === 'image-url') {
						image.externalUrl = this.getNodeParameter('imageExternalUrl', i) as string;
					} else {
						image.bucketKey = this.getNodeParameter('imageBucketKey', i) as string;
						uploadedPostId = (this.getNodeParameter('imageUploadPostId', i, '') as string).trim();
					}

					const imagePostBody: any = {
						workspaceId,
						accountId,
						image,
						caption,
						aiEnhanced,
					};

					// The same two collections as the video flow, through the same
					// helper — two copies of this mapping is where one of them
					// keeps sending the deprecated singular after the other stops.
					const imageComments = buildCommentsPayload(
						this.getNodeParameter('comments', i, {}) as any,
						this.getNodeParameter('comment', i, {}) as any,
					);
					if (imageComments.length) {
						imagePostBody.comments = imageComments;
					}

					const endpoint =
						`${API_ENDPOINTS.SOCIAL_PUBLISHER_POST}/image/${isWorkspace ? 'workspace' : 'account'}` +
						(uploadedPostId ? `/${uploadedPostId}` : '');

					responseData = await makeApiRequest.call(this, apiKey, {
						method: 'POST',
						endpoint,
						body: imagePostBody,
					});
				} else if (
					operation === 'publishLongVideo' ||
					operation === 'publishLongVideoToAccount'
				) {
					// ─── Long video (up to 60 minutes) ───────────────────────
					// The payload is the short-video payload. What differs is
					// duration, which the server measures from the file — there
					// is no duration field here, and one would be ignored,
					// because the price is derived from it.
					const isWorkspace = operation === 'publishLongVideo';
					const workspaceId = isWorkspace
						? (this.getNodeParameter('workspaceId', i) as string)
						: undefined;
					const accountId = !isWorkspace
						? (this.getNodeParameter('accountId', i) as string)
						: undefined;

					const videoSource = this.getNodeParameter('videoSource', i) as string;
					const thumbnailSource = this.getNodeParameter('thumbnailSource', i, 'none') as string;
					const scheduledPublishTime = this.getNodeParameter('scheduledPublishTime', i) as string;

					let videoURL: string;
					let thumbURL: string | undefined;
					let source: string;
					let uploadedPostId: string | undefined;

					if (videoSource === 'binary') {
						const videoBinaryProperty = this.getNodeParameter('videoBinaryProperty', i) as string;
						const videoBuffer = await this.helpers.getBinaryDataBuffer(i, videoBinaryProperty);

						// Declaring the post type here is what buys the early
						// refusal: the server checks plan gating and whether the
						// balance covers even the shortest long video BEFORE an
						// hour of footage is transferred.
						const uploadUrlsResponse: any = await makeApiRequest.call(this, apiKey, {
							method: 'POST',
							endpoint: `${API_ENDPOINTS.SOCIAL_PUBLISHER_POST}/generate-upload-urls`,
							body: {
								videoFileType: 'video/mp4',
								thumbFileType: thumbnailSource === 'binary' ? 'image/jpeg' : undefined,
								postType: 'longVideo',
							},
						});

						// Prefer the resumable transfer for a long video — this is
						// the case a single PUT handles worst, since a dropped
						// connection at 90% of an hour of footage otherwise starts
						// again from zero. Servers without the resumable service
						// omit the tus fields and the signed PUT still works.
						if (supportsResumableUpload(uploadUrlsResponse.video)) {
							await uploadResumable.call(this, uploadUrlsResponse.video, videoBuffer, {
								contentType: 'video/mp4',
								fileName: items[i].binary?.[videoBinaryProperty]?.fileName || 'video.mp4',
							});
						} else {
							await uploadFile.call(this, uploadUrlsResponse.video.uploadFileURL, videoBuffer);
						}
						videoURL = uploadUrlsResponse.video.fileURL;
						source = 'video-file';
						uploadedPostId = uploadUrlsResponse.postId;

						if (thumbnailSource === 'binary') {
							const thumbnailBinaryProperty = this.getNodeParameter(
								'thumbnailBinaryProperty',
								i,
							) as string;
							if (items[i].binary?.[thumbnailBinaryProperty]) {
								const thumbnailBuffer = await this.helpers.getBinaryDataBuffer(
									i,
									thumbnailBinaryProperty,
								);
								await uploadFile.call(
									this,
									uploadUrlsResponse.thumb.uploadFileURL,
									thumbnailBuffer,
								);
								thumbURL = uploadUrlsResponse.thumb.fileURL;
							}
						} else if (thumbnailSource === 'url') {
							thumbURL = this.getNodeParameter('thumbnailUrl', i) as string;
						}
					} else {
						videoURL = this.getNodeParameter('videoUrl', i) as string;
						source = 'video-url';
						if (thumbnailSource === 'url') {
							thumbURL = this.getNodeParameter('thumbnailUrl', i) as string;
						}
					}

					const longVideoBody: any = {
						workspaceId,
						accountId,
						videoURL,
						source,
					};

					if (thumbURL) {
						longVideoBody.thumbURL = thumbURL;
					}

					if (scheduledPublishTime === 'later') {
						const scheduleDate = this.getNodeParameter('scheduleDate', i) as string;
						longVideoBody.schedule = {
							type: 'schedule',
							scheduledAt: new Date(scheduleDate).toISOString(),
						};
					} else {
						longVideoBody.schedule = { type: 'now' };
					}

					const lvYoutube = this.getNodeParameter('youtubeSettings', i, {}) as any;
					if (Object.keys(lvYoutube).length > 0) {
						longVideoBody.youtube = { ...lvYoutube };
						if (lvYoutube.tags && typeof lvYoutube.tags === 'string') {
							longVideoBody.youtube.tags = lvYoutube.tags
								.split(',')
								.map((t: string) => t.trim());
						}
					}

					const lvTiktok = this.getNodeParameter('tiktokSettings', i, {}) as any;
					if (Object.keys(lvTiktok).length > 0) {
						longVideoBody.tiktok = lvTiktok;
					}

					const lvFacebook = this.getNodeParameter('facebookSettings', i, {}) as any;
					if (Object.keys(lvFacebook).length > 0) {
						longVideoBody.facebook = lvFacebook;
					}

					const lvInstagram = this.getNodeParameter('instagramSettings', i, {}) as any;
					if (Object.keys(lvInstagram).length > 0) {
						longVideoBody.instagram = lvInstagram;
					}

					const lvComment = this.getNodeParameter('comment', i, {}) as any;
					if (
						lvComment &&
						typeof lvComment.text === 'string' &&
						lvComment.text.trim().length > 0
					) {
						longVideoBody.comment = {
							text: lvComment.text,
							postToFacebook: lvComment.postToFacebook ?? true,
							postToInstagram: lvComment.postToInstagram ?? true,
							postToYoutube: lvComment.postToYoutube ?? true,
							postToTiktok: false,
						};
					}

					const target = isWorkspace ? 'workspace' : 'account';
					const bySegment = source === 'video-file' ? 'by-file' : 'by-url';
					const longVideoEndpoint =
						`${API_ENDPOINTS.SOCIAL_PUBLISHER_POST}/long-video/${target}/${bySegment}` +
						(uploadedPostId ? `/${uploadedPostId}` : '');

					// The response carries the measured duration, the credits
					// charged and any target dropped for exceeding its own
					// limit — all of it lands in the item so a later node can
					// branch on cost or on a partial publish.
					responseData = await makeApiRequest.call(this, apiKey, {
						method: 'POST',
						endpoint: longVideoEndpoint,
						body: longVideoBody,
					});
				} else if (operation === 'getLongVideoQuote') {
					// Measures and prices a video without creating or charging
					// anything, so a workflow can branch on cost before it
					// commits to publishing.
					const quoteVideoUrl = this.getNodeParameter('quoteVideoUrl', i) as string;
					responseData = await makeApiRequest.call(this, apiKey, {
						method: 'POST',
						endpoint: `${API_ENDPOINTS.SOCIAL_PUBLISHER_POST}/long-video/quote`,
						body: { videoURL: quoteVideoUrl },
					});
				} else if (operation === 'reschedulePost') {
					const reschedulePostId = this.getNodeParameter('reschedulePostId', i) as string;
					const rescheduleWhen = this.getNodeParameter('rescheduleWhen', i, 'later') as string;
					const rescheduleCaption = this.getNodeParameter('rescheduleCaption', i, '') as string;

					const rescheduleBody: any = {
						schedule:
							rescheduleWhen === 'later'
								? {
										type: 'schedule',
										scheduledAt: new Date(
											this.getNodeParameter('rescheduleDate', i) as string,
										).toISOString(),
									}
								: { type: 'now' },
					};

					if (rescheduleCaption.trim().length > 0) {
						rescheduleBody.caption = rescheduleCaption;
					}

					responseData = await makeApiRequest.call(this, apiKey, {
						method: 'PUT',
						endpoint: `${API_ENDPOINTS.SOCIAL_PUBLISHER_POST}/${reschedulePostId}`,
						body: rescheduleBody,
					});
				} else if (operation === 'deletePost') {
					// Free, and irreversible for the caller: the post is gone and its
					// uploaded media is released in the same request.
					const deletePostId = this.getNodeParameter('deletePostId', i) as string;
					responseData = await makeApiRequest.call(this, apiKey, {
						method: 'DELETE',
						endpoint: `${API_ENDPOINTS.SOCIAL_PUBLISHER_POST}/${deletePostId}`,
					});
				} else if (operation === 'getPostStatus') {
					const postId = this.getNodeParameter('postId', i) as string;
					responseData = await makeApiRequest.call(this, apiKey, {
						method: 'GET',
						endpoint: `${API_ENDPOINTS.SOCIAL_PUBLISHER_POST}/${postId}/status`,
					});
				} else if (operation === 'listPosts') {
					const workspaceId = this.getNodeParameter('listWorkspaceId', i) as string;
					const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;

					if (returnAll) {
						responseData = await makePaginatedRequest.call(
							this,
							apiKey,
							API_ENDPOINTS.SOCIAL_PUBLISHER_POST,
							{ workspaceId },
						);
					} else {
						const limit = this.getNodeParameter('limit', i, 50) as number;
						const result: any = await makeApiRequest.call(this, apiKey, {
							method: 'GET',
							endpoint: API_ENDPOINTS.SOCIAL_PUBLISHER_POST,
							qs: { workspaceId, page: 1, pageSize: limit },
						});
						responseData = result.items;
					}
				} else if (operation === 'getDefaultSettings') {
					responseData = await makeApiRequest.call(this, apiKey, {
						method: 'GET',
						endpoint: `${API_ENDPOINTS.SOCIAL_PUBLISHER_POST}/default-settings`,
					});
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
