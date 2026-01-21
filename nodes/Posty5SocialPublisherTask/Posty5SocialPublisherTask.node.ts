import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { SocialPublisherTaskClient } from '@posty5/social-publisher-task';

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
		const { HttpClient } = await import('@posty5/core');
		const http = new HttpClient({
			apiKey: credentials.apiKey as string,
			baseUrl: 'https://api.posty5.com',
		});
		const client = new SocialPublisherTaskClient(http);

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: any = {};

				if (operation === 'publishVideo') {
					const workspaceId = this.getNodeParameter('workspaceId', i) as string;
					const videoSource = this.getNodeParameter('videoSource', i) as string;
					const platforms = this.getNodeParameter('platforms', i) as string[];
					const thumbnailSource = this.getNodeParameter('thumbnailSource', i, 'none') as string;
					const scheduledPublishTime = this.getNodeParameter('scheduledPublishTime', i) as string;

					const params: any = { workspaceId, platforms };

					// Handle video
					if (videoSource === 'binary') {
						const videoBinaryProperty = this.getNodeParameter('videoBinaryProperty', i) as string;
						const videoBuffer = await this.helpers.getBinaryDataBuffer(i, videoBinaryProperty);
						const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' });
						const videoFile = new File([videoBlob], 'video.mp4', { type: 'video/mp4' });
						params.video = videoFile;
					} else {
						params.video = this.getNodeParameter('videoUrl', i) as string;
					}

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
							const thumbnailBlob = new Blob([thumbnailBuffer], { type: 'image/jpeg' });
							const thumbnailFile = new File([thumbnailBlob], 'thumbnail.jpg', {
								type: 'image/jpeg',
							});
							params.thumbnail = thumbnailFile;
						}
					} else if (thumbnailSource === 'url') {
						params.thumbnail = this.getNodeParameter('thumbnailUrl', i) as string;
					}

					// Handle scheduling
					if (scheduledPublishTime === 'later') {
						const scheduleDate = this.getNodeParameter('scheduleDate', i) as string;
						params.scheduledPublishTime = new Date(scheduleDate);
					} else {
						params.scheduledPublishTime = 'now';
					}

					// Platform-specific settings
					if (platforms.includes('youtube')) {
						const youtubeSettings = this.getNodeParameter('youtubeSettings', i, {}) as any;
						if (Object.keys(youtubeSettings).length > 0) {
							params.youtubeSettings = youtubeSettings;
							if (youtubeSettings.tags && typeof youtubeSettings.tags === 'string') {
								params.youtubeSettings.tags = youtubeSettings.tags
									.split(',')
									.map((t: string) => t.trim());
							}
						}
					}

					if (platforms.includes('tiktok')) {
						const tiktokSettings = this.getNodeParameter('tiktokSettings', i, {}) as any;
						if (Object.keys(tiktokSettings).length > 0) {
							params.tiktokSettings = tiktokSettings;
						}
					}

					if (platforms.includes('facebook')) {
						const facebookSettings = this.getNodeParameter('facebookSettings', i, {}) as any;
						if (Object.keys(facebookSettings).length > 0) {
							params.facebookSettings = facebookSettings;
						}
					}

					if (platforms.includes('instagram')) {
						const instagramSettings = this.getNodeParameter('instagramSettings', i, {}) as any;
						if (Object.keys(instagramSettings).length > 0) {
							params.instagramSettings = instagramSettings;
						}
					}

					responseData = await client.publishShortVideo(params);
				} else if (operation === 'getTaskStatus') {
					const taskId = this.getNodeParameter('taskId', i) as string;
					responseData = await client.getStatus(taskId);
				} else if (operation === 'listTasks') {
					const workspaceId = this.getNodeParameter('listWorkspaceId', i) as string;
					const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;

					const params: any = {
						workspaceId,
						page: 1,
						pageSize: returnAll ? 100 : this.getNodeParameter('limit', i, 50),
					};

					if (returnAll) {
						let allResults: any[] = [];
						let page = 1;
						let hasMore = true;

						while (hasMore) {
							const result = await client.list({}, { page, pageSize: params.pageSize });
							allResults = allResults.concat(result.items);
							hasMore = result.items.length === params.pageSize;
							page++;
						}

						responseData = allResults;
					} else {
						const result = await client.list({}, { page: 1, pageSize: params.pageSize });
						responseData = result.items;
					}
				} else if (operation === 'getDefaultSettings') {
					responseData = await client.getDefaultSettings();
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
