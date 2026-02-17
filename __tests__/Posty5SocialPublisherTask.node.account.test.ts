import { Posty5SocialPublisherTask } from '../nodes/Posty5SocialPublisherTask/Posty5SocialPublisherTask.node';
import { createMockExecuteFunctions, TEST_CONFIG } from './setup';

describe('Posty5SocialPublisherTask - Account', () => {
	let taskNode: Posty5SocialPublisherTask;

	beforeEach(() => {
		taskNode = new Posty5SocialPublisherTask();
		jest.clearAllMocks();
	});

	describe('Publish Video to Account', () => {
		it('should publish video from binary to account', async () => {
			const mockUploadResponse = {
				video: {
					uploadFileURL: 'https://storage.example.com/video-acc-123?signature=abc',
				},
				thumb: {
					uploadFileURL: 'https://storage.example.com/thumb-acc-123?signature=def',
				},
			};

			const mockTaskResponse = {
				id: 'task-acc-123',
				accountId: 'account123',
				videoURL: 'https://storage.example.com/video-acc-123',
				source: 'video-upload',
				platforms: ['tiktok'],
				status: 'pending',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'publishVideoToAccount',
					accountId: 'account123',
					videoSource: 'binary',
					videoBinaryProperty: 'data',
					platforms: ['tiktok'],
					thumbnailSource: 'none',
					scheduledPublishTime: 'now',
					tiktokSettings: {
						caption: 'Account Video',
						privacy_level: 'SELF_ONLY',
					},
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
				}),
			);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					url: expect.stringMatching(
						/\/api\/social-publisher-task\/short-video\/account\/by-file$/,
					),
					body: expect.objectContaining({
						accountId: 'account123',
						videoURL: 'https://storage.example.com/video-acc-123',
						source: 'video-upload',
						platforms: ['tiktok'],
						tiktokConfig: expect.objectContaining({
							caption: 'Account Video',
							privacy_level: 'SELF_ONLY',
						}),
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockTaskResponse);
		});

		it('should publish video from URL to account', async () => {
			const mockTaskResponse = {
				id: 'task-acc-url-123',
				accountId: 'account123',
				videoURL: 'https://example.com/video.mp4',
				source: 'video-url',
				platforms: ['youtube'],
				status: 'pending',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'publishVideoToAccount',
					accountId: 'account123',
					videoSource: 'url',
					videoUrl: 'https://example.com/video.mp4',
					platforms: ['youtube'],
					thumbnailSource: 'none',
					scheduledPublishTime: 'now',
					youtubeSettings: {
						title: 'Account URL Video',
						description: 'Description',
					},
				},
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				mockTaskResponse,
			);

			const result = await taskNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					url: expect.stringMatching(/\/api\/social-publisher-task\/short-video\/account\/by-url$/),
					body: expect.objectContaining({
						accountId: 'account123',
						videoURL: 'https://example.com/video.mp4',
						source: 'video-url',
						platforms: ['youtube'],
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockTaskResponse);
		});
	});

	describe('Publish Video to Account - Binary Variants', () => {
		it('should publish video from binary with thumbnail to account', async () => {
			const mockUploadResponse = {
				video: {
					uploadFileURL: 'https://storage.example.com/video-acc-456?signature=abc',
				},
				thumb: {
					uploadFileURL: 'https://storage.example.com/thumb-acc-456?signature=def',
				},
			};

			const mockTaskResponse = {
				id: 'task-acc-thumb-456',
				accountId: 'account456',
				videoURL: 'https://storage.example.com/video-acc-456',
				thumbURL: 'https://storage.example.com/thumb-acc-456',
				source: 'video-upload',
				platforms: ['youtube'],
				status: 'pending',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'publishVideoToAccount',
					accountId: 'account456',
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
					url: 'https://storage.example.com/thumb-acc-456?signature=def',
					body: expect.any(Buffer),
				}),
			);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					url: expect.stringMatching(
						/\/api\/social-publisher-task\/short-video\/account\/by-file$/,
					),
					body: expect.objectContaining({
						accountId: 'account456',
						thumbURL: 'https://storage.example.com/thumb-acc-456',
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockTaskResponse);
		});

		it('should publish video from binary to multiple platforms on account', async () => {
			const mockUploadResponse = {
				video: {
					uploadFileURL: 'https://storage.example.com/video-acc-multi?signature=abc',
				},
				thumb: {
					uploadFileURL: 'https://storage.example.com/thumb-acc-multi?signature=def',
				},
			};

			const mockTaskResponse = {
				id: 'task-acc-multi',
				accountId: 'account789',
				videoURL: 'https://storage.example.com/video-acc-multi',
				source: 'video-upload',
				platforms: ['youtube', 'tiktok', 'facebook'],
				status: 'pending',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'publishVideoToAccount',
					accountId: 'account789',
					videoSource: 'binary',
					videoBinaryProperty: 'data',
					platforms: ['youtube', 'tiktok', 'facebook'],
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
						/\/api\/social-publisher-task\/short-video\/account\/by-file$/,
					),
					body: expect.objectContaining({
						accountId: 'account789',
						platforms: ['youtube', 'tiktok', 'facebook'],
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockTaskResponse);
		});

		it('should publish video from binary with scheduled time to account', async () => {
			const mockUploadResponse = {
				video: {
					uploadFileURL: 'https://storage.example.com/video-acc-sched?signature=abc',
				},
				thumb: {
					uploadFileURL: 'https://storage.example.com/thumb-acc-sched?signature=def',
				},
			};

			const mockTaskResponse = {
				id: 'task-acc-sched',
				accountId: 'account-sched',
				videoURL: 'https://storage.example.com/video-acc-sched',
				source: 'video-upload',
				platforms: ['tiktok'],
				scheduledPublishTime: '2026-06-01T14:00:00.000Z',
				status: 'scheduled',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'publishVideoToAccount',
					accountId: 'account-sched',
					videoSource: 'binary',
					videoBinaryProperty: 'data',
					platforms: ['tiktok'],
					thumbnailSource: 'none',
					scheduledPublishTime: 'later',
					scheduleDate: '2026-06-01T14:00:00.000Z',
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
						/\/api\/social-publisher-task\/short-video\/account\/by-file$/,
					),
					body: expect.objectContaining({
						accountId: 'account-sched',
						scheduledPublishTime: expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockTaskResponse);
		});
	});

	describe('Publish Video to Account - URL Source Detection', () => {
		it('should detect Facebook video source from URL', async () => {
			const mockTaskResponse = {
				id: 'task-acc-fb',
				accountId: 'account-fb',
				videoURL: 'https://www.facebook.com/watch?v=987654321',
				source: 'facebook-video',
				platforms: ['facebook'],
				status: 'pending',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'publishVideoToAccount',
					accountId: 'account-fb',
					videoSource: 'url',
					videoUrl: 'https://www.facebook.com/watch?v=987654321',
					platforms: ['facebook'],
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
						/\/api\/social-publisher-task\/short-video\/account\/by-url$/,
					),
					body: expect.objectContaining({
						accountId: 'account-fb',
						videoURL: 'https://www.facebook.com/watch?v=987654321',
						source: 'facebook-video',
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockTaskResponse);
		});

		it('should detect TikTok video source from URL', async () => {
			const mockTaskResponse = {
				id: 'task-acc-tt',
				accountId: 'account-tt',
				videoURL: 'https://www.tiktok.com/@creator/video/111222333',
				source: 'tiktok-video',
				platforms: ['tiktok'],
				status: 'pending',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'publishVideoToAccount',
					accountId: 'account-tt',
					videoSource: 'url',
					videoUrl: 'https://www.tiktok.com/@creator/video/111222333',
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
						/\/api\/social-publisher-task\/short-video\/account\/by-url$/,
					),
					body: expect.objectContaining({
						accountId: 'account-tt',
						videoURL: 'https://www.tiktok.com/@creator/video/111222333',
						source: 'tiktok-video',
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockTaskResponse);
		});

		it('should detect YouTube video source from URL', async () => {
			const mockTaskResponse = {
				id: 'task-acc-yt',
				accountId: 'account-yt',
				videoURL: 'https://www.youtube.com/watch?v=abcdef12345',
				source: 'youtube-video',
				platforms: ['youtube'],
				status: 'pending',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'publishVideoToAccount',
					accountId: 'account-yt',
					videoSource: 'url',
					videoUrl: 'https://www.youtube.com/watch?v=abcdef12345',
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
						/\/api\/social-publisher-task\/short-video\/account\/by-url$/,
					),
					body: expect.objectContaining({
						accountId: 'account-yt',
						videoURL: 'https://www.youtube.com/watch?v=abcdef12345',
						source: 'youtube-video',
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockTaskResponse);
		});

		it('should use generic video-url source for non-social URLs', async () => {
			const mockTaskResponse = {
				id: 'task-acc-generic',
				accountId: 'account-gen',
				videoURL: 'https://cdn.example.com/my-video.mp4',
				source: 'video-url',
				platforms: ['youtube'],
				status: 'pending',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'publishVideoToAccount',
					accountId: 'account-gen',
					videoSource: 'url',
					videoUrl: 'https://cdn.example.com/my-video.mp4',
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
						/\/api\/social-publisher-task\/short-video\/account\/by-url$/,
					),
					body: expect.objectContaining({
						accountId: 'account-gen',
						source: 'video-url',
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockTaskResponse);
		});
	});

	describe('Publish Video to Account - Platform Settings', () => {
		it('should publish to account with YouTube settings', async () => {
			const mockTaskResponse = {
				id: 'task-acc-yt-cfg',
				accountId: 'account-yt-cfg',
				videoURL: 'https://example.com/video.mp4',
				source: 'video-url',
				platforms: ['youtube'],
				youtubeConfig: {
					title: 'Account YT Title',
					description: 'Account YT Description',
					tags: ['acc-tag1', 'acc-tag2'],
					madeForKids: false,
				},
				status: 'pending',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'publishVideoToAccount',
					accountId: 'account-yt-cfg',
					videoSource: 'url',
					videoUrl: 'https://example.com/video.mp4',
					platforms: ['youtube'],
					youtubeSettings: {
						title: 'Account YT Title',
						description: 'Account YT Description',
						tags: 'acc-tag1, acc-tag2',
						madeForKids: false,
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
						/\/api\/social-publisher-task\/short-video\/account\/by-url$/,
					),
					body: expect.objectContaining({
						accountId: 'account-yt-cfg',
						youtubeConfig: expect.objectContaining({
							title: 'Account YT Title',
							description: 'Account YT Description',
							tags: ['acc-tag1', 'acc-tag2'],
							madeForKids: false,
						}),
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockTaskResponse);
		});

		it('should publish to account with TikTok settings', async () => {
			const mockTaskResponse = {
				id: 'task-acc-tt-cfg',
				accountId: 'account-tt-cfg',
				videoURL: 'https://example.com/video.mp4',
				source: 'video-url',
				platforms: ['tiktok'],
				tiktokConfig: {
					caption: 'Account TikTok video #account',
					privacy_level: 'MUTUAL_FOLLOW_FRIENDS',
					disable_duet: false,
					disable_stitch: false,
					disable_comment: true,
				},
				status: 'pending',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'publishVideoToAccount',
					accountId: 'account-tt-cfg',
					videoSource: 'url',
					videoUrl: 'https://example.com/video.mp4',
					platforms: ['tiktok'],
					tiktokSettings: {
						caption: 'Account TikTok video #account',
						privacy_level: 'MUTUAL_FOLLOW_FRIENDS',
						disable_duet: false,
						disable_stitch: false,
						disable_comment: true,
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
						/\/api\/social-publisher-task\/short-video\/account\/by-url$/,
					),
					body: expect.objectContaining({
						accountId: 'account-tt-cfg',
						tiktokConfig: expect.objectContaining({
							caption: 'Account TikTok video #account',
							privacy_level: 'MUTUAL_FOLLOW_FRIENDS',
							disable_duet: false,
							disable_stitch: false,
							disable_comment: true,
						}),
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockTaskResponse);
		});

		it('should publish to account with Facebook settings', async () => {
			const mockTaskResponse = {
				id: 'task-acc-fb-cfg',
				accountId: 'account-fb-cfg',
				videoURL: 'https://example.com/video.mp4',
				source: 'video-url',
				platforms: ['facebook'],
				facebookPageConfig: {
					title: 'Account FB Title',
					description: 'Account FB Description',
				},
				status: 'pending',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'publishVideoToAccount',
					accountId: 'account-fb-cfg',
					videoSource: 'url',
					videoUrl: 'https://example.com/video.mp4',
					platforms: ['facebook'],
					facebookSettings: {
						title: 'Account FB Title',
						description: 'Account FB Description',
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
						/\/api\/social-publisher-task\/short-video\/account\/by-url$/,
					),
					body: expect.objectContaining({
						accountId: 'account-fb-cfg',
						facebookPageConfig: expect.objectContaining({
							title: 'Account FB Title',
							description: 'Account FB Description',
						}),
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockTaskResponse);
		});

		it('should publish to account with Instagram settings', async () => {
			const mockTaskResponse = {
				id: 'task-acc-ig-cfg',
				accountId: 'account-ig-cfg',
				videoURL: 'https://example.com/video.mp4',
				source: 'video-url',
				platforms: ['instagram'],
				instagramConfig: {
					description: 'Account IG caption #reels',
					share_to_feed: false,
				},
				status: 'pending',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'publishVideoToAccount',
					accountId: 'account-ig-cfg',
					videoSource: 'url',
					videoUrl: 'https://example.com/video.mp4',
					platforms: ['instagram'],
					instagramSettings: {
						description: 'Account IG caption #reels',
						share_to_feed: false,
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
						/\/api\/social-publisher-task\/short-video\/account\/by-url$/,
					),
					body: expect.objectContaining({
						accountId: 'account-ig-cfg',
						instagramConfig: expect.objectContaining({
							description: 'Account IG caption #reels',
							share_to_feed: false,
						}),
					}),
				}),
			);

			expect(result[0][0].json).toEqual(mockTaskResponse);
		});
	});

	describe('Publish Video to Account - Error Handling', () => {
		it('should throw error when continueOnFail=false for account publish', async () => {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'publishVideoToAccount',
					accountId: 'account-err',
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
				new Error('API Error: Account not found'),
			);

			await expect(taskNode.execute.call(mockExecuteFunctions)).rejects.toThrow(
				'API Error: Account not found',
			);
		});

		it('should return error in JSON when continueOnFail=true for account publish', async () => {
			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'publishVideoToAccount',
					accountId: 'account-err',
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
				new Error('API Error: Invalid account permissions'),
			);

			const result = await taskNode.execute.call(mockExecuteFunctions);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json.error).toContain('API Error: Invalid account permissions');
		});
	});

	describe('Publish Video to Account - Multiple Items', () => {
		it('should process multiple account publish items in batch', async () => {
			const mockTaskResponse1 = {
				id: 'task-acc-batch-1',
				accountId: 'account-batch',
				videoURL: 'https://example.com/video1.mp4',
				source: 'video-url',
				platforms: ['youtube'],
				status: 'pending',
			};

			const mockTaskResponse2 = {
				id: 'task-acc-batch-2',
				accountId: 'account-batch',
				videoURL: 'https://example.com/video2.mp4',
				source: 'video-url',
				platforms: ['tiktok'],
				status: 'pending',
			};

			const mockExecuteFunctions = createMockExecuteFunctions(
				{
					operation: 'publishVideoToAccount',
					accountId: 'account-batch',
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
					if (paramName === 'operation') return 'publishVideoToAccount';
					if (paramName === 'accountId') return 'account-batch';
					if (paramName === 'videoSource') return 'url';
					if (paramName === 'thumbnailSource') return 'none';
					if (paramName === 'scheduledPublishTime') return 'now';
					if (paramName === 'videoUrl') {
						return itemIndex === 0
							? 'https://example.com/video1.mp4'
							: 'https://example.com/video2.mp4';
					}
					if (paramName === 'platforms') {
						return itemIndex === 0 ? ['youtube'] : ['tiktok'];
					}
					return fallbackValue;
				},
			);

			(mockExecuteFunctions.helpers.httpRequest as jest.Mock)
				.mockResolvedValueOnce(mockTaskResponse1)
				.mockResolvedValueOnce(mockTaskResponse2);

			const result = await taskNode.execute.call(mockExecuteFunctions);

			expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledTimes(2);
			expect(result[0]).toHaveLength(2);
			expect(result[0][0].json.id).toBe('task-acc-batch-1');
			expect(result[0][1].json.id).toBe('task-acc-batch-2');
		});
	});
});
