import { Posty5SocialPublisherPost } from '../nodes/Posty5SocialPublisherPost/Posty5SocialPublisherPost.node';
import { createMockExecuteFunctions } from './setup';

/**
 * Long video operations on the Social Publisher Post node.
 *
 * These drive `execute` against a mocked HTTP layer, asserting the requests the
 * node builds rather than any live API behaviour.
 */
describe('Posty5SocialPublisherPost — long video', () => {
	let node: Posty5SocialPublisherPost;

	beforeEach(() => {
		node = new Posty5SocialPublisherPost();
		jest.clearAllMocks();
	});

	/** Pull the request options passed to each makeApiRequest-driven httpRequest call. */
	const requests = (mock: any) =>
		(mock.helpers.httpRequest as jest.Mock).mock.calls.map((c: any[]) => c[0]);

	describe('node description', () => {
		it('offers the long video operations', () => {
			const operation = node.description.properties.find((p) => p.name === 'operation') as any;
			const values = operation.options.map((o: any) => o.value);

			expect(values).toContain('publishLongVideo');
			expect(values).toContain('publishLongVideoToAccount');
			expect(values).toContain('getLongVideoQuote');
			expect(values).toContain('reschedulePost');
		});

		it('states the 60-minute limit and the per-platform caveat in the UI', () => {
			const notice = node.description.properties.find((p) => p.name === 'longVideoNotice') as any;
			expect(notice).toBeDefined();
			expect(notice.type).toBe('notice');
			expect(notice.displayName).toContain('60 minutes');
			expect(notice.displayName).toContain('50 credits');
			expect(notice.displayName).toContain('15 minutes'); // Instagram's real cap
			expect(notice.displayName).toContain('refusedTargets');
		});

		it('reuses the video fields for the long video operations rather than duplicating them', () => {
			const videoSource = node.description.properties.find((p) => p.name === 'videoSource') as any;
			expect(videoSource.displayOptions.show.operation).toContain('publishLongVideo');
			expect(videoSource.displayOptions.show.operation).toContain('publishLongVideoToAccount');

			const youtube = node.description.properties.find((p) => p.name === 'youtubeSettings') as any;
			expect(youtube.displayOptions.show.operation).toContain('publishLongVideo');
		});
	});

	describe('publishLongVideo from a URL', () => {
		it('posts to the workspace by-url route with the schedule the wire expects', async () => {
			const mock = createMockExecuteFunctions(
				{
					operation: 'publishLongVideo',
					workspaceId: 'ws_1',
					videoSource: 'url',
					videoUrl: 'https://videos.example.com/ep14.mp4',
					thumbnailSource: 'none',
					scheduledPublishTime: 'now',
					youtubeSettings: { title: 'Episode 14', description: 'Full episode' },
				},
				[{ json: {} }],
				undefined,
				{ result: { _id: 'post_1', durationSeconds: 720, creditUnits: 3, credits: 150 } },
			);

			await node.execute.call(mock);

			const [req] = requests(mock);
			expect(req.method).toBe('POST');
			expect(req.url).toContain('/api/social-publisher-post/long-video/workspace/by-url');
			expect(req.body).toMatchObject({
				workspaceId: 'ws_1',
				source: 'video-url',
				videoURL: 'https://videos.example.com/ep14.mp4',
				schedule: { type: 'now' },
			});
			expect(req.body.youtube).toMatchObject({ title: 'Episode 14' });
		});

		it('never sends a duration — the server measures it', async () => {
			const mock = createMockExecuteFunctions(
				{
					operation: 'publishLongVideo',
					workspaceId: 'ws_1',
					videoSource: 'url',
					videoUrl: 'https://videos.example.com/ep14.mp4',
					thumbnailSource: 'none',
					scheduledPublishTime: 'now',
					youtubeSettings: { title: 't', description: 'd' },
				},
				[{ json: {} }],
				undefined,
				{ result: { _id: 'post_1' } },
			);

			await node.execute.call(mock);

			expect(JSON.stringify(requests(mock)[0].body)).not.toMatch(/duration/i);
		});

		it('sends a scheduled post as an ISO timestamp', async () => {
			const mock = createMockExecuteFunctions(
				{
					operation: 'publishLongVideo',
					workspaceId: 'ws_1',
					videoSource: 'url',
					videoUrl: 'https://videos.example.com/ep14.mp4',
					thumbnailSource: 'none',
					scheduledPublishTime: 'later',
					scheduleDate: '2026-09-15T10:00:00Z',
					youtubeSettings: { title: 't', description: 'd' },
				},
				[{ json: {} }],
				undefined,
				{ result: { _id: 'post_1' } },
			);

			await node.execute.call(mock);

			expect(requests(mock)[0].body.schedule).toEqual({
				type: 'schedule',
				scheduledAt: '2026-09-15T10:00:00.000Z',
			});
		});

		it('splits comma-separated YouTube tags into an array', async () => {
			const mock = createMockExecuteFunctions(
				{
					operation: 'publishLongVideo',
					workspaceId: 'ws_1',
					videoSource: 'url',
					videoUrl: 'https://videos.example.com/ep14.mp4',
					thumbnailSource: 'none',
					scheduledPublishTime: 'now',
					youtubeSettings: { title: 't', description: 'd', tags: 'workshop, long form' },
				},
				[{ json: {} }],
				undefined,
				{ result: { _id: 'post_1' } },
			);

			await node.execute.call(mock);

			expect(requests(mock)[0].body.youtube.tags).toEqual(['workshop', 'long form']);
		});
	});

	describe('publishLongVideo from binary data', () => {
		it('declares the post type on the upload request so gating is checked before the transfer', async () => {
			const mock = createMockExecuteFunctions(
				{
					operation: 'publishLongVideo',
					workspaceId: 'ws_1',
					videoSource: 'binary',
					videoBinaryProperty: 'data',
					thumbnailSource: 'none',
					scheduledPublishTime: 'now',
					youtubeSettings: { title: 't', description: 'd' },
				},
				[{ json: {} }],
				undefined,
				{
					result: {
						postId: 'post_abc',
						video: {
							uploadFileURL: 'https://upload.example.com/v?sig=x',
							fileURL: 'https://cdn.example.com/v.mp4',
						},
						thumb: {},
					},
				},
			);

			await node.execute.call(mock);

			const [uploadUrlsReq] = requests(mock);
			expect(uploadUrlsReq.url).toContain('/generate-upload-urls');
			expect(uploadUrlsReq.body.postType).toBe('longVideo');
			expect(uploadUrlsReq.body.videoFileType).toBe('video/mp4');
		});

		it('publishes the CDN url, not the signed upload url, and reuses the reserved post id', async () => {
			const mock = createMockExecuteFunctions(
				{
					operation: 'publishLongVideo',
					workspaceId: 'ws_1',
					videoSource: 'binary',
					videoBinaryProperty: 'data',
					thumbnailSource: 'none',
					scheduledPublishTime: 'now',
					youtubeSettings: { title: 't', description: 'd' },
				},
				[{ json: {} }],
				undefined,
				{
					result: {
						postId: 'post_abc',
						video: {
							uploadFileURL: 'https://upload.example.com/v?sig=x',
							fileURL: 'https://cdn.example.com/v.mp4',
						},
						thumb: {},
					},
				},
			);

			await node.execute.call(mock);

			const create = requests(mock).find((r: any) => String(r.url).includes('/long-video/'));
			expect(create.url).toContain('/long-video/workspace/by-file/post_abc');
			// The signed URL is a short-lived secret; it must never become the
			// published media URL.
			expect(create.body.videoURL).toBe('https://cdn.example.com/v.mp4');
			expect(create.body.source).toBe('video-file');
		});
	});

	describe('publishLongVideoToAccount', () => {
		it('targets the account route', async () => {
			const mock = createMockExecuteFunctions(
				{
					operation: 'publishLongVideoToAccount',
					accountId: 'acc_1',
					videoSource: 'url',
					videoUrl: 'https://videos.example.com/ep14.mp4',
					thumbnailSource: 'none',
					scheduledPublishTime: 'now',
					youtubeSettings: { title: 't', description: 'd' },
				},
				[{ json: {} }],
				undefined,
				{ result: { _id: 'post_1' } },
			);

			await node.execute.call(mock);

			const [req] = requests(mock);
			expect(req.url).toContain('/long-video/account/by-url');
			expect(req.body.accountId).toBe('acc_1');
			expect(req.body.workspaceId).toBeUndefined();
		});
	});

	describe('getLongVideoQuote', () => {
		it('posts the URL to the quote endpoint', async () => {
			const mock = createMockExecuteFunctions(
				{ operation: 'getLongVideoQuote', quoteVideoUrl: 'https://cdn.example.com/v.mp4' },
				[{ json: {} }],
				undefined,
				{ result: { durationSeconds: 720, units: 3, credits: 150, withinLimit: true } },
			);

			await node.execute.call(mock);

			const [req] = requests(mock);
			expect(req.method).toBe('POST');
			expect(req.url).toContain('/long-video/quote');
			// makeApiRequest stamps createdFrom on POST bodies for attribution.
			expect(req.body).toMatchObject({ videoURL: 'https://cdn.example.com/v.mp4' });
		});
	});

	describe('reschedulePost', () => {
		it('PUTs a new scheduled time', async () => {
			const mock = createMockExecuteFunctions(
				{
					operation: 'reschedulePost',
					reschedulePostId: 'post_1',
					rescheduleWhen: 'later',
					rescheduleDate: '2026-09-20T08:00:00Z',
					rescheduleCaption: '',
				},
				[{ json: {} }],
				undefined,
				{ result: {} },
			);

			await node.execute.call(mock);

			const [req] = requests(mock);
			expect(req.method).toBe('PUT');
			expect(req.url).toContain('/api/social-publisher-post/post_1');
			expect(req.body).toEqual({
				schedule: { type: 'schedule', scheduledAt: '2026-09-20T08:00:00.000Z' },
			});
		});

		it('can flip a scheduled post to publish now', async () => {
			const mock = createMockExecuteFunctions(
				{
					operation: 'reschedulePost',
					reschedulePostId: 'post_1',
					rescheduleWhen: 'now',
					rescheduleCaption: '',
				},
				[{ json: {} }],
				undefined,
				{ result: {} },
			);

			await node.execute.call(mock);

			expect(requests(mock)[0].body.schedule).toEqual({ type: 'now' });
		});

		it('sends a replacement caption only when one was typed', async () => {
			const withCaption = createMockExecuteFunctions(
				{
					operation: 'reschedulePost',
					reschedulePostId: 'post_1',
					rescheduleWhen: 'now',
					rescheduleCaption: 'Updated caption',
				},
				[{ json: {} }],
				undefined,
				{ result: {} },
			);
			await node.execute.call(withCaption);
			expect(requests(withCaption)[0].body.caption).toBe('Updated caption');

			const blank = createMockExecuteFunctions(
				{
					operation: 'reschedulePost',
					reschedulePostId: 'post_1',
					rescheduleWhen: 'now',
					rescheduleCaption: '   ',
				},
				[{ json: {} }],
				undefined,
				{ result: {} },
			);
			await node.execute.call(blank);
			expect('caption' in requests(blank)[0].body).toBe(false);
		});
	});

	describe('deletePost', () => {
		it('DELETEs the post', async () => {
			const mock = createMockExecuteFunctions(
				{ operation: 'deletePost', deletePostId: 'post_1' },
				[{ json: {} }],
				undefined,
				{ result: { _id: 'post_1' } },
			);

			await node.execute.call(mock);

			const [req] = requests(mock);
			expect(req.method).toBe('DELETE');
			expect(req.url).toContain('/api/social-publisher-post/post_1');
		});
	});

	describe('continueOnFail', () => {
		it('fails one oversized item without stopping the batch', async () => {
			const mock = createMockExecuteFunctions(
				{
					operation: 'getLongVideoQuote',
					quoteVideoUrl: 'https://cdn.example.com/too-long.mp4',
				},
				[{ json: { id: 1 } }, { json: { id: 2 } }],
				undefined,
				{},
			);
			(mock.continueOnFail as jest.Mock).mockReturnValue(true);
			(mock.helpers.httpRequest as jest.Mock)
				.mockRejectedValueOnce(new Error('This video is 1h 5m, over the 60 minutes limit.'))
				.mockResolvedValueOnce({ result: { durationSeconds: 600, credits: 100 } });

			const [output] = await node.execute.call(mock);

			expect(output).toHaveLength(2);
			expect((output[0] as any).json.error).toContain('over the 60 minutes limit');
			// The second item still went through.
			expect((output[1] as any).json.error).toBeUndefined();
		});
	});
});
