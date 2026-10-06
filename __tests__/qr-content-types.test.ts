import type { IExecuteFunctions } from 'n8n-workflow';
import { Posty5QrCode } from '../nodes/Posty5QrCode/Posty5QrCode.node';
import { buildQrCodeBulkRow } from '../nodes/Posty5QrCode/helpers';
import { buildQrCodeTarget, requiredQrMode } from '../utils/qr-target.helpers';
import { QR_CONTENT_CONFIG, QR_FILE_MESSAGES } from '../utils/qr-content.config';
import { createMockExecuteFunctions, TEST_CONFIG } from './setup';

/** A parameter reader over a plain object, like `getNodeParameter` with a fallback. */
function reader(values: Record<string, unknown>) {
	return (name: string, fallback?: unknown) => (values[name] !== undefined ? values[name] : fallback);
}

function httpMock(mock: IExecuteFunctions): jest.Mock {
	return mock.helpers.httpRequest as jest.Mock;
}

/** Fields and expected `qrCodeTarget` per QR content type (pass 1 and pass 2, except file). */
const contentTypes: Array<{ qrType: string; fields: Record<string, any>; qrCodeTarget: any; dynamic?: boolean }> = [
	{
		qrType: 'vcard',
		fields: {
			vcardFirstName: ' Ada ',
			vcardLastName: 'Lovelace',
			vcardOrganization: 'Posty5',
			vcardJobTitle: '',
			vcardPhones: { phone: [{ kind: 'work', number: '+20100' }, { kind: '', number: '+20200' }, { number: '' }] },
			vcardEmails: 'a@example.com, b@example.com',
			vcardWebsite: 'https://example.com',
			vcardAddress: { city: 'Cairo', country: 'EG', street: '' },
			vcardNote: 'Hi',
		},
		qrCodeTarget: {
			type: 'vcard',
			vcard: {
				firstName: 'Ada',
				lastName: 'Lovelace',
				organization: 'Posty5',
				phones: [
					{ kind: 'work', number: '+20100' },
					{ kind: 'mobile', number: '+20200' },
				],
				emails: ['a@example.com', 'b@example.com'],
				website: 'https://example.com',
				address: { city: 'Cairo', country: 'EG' },
				note: 'Hi',
			},
		},
	},
	{
		qrType: 'event',
		fields: {
			eventTitle: 'Launch',
			eventStartsAt: '2026-11-01T10:00:00',
			eventEndsAt: '2026-11-01T12:00:00',
			eventAllDay: false,
			eventTimezone: 'Africa/Cairo',
			eventLocation: 'HQ',
			eventDescription: '',
			eventUrl: 'https://example.com/e',
		},
		qrCodeTarget: {
			type: 'event',
			event: {
				title: 'Launch',
				startsAt: '2026-11-01T10:00:00',
				endsAt: '2026-11-01T12:00:00',
				timezone: 'Africa/Cairo',
				location: 'HQ',
				url: 'https://example.com/e',
			},
		},
	},
	{
		qrType: 'whatsapp',
		fields: { whatsappPhoneNumber: '+201001234567', whatsappMessage: 'Hello' },
		qrCodeTarget: { type: 'whatsapp', whatsapp: { phoneNumber: '+201001234567', message: 'Hello' } },
	},
	{
		qrType: 'review',
		fields: { reviewPlatform: 'google', reviewPlaceId: 'ChIJ123', reviewUrl: '' },
		qrCodeTarget: { type: 'review', review: { platform: 'google', placeId: 'ChIJ123' } },
	},
	{
		qrType: 'social',
		fields: { socialProfiles: { profile: [{ platform: 'instagram', handle: 'posty5', url: '' }] } },
		qrCodeTarget: { type: 'social', social: { profiles: [{ platform: 'instagram', handle: 'posty5' }] } },
	},
	{
		qrType: 'social',
		fields: {
			socialProfiles: {
				profile: [
					{ platform: 'instagram', handle: 'posty5' },
					{ platform: 'other', url: 'https://example.com/me' },
					{ platform: 'x', handle: '', url: '' },
				],
			},
			socialTitle: 'Follow us',
		},
		qrCodeTarget: {
			type: 'social',
			social: {
				profiles: [
					{ platform: 'instagram', handle: 'posty5' },
					{ platform: 'other', url: 'https://example.com/me' },
				],
				title: 'Follow us',
			},
		},
		dynamic: true,
	},
	{
		qrType: 'appStore',
		fields: {
			appStoreAndroidUrl: 'https://play.google.com/store/apps/details?id=com.example',
			appStoreIosUrl: '',
			appStoreFallbackUrl: ' https://example.com/app ',
		},
		qrCodeTarget: {
			type: 'appStore',
			appStore: {
				androidUrl: 'https://play.google.com/store/apps/details?id=com.example',
				fallbackUrl: 'https://example.com/app',
			},
		},
		dynamic: true,
	},
];

describe('QR content types', () => {
	let node: Posty5QrCode;

	beforeEach(() => {
		node = new Posty5QrCode();
		jest.clearAllMocks();
	});

	describe('buildQrCodeTarget', () => {
		it.each(contentTypes)('builds the $qrType target', ({ qrType, fields, qrCodeTarget }) => {
			expect(buildQrCodeTarget(qrType, reader(fields))).toEqual(qrCodeTarget);
		});

		it('never sends a Place ID for a platform other than Google', () => {
			expect(
				buildQrCodeTarget('review', reader({ reviewPlatform: 'yelp', reviewPlaceId: 'x', reviewUrl: 'https://yelp.com/r' })),
			).toEqual({ type: 'review', review: { platform: 'yelp', url: 'https://yelp.com/r' } });
		});

		it('builds a file target with only the file name (bucketFilePath comes from the upload)', () => {
			expect(buildQrCodeTarget('file', reader({ fileName: 'menu.pdf' }))).toEqual({
				type: 'file',
				file: { fileName: 'menu.pdf' },
			});
			expect(buildQrCodeTarget('file', reader({}))).toEqual({ type: 'file', file: {} });
		});
	});

	describe('requiredQrMode', () => {
		it('forces dynamic for app store, file and 2+ social profiles only', () => {
			expect(requiredQrMode({ type: 'appStore', appStore: { fallbackUrl: 'https://e.com' } })).toBe('dynamic');
			expect(requiredQrMode({ type: 'file', file: {} })).toBe('dynamic');
			expect(requiredQrMode({ type: 'social', social: { profiles: [{ platform: 'x', handle: 'a' }] } })).toBeUndefined();
			expect(
				requiredQrMode({
					type: 'social',
					social: {
						profiles: [
							{ platform: 'x', handle: 'a' },
							{ platform: 'instagram', handle: 'b' },
						],
					},
				}),
			).toBe('dynamic');
			expect(requiredQrMode({ type: 'url', url: { url: 'https://e.com' } })).toBeUndefined();
		});
	});

	describe('Create', () => {
		it.each(contentTypes)(
			'POSTs a $qrType code under qrCodeTarget, no options.text, mode only when required',
			async ({ qrType, fields, qrCodeTarget, dynamic }) => {
				const mock = createMockExecuteFunctions(
					{ operation: 'create', qrType, templateId: 'tpl-1', additionalFields: {}, ...fields },
					[{ json: {} }],
					{ apiKey: TEST_CONFIG.apiKey },
					{ _id: 'qr1' },
				);

				await node.execute.call(mock);

				expect(httpMock(mock)).toHaveBeenCalledTimes(1);
				const request = httpMock(mock).mock.calls[0][0];
				expect(request.method).toBe('POST');
				expect(request.url).toMatch(new RegExp(`/api/qr-code/${qrType}$`));
				const expected: any = { templateId: 'tpl-1', qrCodeTarget, options: {}, createdFrom: 'n8n' };
				if (dynamic) expected.mode = 'dynamic';
				expect(request.body).toEqual(expected);
			},
		);

		it('sends dynamic for an app store code even when Mode holds Static', async () => {
			const mock = createMockExecuteFunctions(
				{ operation: 'create', qrType: 'appStore', mode: 'static', templateId: 'tpl-1', ...contentTypes[6].fields },
				[{ json: {} }],
				{ apiKey: TEST_CONFIG.apiKey },
				{ _id: 'qr1' },
			);
			await node.execute.call(mock);
			expect(httpMock(mock).mock.calls[0][0].body.mode).toBe('dynamic');
		});
	});

	describe('File (upload-url → PUT → create)', () => {
		const pdf = Buffer.from('%PDF-1.7 test');
		const binaryItem = { json: {}, binary: { data: { data: '', mimeType: 'application/pdf', fileName: 'menu.pdf' } } };
		const ticket = {
			uploadFileURL: 'https://r2.example.com/signed?sig=1',
			bucketFilePath: 'pending/u1/abc.pdf',
			expiresInSeconds: 60,
		};

		function fileMock(parameters: Record<string, any>, inputItem: any = binaryItem) {
			const mock = createMockExecuteFunctions(parameters, [inputItem], { apiKey: TEST_CONFIG.apiKey });
			(mock.helpers.getBinaryDataBuffer as jest.Mock).mockResolvedValue(pdf);
			return mock;
		}

		it('makes three calls with the MIME type, no API key on the PUT, and creates with bucketFilePath', async () => {
			const mock = fileMock({ operation: 'create', qrType: 'file', templateId: 'tpl-1', binaryPropertyName: 'data' });
			httpMock(mock)
				.mockResolvedValueOnce({ result: ticket })
				.mockResolvedValueOnce('')
				.mockResolvedValueOnce({ result: { _id: 'qr-file' } });

			const result = await node.execute.call(mock);

			expect(httpMock(mock)).toHaveBeenCalledTimes(3);
			const [uploadUrl, put, create] = httpMock(mock).mock.calls.map((call) => call[0]);

			expect(uploadUrl.method).toBe('POST');
			expect(uploadUrl.url).toMatch(/\/api\/qr-code\/file\/upload-url$/);
			expect(uploadUrl.body).toEqual({ fileName: 'menu.pdf', mimeType: 'application/pdf', sizeBytes: pdf.length });

			expect(put.method).toBe('PUT');
			expect(put.url).toBe(ticket.uploadFileURL);
			expect(put.body).toBe(pdf);
			expect(put.headers).toEqual({ 'Content-Type': 'application/pdf' });
			expect(put.headers).not.toHaveProperty('X-API-Key');

			expect(create.method).toBe('POST');
			expect(create.url).toMatch(/\/api\/qr-code\/file$/);
			expect(create.body).toEqual({
				templateId: 'tpl-1',
				mode: 'dynamic',
				qrCodeTarget: { type: 'file', file: { fileName: 'menu.pdf', bucketFilePath: ticket.bucketFilePath } },
				options: {},
				createdFrom: 'n8n',
			});
			expect(result[0][0].json).toEqual({ _id: 'qr-file' });
		});

		it('uses File Name over the binary file name', async () => {
			const mock = fileMock({
				operation: 'create',
				qrType: 'file',
				templateId: 'tpl-1',
				binaryPropertyName: 'data',
				fileName: 'Lunch menu.pdf',
			});
			httpMock(mock)
				.mockResolvedValueOnce({ result: ticket })
				.mockResolvedValueOnce('')
				.mockResolvedValueOnce({ result: { _id: 'qr-file' } });

			await node.execute.call(mock);

			expect(httpMock(mock).mock.calls[0][0].body.fileName).toBe('Lunch menu.pdf');
			expect(httpMock(mock).mock.calls[2][0].body.qrCodeTarget.file.fileName).toBe('Lunch menu.pdf');
		});

		it('fails before any request when the binary property is missing, naming it', async () => {
			const mock = fileMock(
				{ operation: 'create', qrType: 'file', templateId: 'tpl-1', binaryPropertyName: 'attachment' },
				{ json: {} },
			);
			await expect(node.execute.call(mock)).rejects.toThrow(QR_FILE_MESSAGES.binaryMissing('attachment'));
			expect(httpMock(mock)).not.toHaveBeenCalled();
		});

		it('fails before any request on a MIME type the API refuses', async () => {
			const mock = fileMock(
				{ operation: 'create', qrType: 'file', templateId: 'tpl-1', binaryPropertyName: 'data' },
				{ json: {}, binary: { data: { data: '', mimeType: 'text/plain', fileName: 'a.txt' } } },
			);
			await expect(node.execute.call(mock)).rejects.toThrow(QR_FILE_MESSAGES.mimeNotAllowed('text/plain'));
			expect(httpMock(mock)).not.toHaveBeenCalled();
		});

		it('fails before any request when the file is over the size cap', async () => {
			const mock = fileMock({ operation: 'create', qrType: 'file', templateId: 'tpl-1', binaryPropertyName: 'data' });
			(mock.helpers.getBinaryDataBuffer as jest.Mock).mockResolvedValue(
				Buffer.alloc(QR_CONTENT_CONFIG.file.maxUploadBytes + 1),
			);
			await expect(node.execute.call(mock)).rejects.toThrow(/larger than 10 MB/);
			expect(httpMock(mock)).not.toHaveBeenCalled();
		});

		const storedFileCode = {
			_id: 'qr-file',
			name: 'Menu',
			templateId: 'tpl-1',
			mode: 'dynamic',
			qrCodeTarget: {
				type: 'file',
				file: { fileName: 'menu.pdf', bucketFilePath: 'qr/u1/old.pdf', mimeType: 'application/pdf' },
			},
		};

		it('Update without a binary property keeps the stored file (no upload, no bucketFilePath)', async () => {
			const mock = fileMock({ operation: 'update', qrCodeId: 'qr-file', qrType: 'file', additionalFields: {} });
			httpMock(mock)
				.mockResolvedValueOnce({ result: storedFileCode })
				.mockResolvedValueOnce({ result: { _id: 'qr-file' } });

			await node.execute.call(mock);

			expect(httpMock(mock)).toHaveBeenCalledTimes(2);
			const put = httpMock(mock).mock.calls[1][0];
			expect(put.method).toBe('PUT');
			expect(put.url).toMatch(/\/api\/qr-code\/file\/qr-file$/);
			expect(put.body.qrCodeTarget).toEqual({ type: 'file', file: { fileName: 'menu.pdf' } });
			expect(put.body.mode).toBe('dynamic');
			expect(mock.helpers.getBinaryDataBuffer).not.toHaveBeenCalled();
		});

		it('Update with a binary property uploads the new file and sends its bucketFilePath', async () => {
			const mock = fileMock({
				operation: 'update',
				qrCodeId: 'qr-file',
				qrType: 'file',
				binaryPropertyName: 'data',
				additionalFields: {},
			});
			httpMock(mock)
				.mockResolvedValueOnce({ result: storedFileCode })
				.mockResolvedValueOnce({ result: ticket })
				.mockResolvedValueOnce('')
				.mockResolvedValueOnce({ result: { _id: 'qr-file' } });

			await node.execute.call(mock);

			expect(httpMock(mock)).toHaveBeenCalledTimes(4);
			expect(httpMock(mock).mock.calls[2][0].method).toBe('PUT');
			expect(httpMock(mock).mock.calls[3][0].body.qrCodeTarget).toEqual({
				type: 'file',
				file: { fileName: 'menu.pdf', bucketFilePath: ticket.bucketFilePath },
			});
		});
	});

	describe('Create Many', () => {
		it('does not offer File as a QR type', () => {
			const qrTypes = node.description.properties.filter((p) => p.name === 'qrType') as any[];
			const bulk = qrTypes.find((p) => p.displayOptions.show.operation.includes('createMany'));
			const single = qrTypes.find((p) => p.displayOptions.show.operation.includes('create'));
			expect(bulk.options.map((o: any) => o.value)).not.toContain('file');
			expect(bulk.options.map((o: any) => o.value)).toContain('appStore');
			expect(single.options.map((o: any) => o.value)).toEqual(expect.arrayContaining(['appStore', 'file']));
		});

		it('refuses a file row (picked by expression) and sends app store rows as dynamic', () => {
			const fileCtx = createMockExecuteFunctions({ qrType: 'file', templateId: 'tpl-1' });
			expect(() => buildQrCodeBulkRow(fileCtx, 0, {} as any)).toThrow(QR_FILE_MESSAGES.notInBulk);

			const appCtx = createMockExecuteFunctions({ qrType: 'appStore', templateId: 'tpl-1', ...contentTypes[6].fields });
			expect(buildQrCodeBulkRow(appCtx, 0, {} as any)).toEqual({
				type: 'appStore',
				target: contentTypes[6].qrCodeTarget.appStore,
				mode: 'dynamic',
				templateId: 'tpl-1',
			});
		});
	});

	describe('Display options', () => {
		it('hides Mode for the dynamic-only types and shows Scan Rules for them on Create', () => {
			const modes = node.description.properties.filter((p) => p.name === 'mode' && p.displayOptions?.hide) as any[];
			for (const mode of modes) {
				expect(mode.displayOptions.hide.qrType).toEqual(expect.arrayContaining(['wifi', 'appStore', 'file']));
			}
			const scanRules = node.description.properties.filter((p) => p.name === 'scanRules') as any[];
			expect(
				scanRules.some(
					(p) =>
						p.displayOptions.show.operation.includes('create') &&
						p.displayOptions.show.qrType?.includes('appStore') &&
						p.displayOptions.show.qrType?.includes('file'),
				),
			).toBe(true);
		});

		it('allows up to 12 social profiles', () => {
			const profiles = node.description.properties.find((p) => p.name === 'socialProfiles') as any;
			expect(profiles.type).toBe('fixedCollection');
			expect(profiles.typeOptions).toEqual({ multipleValues: true, maxAllowedFields: 12 });
		});
	});
});
