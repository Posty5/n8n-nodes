/**
 * QR Code *Render*, *Check Scannability* and *List Templates* (QR design and
 * export, K6/K7), mirroring `@posty5/qr-code`'s `render`, `checkScannability`
 * and the template lookups:
 * - Render: `GET /api/qr-code/:id/render?format&presetId&customMm&dpi&sizePx&download`
 *   → the file, emitted as an n8n binary property;
 * - Check Scannability: `POST /api/qr-code/scannability-check` → the K5 report;
 * - List Templates: `GET /api/qr-code-template/user-lookup|public-lookup` → `{ _id, name }` rows.
 */

import {
	NodeOperationError,
	type IExecuteFunctions,
	type ILoadOptionsFunctions,
	type INodeExecutionData,
	type INodePropertyOptions,
} from 'n8n-workflow';
import { encodePathSegment, makeApiRequest, makeBinaryApiRequest } from './api.helpers';
import { API_ENDPOINTS, QR_RENDER, QR_RENDER_MESSAGES, QR_TEMPLATE_LOOKUP } from './constants';
import { firstText, toText } from './link-tool.helpers';
import type {
	IQRCodeRenderOutput,
	IQRCodeRenderQuery,
	IQRCodeScannabilityReport,
	IQRCodeScannabilityRequest,
	IQRCodeTemplateLookupItem,
	IQRCodeTemplateLookupPage,
	IQRDesignCatalogue,
	IQRPrintPreset,
} from '../types/qr-code.types';

/** Reads one node parameter of the current item (`getNodeParameter` bound to an index). */
type ParameterReader = (name: string, fallback?: unknown) => unknown;

/**
 * `loadOptions` for the Print Preset field: "None" (size in pixels), then the
 * design catalogue's presets. The catalogue route is public, but the request
 * still carries the API key like every other call.
 */
export async function getQrPrintPresets(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const credentials = await this.getCredentials('posty5Api');
	const catalogue = (await makeApiRequest.call(this, credentials.apiKey as string, {
		method: 'GET',
		endpoint: `${API_ENDPOINTS.QR_CODE_TEMPLATE}${QR_RENDER.CATALOGUE_PATH}`,
	})) as IQRDesignCatalogue | undefined;

	return [
		{ name: QR_RENDER.NO_PRESET_LABEL, value: '' },
		...(catalogue?.printPresets || []).filter((preset) => firstText(preset?.id)).map(toPresetOption),
	];
}

/** `table-tent-8cm` (80 mm) → "Table Tent 8cm (80 mm)"; `custom` → "Custom (20–500 mm)". */
export function toPresetOption(preset: IQRPrintPreset): INodePropertyOptions {
	const label = preset.id
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
	const size =
		typeof preset.mm === 'number'
			? `${preset.mm} mm`
			: typeof preset.minMm === 'number' && typeof preset.maxMm === 'number'
				? `${preset.minMm}–${preset.maxMm} mm`
				: '';
	return { name: size ? `${label} (${size})` : label, value: preset.id };
}

/**
 * The render query. A preset sends `presetId` (+ `customMm` for custom, + `dpi`
 * for PNG); no preset sends `sizePx` for PNG and SVG. PDF with no preset sends
 * neither (the API uses `flyer-5cm`). Throws on an unknown format, before any request.
 */
export function buildQrRenderQuery(read: ParameterReader): IQRCodeRenderQuery {
	const format = toText(read('renderFormat', QR_RENDER.DEFAULT_FORMAT)).trim().toLowerCase();
	if (!(QR_RENDER.FORMATS as readonly string[]).includes(format)) {
		throw new Error(QR_RENDER_MESSAGES.unknownFormat(format));
	}

	const query: IQRCodeRenderQuery = { format, download: QR_RENDER.DOWNLOAD_FLAG };
	const presetId = toText(read('presetId', '')).trim();
	if (presetId) {
		query.presetId = presetId;
		if (presetId === QR_RENDER.CUSTOM_PRESET_ID) {
			query.customMm = Number(read('customMm', QR_RENDER.DEFAULT_CUSTOM_MM));
		}
		if (format === 'png') query.dpi = Number(read('dpi', QR_RENDER.DEFAULT_DPI));
	} else if (format !== 'pdf') {
		query.sizePx = Number(read('sizePx', QR_RENDER.DEFAULT_SIZE_PX));
	}
	return query;
}

/**
 * *Render* for one item: the file as binary property `renderBinaryProperty`
 * (default `data`), the request's facts as json. The input item's other binary
 * properties are carried over, so a chain keeps its earlier files.
 */
export async function executeQrRender(
	ctx: IExecuteFunctions,
	apiKey: string,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const read: ParameterReader = (name, fallback) => ctx.getNodeParameter(name, itemIndex, fallback);
	const qrCodeId = toText(read('qrCodeId', '')).trim();
	if (!qrCodeId) {
		throw new NodeOperationError(ctx.getNode(), QR_RENDER_MESSAGES.idRequired('QR Code ID'), { itemIndex });
	}
	const query = buildQrRenderQuery(read);
	const binaryProperty =
		toText(read('renderBinaryProperty', QR_RENDER.DEFAULT_BINARY_PROPERTY)).trim() ||
		QR_RENDER.DEFAULT_BINARY_PROPERTY;

	const file = await makeBinaryApiRequest.call(
		ctx,
		apiKey,
		`${API_ENDPOINTS.QR_CODE}/${encodePathSegment(qrCodeId)}/${QR_RENDER.RENDER_PATH_SEGMENT}`,
		query,
	);
	const mimeType = file.mimeType || QR_RENDER.MIME_TYPES[query.format];
	const fileName = file.fileName || `${QR_RENDER.FALLBACK_FILE_NAME_PREFIX}${qrCodeId}.${query.format}`;
	const binaryData = await ctx.helpers.prepareBinaryData(file.data, fileName, mimeType);

	const json: IQRCodeRenderOutput = {
		qrCodeId,
		format: query.format,
		presetId: query.presetId ?? null,
		fileName,
		mimeType,
		fileSize: file.data.length,
		binaryProperty,
	};
	const inputBinary = ctx.getInputData()[itemIndex]?.binary || {};
	return {
		json: json as unknown as INodeExecutionData['json'],
		binary: { ...inputBinary, [binaryProperty]: binaryData },
		pairedItem: { item: itemIndex },
	};
}

/**
 * The scannability-check body for one saved source: a QR code (as rendered,
 * its template wins) or a template (yours or public, with optional sample
 * text). A preset adds the module-size-in-mm check. Throws when the ID is empty.
 */
export function buildQrScannabilityRequest(read: ParameterReader): IQRCodeScannabilityRequest {
	const source = toText(read('scannabilitySource', 'qrCode'));
	const body: IQRCodeScannabilityRequest = {};
	if (source === 'template') {
		const templateId = firstText(read('scannabilityTemplateId', ''));
		if (!templateId) throw new Error(QR_RENDER_MESSAGES.idRequired('Template'));
		body.templateId = templateId;
		const text = firstText(read('sampleText', ''));
		if (text) body.text = text;
	} else {
		const qrCodeId = firstText(read('qrCodeId', ''));
		if (!qrCodeId) throw new Error(QR_RENDER_MESSAGES.idRequired('QR Code ID'));
		body.qrCodeId = qrCodeId;
	}

	const presetId = firstText(read('presetId', ''));
	if (presetId) {
		body.presetId = presetId;
		if (presetId === QR_RENDER.CUSTOM_PRESET_ID) {
			body.customMm = Number(read('customMm', QR_RENDER.DEFAULT_CUSTOM_MM));
		}
	}
	return body;
}

/** *Check Scannability* for one item: the K5 report. */
export async function executeQrScannabilityCheck(
	ctx: IExecuteFunctions,
	apiKey: string,
	itemIndex: number,
): Promise<IQRCodeScannabilityReport> {
	const body = buildQrScannabilityRequest((name, fallback) => ctx.getNodeParameter(name, itemIndex, fallback));
	return (await makeApiRequest.call(ctx, apiKey, {
		method: 'POST',
		endpoint: `${API_ENDPOINTS.QR_CODE}${QR_RENDER.SCANNABILITY_PATH}`,
		body,
		// The check's schema refuses unknown keys.
		stampCreatedFrom: false,
	})) as IQRCodeScannabilityReport;
}

/**
 * *List Templates* for one item: one page of the caller's templates (`mine`)
 * or Posty5's public ones, as `{ _id, name }` rows, filtered by Search.
 */
export async function executeListQrTemplates(
	ctx: IExecuteFunctions,
	apiKey: string,
	itemIndex: number,
): Promise<IQRCodeTemplateLookupItem[]> {
	const scope = toText(ctx.getNodeParameter('templateScope', itemIndex, 'mine'));
	const term = firstText(ctx.getNodeParameter('templateSearch', itemIndex, ''));
	const limit = Number(
		ctx.getNodeParameter('templateLimit', itemIndex, QR_RENDER.LIST_TEMPLATES_DEFAULT_LIMIT),
	);
	const path = scope === 'public' ? QR_TEMPLATE_LOOKUP.PUBLIC_PATH : QR_TEMPLATE_LOOKUP.USER_PATH;

	const page = (await makeApiRequest.call(ctx, apiKey, {
		method: 'GET',
		endpoint: `${API_ENDPOINTS.QR_CODE_TEMPLATE}${path}`,
		qs: { page: 1, pageSize: limit, ...(term ? { term } : {}) },
	})) as IQRCodeTemplateLookupPage | undefined;

	return (page?.items || [])
		.filter((template) => firstText(template?._id))
		.map((template) => ({ _id: template._id, name: firstText(template.name) }));
}
