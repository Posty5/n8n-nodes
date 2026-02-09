import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { makeApiRequest, makePaginatedRequest, uploadFile } from '../../utils/api.helpers';
import { API_ENDPOINTS } from '../../utils/constants';

export class Posty5SocialPublisherTask implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Posty5 Social Publisher Task',
		name: 'posty5SocialPublisherTask',
		icon: 'file:posty5.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Publish videos to social media platforms',
		defaults: {
			name: 'Posty5 Social Publisher Task',
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
						name: 'Publish Video',
						value: 'publishVideo',
						description: 'Publish a video to social media platforms',
						action: 'Publish a video',
					},
					{
						name: 'Get Task Status',
						value: 'getTaskStatus',
						description: 'Get the status of a publishing task',
						action: 'Get task status',
					},
					{
						name: 'List Tasks',
						value: 'listTasks',
						description: 'List all publishing tasks',
						action: 'List tasks',
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
						operation: ['publishVideo'],
					},
				},
				default: '',
				description: 'The workspace ID to publish under',
			},
			{
				displayName: 'Video Source',
				name: 'videoSource',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['publishVideo'],
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
						operation: ['publishVideo'],
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
						operation: ['publishVideo'],
						videoSource: ['url'],
					},
				},
				default: '',
				description:
					'URL of the video to publish (can be direct URL, Facebook, TikTok, or YouTube Shorts)',
			},
			{
				displayName: 'Platforms',
				name: 'platforms',
				type: 'multiOptions',
				required: true,
				displayOptions: {
					show: {
						operation: ['publishVideo'],
					},
				},
				options: [
					{ name: 'YouTube', value: 'youtube' },
					{ name: 'TikTok', value: 'tiktok' },
					{ name: 'Facebook', value: 'facebook' },
					{ name: 'Instagram', value: 'instagram' },
				],
				default: ['youtube'],
				description: 'Platforms to publish to',
			},
			{
				displayName: 'Thumbnail Source',
				name: 'thumbnailSource',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['publishVideo'],
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
						operation: ['publishVideo'],
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
						operation: ['publishVideo'],
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
						operation: ['publishVideo'],
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
						operation: ['publishVideo'],
						scheduledPublishTime: ['later'],
					},
				},
				default: '',
				description: 'The date and time to publish',
			},

			// YouTube Settings
			{
				displayName: 'YouTube Settings',
				name: 'youtubeSettings',
				type: 'collection',
				placeholder: 'Add Setting',
				default: {},
				displayOptions: {
					show: {
						operation: ['publishVideo'],
						platforms: ['youtube'],
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
				displayName: 'TikTok Settings',
				name: 'tiktokSettings',
				type: 'collection',
				placeholder: 'Add Setting',
				default: {},
				displayOptions: {
					show: {
						operation: ['publishVideo'],
						platforms: ['tiktok'],
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
				displayName: 'Facebook Settings',
				name: 'facebookSettings',
				type: 'collection',
				placeholder: 'Add Setting',
				default: {},
				displayOptions: {
					show: {
						operation: ['publishVideo'],
						platforms: ['facebook'],
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
				displayName: 'Instagram Settings',
				name: 'instagramSettings',
				type: 'collection',
				placeholder: 'Add Setting',
				default: {},
				displayOptions: {
					show: {
						operation: ['publishVideo'],
						platforms: ['instagram'],
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

			// Get Task Status fields
			{
				displayName: 'Task ID',
				name: 'taskId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['getTaskStatus'],
					},
				},
				default: '',
				description: 'The ID of the task',
			},

			// List Tasks fields
			{
				displayName: 'Workspace ID',
				name: 'listWorkspaceId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['listTasks'],
					},
				},
				default: '',
				description: 'Filter tasks by workspace ID',
			},
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['listTasks'],
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
						operation: ['listTasks'],
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

				if (operation === 'publishVideo') {
					const workspaceId = this.getNodeParameter('workspaceId', i) as string;
					const videoSource = this.getNodeParameter('videoSource', i) as string;
					const platforms = this.getNodeParameter('platforms', i) as string[];
					const thumbnailSource = this.getNodeParameter('thumbnailSource', i, 'none') as string;
					const scheduledPublishTime = this.getNodeParameter('scheduledPublishTime', i) as string;

					let videoURL: string;
					let thumbURL: string | undefined;
					let source: string;

					// Handle video
					if (videoSource === 'binary') {
						const videoBinaryProperty = this.getNodeParameter('videoBinaryProperty', i) as string;
						const videoBuffer = await this.helpers.getBinaryDataBuffer(i, videoBinaryProperty);

						// Generate upload URLs
						const uploadUrlsResponse: any = await makeApiRequest.call(this, apiKey, {
							method: 'POST',
							endpoint: `${API_ENDPOINTS.SOCIAL_PUBLISHER_TASK}/generate-upload-urls`,
							body: {
								videoFileType: 'mp4',
								thumbFileType: 'jpg',
							},
						});

						// Upload video
						await uploadFile.call(this, uploadUrlsResponse.video.uploadFileURL, videoBuffer);
						videoURL = uploadUrlsResponse.video.uploadFileURL.split('?')[0];
						source = 'video-upload';

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
								thumbURL = uploadUrlsResponse.thumb.uploadFileURL.split('?')[0];
							}
						} else if (thumbnailSource === 'url') {
							thumbURL = this.getNodeParameter('thumbnailUrl', i) as string;
						}
					} else {
						// URL-based video
						videoURL = this.getNodeParameter('videoUrl', i) as string;

						// Detect source type from URL pattern
						if (videoURL.includes('facebook.com') || videoURL.includes('fb.watch')) {
							source = 'facebook-video';
						} else if (videoURL.includes('tiktok.com')) {
							source = 'tiktok-video';
						} else if (videoURL.includes('youtube.com') || videoURL.includes('youtu.be')) {
							source = 'youtube-video';
						} else {
							source = 'video-url';
						}

						if (thumbnailSource === 'url') {
							thumbURL = this.getNodeParameter('thumbnailUrl', i) as string;
						}
					}

					// Prepare task body
					const taskBody: any = {
						workspaceId,
						videoURL,
						source,
						platforms,
					};

					if (thumbURL) {
						taskBody.thumbURL = thumbURL;
					}

					// Handle scheduling
					if (scheduledPublishTime === 'later') {
						const scheduleDate = this.getNodeParameter('scheduleDate', i) as string;
						taskBody.scheduledPublishTime = new Date(scheduleDate).toISOString();
					} else {
						taskBody.scheduledPublishTime = 'now';
					}

					// Platform-specific settings
					if (platforms.includes('youtube')) {
						const youtubeSettings = this.getNodeParameter('youtubeSettings', i, {}) as any;
						if (Object.keys(youtubeSettings).length > 0) {
							taskBody.youtubeConfig = { ...youtubeSettings };
							if (youtubeSettings.tags && typeof youtubeSettings.tags === 'string') {
								taskBody.youtubeConfig.tags = youtubeSettings.tags
									.split(',')
									.map((t: string) => t.trim());
							}
						}
					}

					if (platforms.includes('tiktok')) {
						const tiktokSettings = this.getNodeParameter('tiktokSettings', i, {}) as any;
						if (Object.keys(tiktokSettings).length > 0) {
							taskBody.tiktokConfig = tiktokSettings;
						}
					}

					if (platforms.includes('facebook')) {
						const facebookSettings = this.getNodeParameter('facebookSettings', i, {}) as any;
						if (Object.keys(facebookSettings).length > 0) {
							taskBody.facebookPageConfig = facebookSettings;
						}
					}

					if (platforms.includes('instagram')) {
						const instagramSettings = this.getNodeParameter('instagramSettings', i, {}) as any;
						if (Object.keys(instagramSettings).length > 0) {
							taskBody.instagramConfig = instagramSettings;
						}
					}

					// Create task
					responseData = await makeApiRequest.call(this, apiKey, {
						method: 'POST',
						endpoint: API_ENDPOINTS.SOCIAL_PUBLISHER_TASK,
						body: taskBody,
					});
				} else if (operation === 'getTaskStatus') {
					const taskId = this.getNodeParameter('taskId', i) as string;
					responseData = await makeApiRequest.call(this, apiKey, {
						method: 'GET',
						endpoint: `${API_ENDPOINTS.SOCIAL_PUBLISHER_TASK}/${taskId}/status`,
					});
				} else if (operation === 'listTasks') {
					const workspaceId = this.getNodeParameter('listWorkspaceId', i) as string;
					const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;

					if (returnAll) {
						responseData = await makePaginatedRequest.call(
							this,
							apiKey,
							API_ENDPOINTS.SOCIAL_PUBLISHER_TASK,
							{ workspaceId },
						);
					} else {
						const limit = this.getNodeParameter('limit', i, 50) as number;
						const result: any = await makeApiRequest.call(this, apiKey, {
							method: 'GET',
							endpoint: API_ENDPOINTS.SOCIAL_PUBLISHER_TASK,
							qs: { workspaceId, page: 1, pageSize: limit },
						});
						responseData = result.items;
					}
				} else if (operation === 'getDefaultSettings') {
					responseData = await makeApiRequest.call(this, apiKey, {
						method: 'GET',
						endpoint: `${API_ENDPOINTS.SOCIAL_PUBLISHER_TASK}/default-settings`,
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
