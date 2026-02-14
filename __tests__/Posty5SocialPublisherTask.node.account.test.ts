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
                    url: expect.stringContaining('/api/social-publisher-task/generate-upload-urls'),
                }),
            );

            expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: 'POST',
                    url: expect.stringContaining('/api/social-publisher-task/short-video/account/by-file'),
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
                    url: expect.stringContaining('/api/social-publisher-task/short-video/account/by-url'),
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
});
