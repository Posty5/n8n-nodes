import { Posty5SocialPublisherTask } from '../nodes/Posty5SocialPublisherTask/Posty5SocialPublisherTask.node';
import { createMockExecuteFunctions, TEST_CONFIG } from './setup';

describe('Posty5SocialPublisherTask', () => {
	let taskNode: Posty5SocialPublisherTask;

	beforeEach(() => {
		taskNode = new Posty5SocialPublisherTask();
		jest.clearAllMocks();
	});

	describe('Node Structure', () => {
		it('should have correct display name', () => {
			expect(taskNode.description.displayName).toBe('Posty5 Social Publisher Task');
		});

		it('should have correct node name', () => {
			expect(taskNode.description.name).toBe('posty5SocialPublisherTask');
		});

		it('should define all operations', () => {
			const operationProperty = taskNode.description.properties.find(
				(prop) => prop.name === 'operation',
			);
			expect(operationProperty).toBeDefined();
			expect(operationProperty?.type).toBe('options');

			const operations = (operationProperty as any)?.options || [];
			const operationValues = operations.map((op: any) => op.value);

			expect(operationValues).toContain('publishVideo');
			expect(operationValues).toContain('publishVideoToAccount');
			expect(operationValues).toContain('getTaskStatus');
			expect(operationValues).toContain('listTasks');
			expect(operationValues).toContain('getDefaultSettings');
			expect(operationValues).toHaveLength(5);

			const publishOp = operations.find((op: any) => op.value === 'publishVideo');
			expect(publishOp.name).toBe('Publish Video to Workspace');
		});

		it('should require posty5Api credentials', () => {
			const credentials = taskNode.description.credentials;
			expect(credentials).toBeDefined();
			expect(credentials).toHaveLength(1);
			expect(credentials?.[0].name).toBe('posty5Api');
			expect(credentials?.[0].required).toBe(true);
		});
	});

	describe('Publish Video from Binary', () => {
		it('should publish video from binary to single platform', async () => {
			const mockUploadResponse = {
				video: {
					uploadFileURL: 'https://storage.example.com/video-123?signature=abc',
				},
				thumb: {
					uploadFileURL: 'https://storage.example.com/thumb-123?signature=def',
				},
			};

			const mockTaskResponse = {
				id: 'task123',
				workspaceId: 'workspace123',
				videoURL: 'https://storage.example.com/video-123',
				source: 'video-upload',
				platforms: ['youtube'],
				status: 'pending',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'publishVideo',
					workspaceId: 'workspace123',
					videoSource: 'binary',
					videoBinaryProperty: 'data',
					platforms: ['youtube'],
					thumbnailSource: 'none',
					scheduledPublishTime: 'now',
				},
				[{ json: {}, binary: { data: { data: 'video-data', mimeType: 'video/mp4' } } }],
				{ apiKey: TEST_CONFIG.apiKey },
			);

			(mockExecuteFunctions.helpers.getBinaryDataBuffer as jest.Mock).mockResolvedValue(
				Buffer.from('fake-video-data'),
			);

			(mockExecuteFunctions.helpers.httpRequest as jest.Mock)
				.mockResolvedValueOnce(mockUploadResponse)
				.mockResolvedValueOnce({})
				.mockResolvedValueOnce(mockTaskResponse);

			const result = await taskNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					url: expect.stringMatching(/\/api\/social-publisher-task\/generate-upload-urls$/),
					body: expect.objectContaining({
						videoFileType: 'mp4',
						thumbFileType: 'jpg',
						createdFrom: 'n8n',
					}),
				}),
			);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'PUT',
					url: 'https://storage.example.com/video-123?signature=abc',
					body: expect.any(Buffer),
				}),
			);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					url: expect.stringMatching(
						/\/api\/social-publisher-task\/short-video\/workspace\/by-file$/,
					),
					body: expect.objectContaining({
						workspaceId: 'workspace123',
						videoURL: 'https://storage.example.com/video-123',
						source: 'video-upload',
						platforms: ['youtube'],
						scheduledPublishTime: 'now',
						createdFrom: 'n8n',
					}),
				}),
			);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toEqual(mockTaskResponse);
		});

		it('should publish video from binary with thumbnail', async () => {
			const mockUploadResponse = {
				video: {
					uploadFileURL: 'https://storage.example.com/video-456?signature=abc',
				},
				thumb: {
					uploadFileURL: 'https://storage.example.com/thumb-456?signature=def',
				},
			};

			const mockTaskResponse = {
				id: 'task124',
				workspaceId: 'workspace123',
				videoURL: 'https://storage.example.com/video-456',
				thumbURL: 'https://storage.example.com/thumb-456',
				source: 'video-upload',
				platforms: ['youtube'],
				status: 'pending',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'publishVideo',
					workspaceId: 'workspace123',
					videoSource: 'binary',
					videoBinaryProperty: 'data',
					platforms: ['youtube'],
					thumbnailSource: 'binary',
					thumbnailBinaryProperty: 'thumbnail',
					scheduledPublishTime: 'now',
				},
				[
					{
						json: {},
						binary: {
							data: { data: 'video-data', mimeType: 'video/mp4' },
							thumbnail: { data: 'thumb-data', mimeType: 'image/jpeg' },
						},
					},
				],
				{ apiKey: TEST_CONFIG.apiKey },
			);

			(mockExecuteFunctions.helpers.getBinaryDataBuffer as jest.Mock)
				.mockResolvedValueOnce(Buffer.from('fake-video-data'))
				.mockResolvedValueOnce(Buffer.from('fake-thumb-data'));

			(mockExecuteFunctions.helpers.httpRequest as jest.Mock)
				.mockResolvedValueOnce(mockUploadResponse)
				.mockResolvedValueOnce({})
				.mockResolvedValueOnce({})
				.mockResolvedValueOnce(mockTaskResponse);

			const result = await taskNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'PUT',
					url: 'https://storage.example.com/thumb-456?signature=def',
					body: expect.any(Buffer),
				}),
			);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					url: expect.stringMatching(
						/\/api\/social-publisher-task\/short-video\/workspace\/by-file$/,
					),
					body: expect.objectContaining({
						thumbURL: 'https://storage.example.com/thumb-456',
						createdFrom: 'n8n',
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockTaskResponse);
		});

		it('should publish video from binary to multiple platforms', async () => {
			const mockUploadResponse = {
				video: {
					uploadFileURL: 'https://storage.example.com/video-789?signature=abc',
				},
				thumb: {
					uploadFileURL: 'https://storage.example.com/thumb-789?signature=def',
				},
			};

			const mockTaskResponse = {
				id: 'task125',
				workspaceId: 'workspace123',
				videoURL: 'https://storage.example.com/video-789',
				source: 'video-upload',
				platforms: ['youtube', 'tiktok'],
				status: 'pending',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'publishVideo',
					workspaceId: 'workspace123',
					videoSource: 'binary',
					videoBinaryProperty: 'data',
					platforms: ['youtube', 'tiktok'],
					thumbnailSource: 'none',
					scheduledPublishTime: 'now',
				},
				[{ json: {}, binary: { data: { data: 'video-data', mimeType: 'video/mp4' } } }],
				{ apiKey: TEST_CONFIG.apiKey },
			);

			(mockExecuteFunctions.helpers.getBinaryDataBuffer as jest.Mock).mockResolvedValue(
				Buffer.from('fake-video-data'),
			);

			(mockExecuteFunctions.helpers.httpRequest as jest.Mock)
				.mockResolvedValueOnce(mockUploadResponse)
				.mockResolvedValueOnce({})
				.mockResolvedValueOnce(mockTaskResponse);

			const result = await taskNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					url: expect.stringMatching(
						/\/api\/social-publisher-task\/short-video\/workspace\/by-file$/,
					),
					body: expect.objectContaining({
						platforms: ['youtube', 'tiktok'],
						createdFrom: 'n8n',
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockTaskResponse);
		});

		it('should publish video from binary with scheduled time', async () => {
			const mockUploadResponse = {
				video: {
					uploadFileURL: 'https://storage.example.com/video-scheduled?signature=abc',
				},
				thumb: {
					uploadFileURL: 'https://storage.example.com/thumb-scheduled?signature=def',
				},
			};

			const mockTaskResponse = {
				id: 'task126',
				workspaceId: 'workspace123',
				videoURL: 'https://storage.example.com/video-scheduled',
				source: 'video-upload',
				platforms: ['youtube'],
				scheduledPublishTime: '2026-03-15T10:00:00.000Z',
				status: 'scheduled',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'publishVideo',
					workspaceId: 'workspace123',
					videoSource: 'binary',
					videoBinaryProperty: 'data',
					platforms: ['youtube'],
					thumbnailSource: 'none',
					scheduledPublishTime: 'later',
					scheduleDate: '2026-03-15T10:00:00.000Z',
				},
				[{ json: {}, binary: { data: { data: 'video-data', mimeType: 'video/mp4' } } }],
				{ apiKey: TEST_CONFIG.apiKey },
			);

			(mockExecuteFunctions.helpers.getBinaryDataBuffer as jest.Mock).mockResolvedValue(
				Buffer.from('fake-video-data'),
			);

			(mockExecuteFunctions.helpers.httpRequest as jest.Mock)
				.mockResolvedValueOnce(mockUploadResponse)
				.mockResolvedValueOnce({})
				.mockResolvedValueOnce(mockTaskResponse);

			const result = await taskNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					url: expect.stringMatching(
						/\/api\/social-publisher-task\/short-video\/workspace\/by-file$/,
					),
					body: expect.objectContaining({
						scheduledPublishTime: expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
						createdFrom: 'n8n',
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockTaskResponse);
		});
	});

	describe('Publish Video from URL', () => {
		it('should publish video from URL (video-url source)', async () => {
			const mockTaskResponse = {
				id: 'task127',
				workspaceId: 'workspace123',
				videoURL: 'https://example.com/video.mp4',
				source: 'video-url',
				platforms: ['youtube'],
				status: 'pending',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'publishVideo',
					workspaceId: 'workspace123',
					videoSource: 'url',
					videoUrl: 'https://example.com/video.mp4',
					platforms: ['youtube'],
					thumbnailSource: 'none',
					scheduledPublishTime: 'now',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockTaskResponse,
			);

			const result = await taskNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					url: expect.stringMatching(
						/\/api\/social-publisher-task\/short-video\/workspace\/by-url$/,
					),
					body: expect.objectContaining({
						videoURL: 'https://example.com/video.mp4',
						source: 'video-url',
						createdFrom: 'n8n',
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockTaskResponse);
		});

		it('should publish video from Facebook URL (facebook-video source)', async () => {
			const mockTaskResponse = {
				id: 'task128',
				workspaceId: 'workspace123',
				videoURL: 'https://www.facebook.com/watch?v=123456789',
				source: 'facebook-video',
				platforms: ['youtube'],
				status: 'pending',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'publishVideo',
					workspaceId: 'workspace123',
					videoSource: 'url',
					videoUrl: 'https://www.facebook.com/watch?v=123456789',
					platforms: ['youtube'],
					thumbnailSource: 'none',
					scheduledPublishTime: 'now',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockTaskResponse,
			);

			const result = await taskNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					url: expect.stringMatching(
						/\/api\/social-publisher-task\/short-video\/workspace\/by-url$/,
					),
					body: expect.objectContaining({
						videoURL: 'https://www.facebook.com/watch?v=123456789',
						source: 'facebook-video',
						createdFrom: 'n8n',
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockTaskResponse);
		});

		it('should publish video from TikTok URL (tiktok-video source)', async () => {
			const mockTaskResponse = {
				id: 'task129',
				workspaceId: 'workspace123',
				videoURL: 'https://www.tiktok.com/@user/video/123456789',
				source: 'tiktok-video',
				platforms: ['youtube'],
				status: 'pending',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'publishVideo',
					workspaceId: 'workspace123',
					videoSource: 'url',
					videoUrl: 'https://www.tiktok.com/@user/video/123456789',
					platforms: ['youtube'],
					thumbnailSource: 'none',
					scheduledPublishTime: 'now',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockTaskResponse,
			);

			const result = await taskNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					url: expect.stringMatching(
						/\/api\/social-publisher-task\/short-video\/workspace\/by-url$/,
					),
					body: expect.objectContaining({
						videoURL: 'https://www.tiktok.com/@user/video/123456789',
						source: 'tiktok-video',
						createdFrom: 'n8n',
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockTaskResponse);
		});

		it('should publish video from YouTube URL (youtube-video source)', async () => {
			const mockTaskResponse = {
				id: 'task130',
				workspaceId: 'workspace123',
				videoURL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
				source: 'youtube-video',
				platforms: ['tiktok'],
				status: 'pending',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'publishVideo',
					workspaceId: 'workspace123',
					videoSource: 'url',
					videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
					platforms: ['tiktok'],
					thumbnailSource: 'none',
					scheduledPublishTime: 'now',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockTaskResponse,
			);

			const result = await taskNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					url: expect.stringMatching(
						/\/api\/social-publisher-task\/short-video\/workspace\/by-url$/,
					),
					body: expect.objectContaining({
						videoURL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
						source: 'youtube-video',
						createdFrom: 'n8n',
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockTaskResponse);
		});
	});

	describe('Publish Video with Platform Settings', () => {
		it('should publish with YouTube settings', async () => {
			const mockTaskResponse = {
				id: 'task131',
				workspaceId: 'workspace123',
				videoURL: 'https://example.com/video.mp4',
				source: 'video-url',
				platforms: ['youtube'],
				youtubeConfig: {
					title: 'My Video Title',
					description: 'My video description',
					tags: ['tag1', 'tag2', 'tag3'],
					madeForKids: true,
				},
				status: 'pending',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'publishVideo',
					workspaceId: 'workspace123',
					videoSource: 'url',
					videoUrl: 'https://example.com/video.mp4',
					platforms: ['youtube'],
					youtubeSettings: {
						title: 'My Video Title',
						description: 'My video description',
						tags: 'tag1, tag2, tag3',
						madeForKids: true,
					},
					thumbnailSource: 'none',
					scheduledPublishTime: 'now',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockTaskResponse,
			);

			const result = await taskNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					url: expect.stringMatching(
						/\/api\/social-publisher-task\/short-video\/workspace\/by-url$/,
					),
					body: expect.objectContaining({
						youtubeConfig: expect.objectContaining({
							title: 'My Video Title',
							description: 'My video description',
							tags: ['tag1', 'tag2', 'tag3'],
							madeForKids: true,
						}),
						createdFrom: 'n8n',
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockTaskResponse);
		});

		it('should publish with TikTok settings', async () => {
			const mockTaskResponse = {
				id: 'task132',
				workspaceId: 'workspace123',
				videoURL: 'https://example.com/video.mp4',
				source: 'video-url',
				platforms: ['tiktok'],
				tiktokConfig: {
					caption: 'Check this out! #viral',
					privacy_level: 'PUBLIC_TO_EVERYONE',
					disable_duet: true,
					disable_stitch: true,
					disable_comment: false,
				},
				status: 'pending',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'publishVideo',
					workspaceId: 'workspace123',
					videoSource: 'url',
					videoUrl: 'https://example.com/video.mp4',
					platforms: ['tiktok'],
					tiktokSettings: {
						caption: 'Check this out! #viral',
						privacy_level: 'PUBLIC_TO_EVERYONE',
						disable_duet: true,
						disable_stitch: true,
						disable_comment: false,
					},
					thumbnailSource: 'none',
					scheduledPublishTime: 'now',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockTaskResponse,
			);

			const result = await taskNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					url: expect.stringMatching(
						/\/api\/social-publisher-task\/short-video\/workspace\/by-url$/,
					),
					body: expect.objectContaining({
						tiktokConfig: expect.objectContaining({
							caption: 'Check this out! #viral',
							privacy_level: 'PUBLIC_TO_EVERYONE',
							disable_duet: true,
							disable_stitch: true,
							disable_comment: false,
						}),
						createdFrom: 'n8n',
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockTaskResponse);
		});

		it('should publish with Facebook settings', async () => {
			const mockTaskResponse = {
				id: 'task133',
				workspaceId: 'workspace123',
				videoURL: 'https://example.com/video.mp4',
				source: 'video-url',
				platforms: ['facebook'],
				facebookPageConfig: {
					title: 'Facebook Video Title',
					description: 'Facebook video description',
				},
				status: 'pending',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'publishVideo',
					workspaceId: 'workspace123',
					videoSource: 'url',
					videoUrl: 'https://example.com/video.mp4',
					platforms: ['facebook'],
					facebookSettings: {
						title: 'Facebook Video Title',
						description: 'Facebook video description',
					},
					thumbnailSource: 'none',
					scheduledPublishTime: 'now',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockTaskResponse,
			);

			const result = await taskNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					url: expect.stringMatching(
						/\/api\/social-publisher-task\/short-video\/workspace\/by-url$/,
					),
					body: expect.objectContaining({
						facebookPageConfig: expect.objectContaining({
							title: 'Facebook Video Title',
							description: 'Facebook video description',
						}),
						createdFrom: 'n8n',
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockTaskResponse);
		});

		it('should publish with Instagram settings', async () => {
			const mockTaskResponse = {
				id: 'task134',
				workspaceId: 'workspace123',
				videoURL: 'https://example.com/video.mp4',
				source: 'video-url',
				platforms: ['instagram'],
				instagramConfig: {
					description: 'Instagram caption with #hashtags',
					share_to_feed: true,
				},
				status: 'pending',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'publishVideo',
					workspaceId: 'workspace123',
					videoSource: 'url',
					videoUrl: 'https://example.com/video.mp4',
					platforms: ['instagram'],
					instagramSettings: {
						description: 'Instagram caption with #hashtags',
						share_to_feed: true,
					},
					thumbnailSource: 'none',
					scheduledPublishTime: 'now',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockTaskResponse,
			);

			const result = await taskNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					url: expect.stringMatching(
						/\/api\/social-publisher-task\/short-video\/workspace\/by-url$/,
					),
					body: expect.objectContaining({
						instagramConfig: expect.objectContaining({
							description: 'Instagram caption with #hashtags',
							share_to_feed: true,
						}),
						createdFrom: 'n8n',
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockTaskResponse);
		});
	});

	describe('Get Task Status', () => {
		it('should get task status by taskId', async () => {
			const mockResponse = {
				id: 'task123',
				status: 'completed',
				platforms: ['youtube', 'tiktok'],
				results: {
					youtube: { status: 'published', videoId: 'yt123' },
					tiktok: { status: 'published', videoId: 'tk456' },
				},
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'getTaskStatus',
					taskId: 'task123',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await taskNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'GET',
					url: expect.stringMatching(/\/api\/social-publisher-task\/task123\/status$/),
				}),
			);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toEqual(mockResponse);
		});
	});

	describe('List Tasks', () => {
		it('should list tasks with workspaceId and limit', async () => {
			const mockResponse = {
				items: [
					{ id: 'task1', status: 'pending', platforms: ['youtube'] },
					{ id: 'task2', status: 'completed', platforms: ['tiktok'] },
				],
				total: 2,
				page: 1,
				pageSize: 50,
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'listTasks',
					listWorkspaceId: 'workspace123',
					returnAll: false,
					limit: 50,
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await taskNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'GET',
					url: expect.stringMatching(/\/api\/social-publisher-task$/),
					qs: expect.objectContaining({
						workspaceId: 'workspace123',
						page: 1,
						pageSize: 50,
					}),
				}),
			);

			expect(result[0]).toHaveLength(2);
			expect(result[0][0].json.id).toBe('task1');
			expect(result[0][1].json.id).toBe('task2');
		});

		it('should list tasks with returnAll=true', async () => {
			const mockResponse = [
				{ id: 'task1', status: 'pending', platforms: ['youtube'] },
				{ id: 'task2', status: 'completed', platforms: ['tiktok'] },
				{ id: 'task3', status: 'failed', platforms: ['facebook'] },
			];

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'listTasks',
					listWorkspaceId: 'workspace123',
					returnAll: true,
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await taskNode.execute.call(mockExecuteFunctions);

			expect(result[0]).toHaveLength(3);
			expect(result[0][0].json.id).toBe('task1');
			expect(result[0][1].json.id).toBe('task2');
			expect(result[0][2].json.id).toBe('task3');
		});
	});

	describe('Get Default Settings', () => {
		it('should get default platform settings', async () => {
			const mockResponse = {
				youtube: {
					defaultTitle: 'Video Title',
					defaultDescription: 'Video Description',
					defaultTags: ['tag1', 'tag2'],
					madeForKids: false,
				},
				tiktok: {
					defaultCaption: '',
					privacy_level: 'PUBLIC_TO_EVERYONE',
					disable_duet: false,
					disable_stitch: false,
					disable_comment: false,
				},
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'getDefaultSettings',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockResponse,
			);

			const result = await taskNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'GET',
					url: expect.stringMatching(/\/api\/social-publisher-task\/default-settings$/),
				}),
			);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toEqual(mockResponse);
		});
	});

	describe('Error Handling', () => {
		it('should throw error when continueOnFail=false', async () => {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'publishVideo',
					workspaceId: 'workspace123',
					videoSource: 'url',
					videoUrl: 'https://example.com/video.mp4',
					platforms: ['youtube'],
					thumbnailSource: 'none',
					scheduledPublishTime: 'now',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
			);

			(mockExecuteFunctions.helpers.httpRequest as jest.Mock).mockRejectedValue(
				new Error('API Error: Invalid workspace'),
			);

			await expect(taskNode.execute.call(mockExecuteFunctions)).rejects.toThrow(
				'API Error: Invalid workspace',
			);
		});

		it('should return error in JSON when continueOnFail=true', async () => {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'publishVideo',
					workspaceId: 'workspace123',
					videoSource: 'url',
					videoUrl: 'https://example.com/video.mp4',
					platforms: ['youtube'],
					thumbnailSource: 'none',
					scheduledPublishTime: 'now',
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
			);

			(mockExecuteFunctions.continueOnFail as jest.Mock).mockReturnValue(true);
			(mockExecuteFunctions.helpers.httpRequest as jest.Mock).mockRejectedValue(
				new Error('API Error: Invalid workspace'),
			);

			const result = await taskNode.execute.call(mockExecuteFunctions);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json.error).toContain('API Error: Invalid workspace');
		});
	});

	describe('Multiple Items', () => {
		it('should process 2 items in batch', async () => {
			const mockTaskResponse1 = {
				id: 'task201',
				workspaceId: 'workspace123',
				videoURL: 'https://example.com/video1.mp4',
				source: 'video-url',
				platforms: ['youtube'],
				status: 'pending',
			};

			const mockTaskResponse2 = {
				id: 'task202',
				workspaceId: 'workspace123',
				videoURL: 'https://example.com/video2.mp4',
				source: 'video-url',
				platforms: ['tiktok'],
				status: 'pending',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'publishVideo',
					workspaceId: 'workspace123',
					videoSource: 'url',
					videoUrl: 'https://example.com/video1.mp4',
					platforms: ['youtube'],
					thumbnailSource: 'none',
					scheduledPublishTime: 'now',
				},
				[{ json: { video: 'video1' } }, { json: { video: 'video2' } }],
				{ apiKey: TEST_CONFIG.apiKey },
			);

			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
				(paramName: string, itemIndex: number, fallbackValue?: any) => {
					if (itemIndex === 0) {
						if (paramName === 'videoUrl') return 'https://example.com/video1.mp4';
						if (paramName === 'platforms') return ['youtube'];
					} else if (itemIndex === 1) {
						if (paramName === 'videoUrl') return 'https://example.com/video2.mp4';
						if (paramName === 'platforms') return ['tiktok'];
					}
					if (paramName === 'workspaceId') return 'workspace123';
					if (paramName === 'operation') return 'publishVideo';
					if (paramName === 'videoSource') return 'url';
					if (paramName === 'thumbnailSource') return 'none';
					if (paramName === 'scheduledPublishTime') return 'now';
					return fallbackValue;
				},
			);

			(mockExecuteFunctions.helpers.httpRequest as jest.Mock)
				.mockResolvedValueOnce(mockTaskResponse1)
				.mockResolvedValueOnce(mockTaskResponse2);

			const result = await taskNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledTimes(2);
			expect(result[0]).toHaveLength(2);
			expect(result[0][0].json.id).toBe('task201');
			expect(result[0][1].json.id).toBe('task202');
		});
	});
});
