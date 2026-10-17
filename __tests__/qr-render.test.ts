import type { IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';
import { Posty5QrCode } from '../nodes/Posty5QrCode/Posty5QrCode.node';
import { parseContentDispositionFileName } from '../utils/api.helpers';
import { buildQrRenderQuery, buildQrScannabilityRequest, getQrPrintPresets, toPresetOption } from '../utils/qr-render.helpers';
import { createMockExecuteFunctions } from './setup';

const API = 'https://api.posty5.com';

/** An execute context whose `prepareBinaryData` echoes what it was given. */
function createRenderContext(parameters: Record<string, any>, inputData: any[] = [{ json: {} }]): IExecuteFunctions {
	const ctx = createMockExecuteFunctions({ operation: 'render', ...parameters }, inputData, { apiKey: 'test-api-key' });
	(ctx.helpers as any).prepareBinaryData = jest
		.fn()
		.mockImplementation(async (data: Buffer, fileName: string, mimeType: string) => ({
			data: data.toString('base64'),
			fileName,
			mimeType,
		}));
	return ctx;
}

/** What n8n's `httpRequest` answers with `returnFullResponse: true`. */
function fileResponse(body: string, contentType: string, disposition?: string): any {
	return {
		body: Buffer.from(body),
		statusCode: 200,
		headers: { 'content-type': contentType, ...(disposition ? { 'content-disposition': disposition } : {}) },
	};
}

/** A failed request as n8n's `httpRequest` throws it for an `arraybuffer` request: the body is bytes. */
function bytesError(status: number, body: object): any {
	const error: any = new Error(`Request failed with status code ${status}`);
	error.response = { status, data: Buffer.from(JSON.stringify(body)) };
	return error;
}

function requestOptions(ctx: IExecuteFunctions, callIndex = 0): any {
	return (ctx.helpers.httpRequest as jest.Mock).mock.calls[callIndex][0];
}

/** A reader over a plain parameter object, as the helpers take one. */
function reader(parameters: Record<string, any>) {
	return (name: string, fallback?: unknown) => (parameters[name] !== undefined ? parameters[name] : fallback);
}

describe('QR Code: Render, Check Scannability, List Templates', () => {
	let node: Posty5QrCode;

	beforeEach(() => {
		node = new Posty5QrCode();
		jest.clearAllMocks();
	});

	describe('node description', () => {
		it('should offer the three operations and the print-preset loadOptions', () => {
			const operation = node.description.properties.find((p) => p.name === 'operation') as any;
			const values = operation.options.map((o: any) => o.value);
			expect(values).toEqual(expect.arrayContaining(['render', 'checkScannability', 'listTemplates']));
			expect(node.methods.loadOptions.getQrPrintPresets).toBe(getQrPrintPresets);
			expect(node.methods.loadOptions.getQrTemplates).toBeDefined();
		});

		it('should show the QR Code ID field on Render', () => {
			const idFields = node.description.properties.filter((p) => p.name === 'qrCodeId');
			const operations = idFields.flatMap((p) => (p.displayOptions?.show?.operation as string[]) || []);
			expect(operations).toEqual(expect.arrayContaining(['render', 'checkScannability']));
		});
	});

	describe('Render', () => {
		it('should GET the render route with the API key and emit the file as binary', async () => {
			const ctx = createRenderContext({ qrCodeId: 'qr-1', renderFormat: 'png', presetId: '', sizePx: 512 });
			(ctx.helpers.httpRequest as jest.Mock).mockResolvedValue(
				fileResponse('PNGBYTES', 'image/png', 'attachment; filename="Menu-512px.png"'),
			);

			const result = await node.execute.call(ctx);

			const options = requestOptions(ctx);
			expect(options).toEqual(
				expect.objectContaining({
					method: 'GET',
					url: `${API}/api/qr-code/qr-1/render`,
					qs: { format: 'png', download: '1', sizePx: 512 },
					encoding: 'arraybuffer',
					json: false,
					returnFullResponse: true,
					headers: expect.objectContaining({ 'X-API-Key': 'test-api-key' }),
				}),
			);
			expect(ctx.helpers.prepareBinaryData).toHaveBeenCalledWith(Buffer.from('PNGBYTES'), 'Menu-512px.png', 'image/png');
			expect(result[0]).toHaveLength(1);
			expect(result[0][0].binary?.data).toEqual(
				expect.objectContaining({ fileName: 'Menu-512px.png', mimeType: 'image/png' }),
			);
			expect(result[0][0].json).toEqual({
				qrCodeId: 'qr-1',
				format: 'png',
				presetId: null,
				fileName: 'Menu-512px.png',
				mimeType: 'image/png',
				fileSize: 8,
				binaryProperty: 'data',
			});
			expect(result[0][0].pairedItem).toEqual({ item: 0 });
		});

		it('should send a PDF preset, put the file in the chosen field and keep the input binaries', async () => {
			const ctx = createRenderContext(
				{ qrCodeId: 'qr-2', renderFormat: 'pdf', presetId: 'business-card', renderBinaryProperty: 'qrPdf' },
				[{ json: {}, binary: { invoice: { fileName: 'invoice.pdf' } } }],
			);
			(ctx.helpers.httpRequest as jest.Mock).mockResolvedValue(fileResponse('%PDF', 'application/pdf'));

			const result = await node.execute.call(ctx);

			expect(requestOptions(ctx).qs).toEqual({ format: 'pdf', download: '1', presetId: 'business-card' });
			// No Content-Disposition: the fallback name.
			expect(result[0][0].json).toEqual(
				expect.objectContaining({ fileName: 'qr-code-qr-2.pdf', presetId: 'business-card', binaryProperty: 'qrPdf' }),
			);
			expect(Object.keys(result[0][0].binary || {})).toEqual(['invoice', 'qrPdf']);
		});

		it('should fail with the API plan-gate text on 403, and emit it as { error } with Continue On Fail', async () => {
			const gate = 'This feature is not available on your current plan.';
			const ctx = createRenderContext({ qrCodeId: 'qr-3', renderFormat: 'svg' });
			(ctx.helpers.httpRequest as jest.Mock).mockRejectedValue(bytesError(403, { message: gate }));

			await expect(node.execute.call(ctx)).rejects.toMatchObject({
				message: `Posty5 API Error: ${gate}`,
				httpCode: '403',
				apiMessage: gate,
			});

			(ctx.continueOnFail as jest.Mock).mockReturnValue(true);
			const result = await node.execute.call(ctx);
			expect(result[0][0].json).toEqual({ error: `Posty5 API Error: ${gate}` });
		});

		it('should surface the API message of a 404', async () => {
			const ctx = createRenderContext({ qrCodeId: 'missing', renderFormat: 'png' });
			(ctx.helpers.httpRequest as jest.Mock).mockRejectedValue(bytesError(404, { message: 'QR Code Not Found' }));

			await expect(node.execute.call(ctx)).rejects.toMatchObject({ httpCode: '404', apiMessage: 'QR Code Not Found' });
		});

		it('should refuse an empty QR Code ID before any request', async () => {
			const ctx = createRenderContext({ qrCodeId: ' ', renderFormat: 'png' });

			await expect(node.execute.call(ctx)).rejects.toThrow('QR Code ID is required');
			expect(ctx.helpers.httpRequest).not.toHaveBeenCalled();
		});
	});

	describe('buildQrRenderQuery', () => {
		it('should send dpi with a PNG preset and customMm with the custom preset, never sizePx', () => {
			expect(buildQrRenderQuery(reader({ renderFormat: 'png', presetId: 'custom', customMm: 120, dpi: 600, sizePx: 900 }))).toEqual({
				format: 'png',
				download: '1',
				presetId: 'custom',
				customMm: 120,
				dpi: 600,
			});
		});

		it('should send sizePx for SVG with no preset, and nothing for PDF with no preset', () => {
			expect(buildQrRenderQuery(reader({ renderFormat: 'svg', presetId: '' }))).toEqual({
				format: 'svg',
				download: '1',
				sizePx: 1024,
			});
			expect(buildQrRenderQuery(reader({ renderFormat: 'pdf' }))).toEqual({ format: 'pdf', download: '1' });
		});

		it('should refuse an unknown format', () => {
			expect(() => buildQrRenderQuery(reader({ renderFormat: 'gif' }))).toThrow('Unknown format "gif"');
		});
	});

	describe('parseContentDispositionFileName', () => {
		it.each([
			['attachment; filename="Menu QR-flyer-5cm.pdf"', 'Menu QR-flyer-5cm.pdf'],
			["attachment; filename=\"menu.pdf\"; filename*=UTF-8''%D9%82%D8%A7%D8%A6%D9%85%D8%A9.pdf", 'قائمة.pdf'],
			['attachment; filename=plain.png', 'plain.png'],
			['attachment; filename="../../etc/x.svg"', '.._.._etc_x.svg'],
			['inline', ''],
			[undefined, ''],
		])('%s → %s', (header, expected) => {
			expect(parseContentDispositionFileName(header)).toBe(expected);
		});
	});

	describe('Check Scannability', () => {
		it('should POST a QR code source without createdFrom and return the report', async () => {
			const report = { verdict: 'good', checks: [], symbol: { version: 3, size: 29, ecLevel: 'M', quietZoneModules: 4 } };
			const ctx = createMockExecuteFunctions(
				{ operation: 'checkScannability', scannabilitySource: 'qrCode', qrCodeId: 'qr-1', presetId: 'sticker-3cm' },
				[{ json: {} }],
				{ apiKey: 'test-api-key' },
				{ message: 'ok', result: report },
			);

			const result = await node.execute.call(ctx);

			expect(requestOptions(ctx)).toEqual(
				expect.objectContaining({
					method: 'POST',
					url: `${API}/api/qr-code/scannability-check`,
					body: { qrCodeId: 'qr-1', presetId: 'sticker-3cm' },
				}),
			);
			expect(result[0][0].json).toEqual(report);
		});

		it('should build a template source with sample text and a custom width', () => {
			expect(
				buildQrScannabilityRequest(
					reader({ scannabilitySource: 'template', scannabilityTemplateId: 'tpl-1', sampleText: 'https://x.y', presetId: 'custom', customMm: 30 }),
				),
			).toEqual({ templateId: 'tpl-1', text: 'https://x.y', presetId: 'custom', customMm: 30 });
		});

		it('should refuse an empty template before any request', () => {
			expect(() => buildQrScannabilityRequest(reader({ scannabilitySource: 'template' }))).toThrow('Template is required');
		});
	});

	describe('List Templates', () => {
		it.each([
			['mine', '/api/qr-code-template/user-lookup'],
			['public', '/api/qr-code-template/public-lookup'],
		])('should read the %s lookup with search and limit as { _id, name } rows', async (scope, path) => {
			const ctx = createMockExecuteFunctions(
				{ operation: 'listTemplates', templateScope: scope, templateSearch: 'menu', templateLimit: 5 },
				[{ json: {} }],
				{ apiKey: 'test-api-key' },
				{ result: { items: [{ _id: 't1', name: 'Menu', id: 't1' }, { _id: 't2' }], pagination: { hasMore: false } } },
			);

			const result = await node.execute.call(ctx);

			expect(requestOptions(ctx)).toEqual(
				expect.objectContaining({ method: 'GET', url: `${API}${path}`, qs: { page: 1, pageSize: 5, term: 'menu' } }),
			);
			expect(result[0].map((item) => item.json)).toEqual([
				{ _id: 't1', name: 'Menu' },
				{ _id: 't2', name: undefined },
			]);
		});
	});

	describe('getQrPrintPresets (loadOptions)', () => {
		it('should list "None" then the catalogue presets with their sizes', async () => {
			const context = {
				getCredentials: jest.fn().mockResolvedValue({ apiKey: 'test-api-key' }),
				helpers: {
					httpRequest: jest.fn().mockResolvedValue({
						result: {
							printPresets: [
								{ id: 'table-tent-8cm', mm: 80 },
								{ id: 'custom', minMm: 20, maxMm: 500 },
							],
						},
					}),
				},
			} as unknown as ILoadOptionsFunctions;

			const options = await getQrPrintPresets.call(context);

			expect((context.helpers.httpRequest as jest.Mock).mock.calls[0][0].url).toBe(
				`${API}/api/qr-code-template/design-catalogue`,
			);
			expect(options).toEqual([
				{ name: 'None (Size in Pixels)', value: '' },
				{ name: 'Table Tent 8cm (80 mm)', value: 'table-tent-8cm' },
				{ name: 'Custom (20–500 mm)', value: 'custom' },
			]);
		});

		it('should name a preset with no size by its id', () => {
			expect(toPresetOption({ id: 'business-card' })).toEqual({ name: 'Business Card', value: 'business-card' });
		});
	});
});
