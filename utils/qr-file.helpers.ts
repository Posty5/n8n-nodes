/**
 * Upload of a `file` QR code's content from an n8n binary property, mirroring
 * `@posty5/qr-code`'s `createFile` / `updateFile`:
 * 1. `POST /api/qr-code/file/upload-url` `{ fileName, mimeType, sizeBytes }`
 *    → `{ uploadFileURL, bucketFilePath, expiresInSeconds }`;
 * 2. `PUT` the bytes to `uploadFileURL` with the binary's MIME type and no
 *    Posty5 API key (the URL is a signed storage URL, not the Posty5 API);
 * 3. the caller sends `qrCodeTarget.file.bucketFilePath` on create / update.
 */

import { NodeOperationError, type IExecuteFunctions } from 'n8n-workflow';
import { makeApiRequest, toPosty5ApiError } from './api.helpers';
import { API_ENDPOINTS } from './constants';
import { toText } from './link-tool.helpers';
import { QR_CONTENT_CONFIG, QR_FILE_MESSAGES } from './qr-content.config';
import type { IQRCodeFileUploadRequest, IQRCodeFileUploadTicket } from '../types/qr-code.types';

/** What the upload produced: the path to send, and the file name the upload-url call used. */
export interface IQrFileUploadResult {
	bucketFilePath: string;
	fileName: string;
}

/**
 * Reads the binary at `binaryProperty` of item `itemIndex`, checks its type and
 * size against the API's limits (before any request), then runs steps 1-2.
 * `fileName` overrides the binary's own file name.
 */
export async function uploadQrFile(
	ctx: IExecuteFunctions,
	apiKey: string,
	itemIndex: number,
	binaryProperty: string,
	fileName?: string,
): Promise<IQrFileUploadResult> {
	const config = QR_CONTENT_CONFIG.file;
	const binary = ctx.getInputData()[itemIndex]?.binary?.[binaryProperty];
	if (!binary) {
		throw new NodeOperationError(ctx.getNode(), QR_FILE_MESSAGES.binaryMissing(binaryProperty), { itemIndex });
	}

	const mimeType = toText(binary.mimeType).split(';')[0].trim().toLowerCase();
	if (!(config.mimeTypes as readonly string[]).includes(mimeType)) {
		throw new NodeOperationError(ctx.getNode(), QR_FILE_MESSAGES.mimeNotAllowed(mimeType), { itemIndex });
	}

	const buffer = await ctx.helpers.getBinaryDataBuffer(itemIndex, binaryProperty);
	const sizeBytes = buffer.length;
	if (!sizeBytes) throw new NodeOperationError(ctx.getNode(), QR_FILE_MESSAGES.empty, { itemIndex });
	if (sizeBytes > config.maxUploadBytes) {
		throw new NodeOperationError(
			ctx.getNode(),
			QR_FILE_MESSAGES.tooLarge(config.maxUploadBytes / (1024 * 1024)),
			{ itemIndex },
		);
	}

	const name = (toText(fileName).trim() || toText(binary.fileName).trim() || config.fallbackFileName).slice(
		0,
		config.fileNameMax,
	);
	const request: IQRCodeFileUploadRequest = { fileName: name, mimeType, sizeBytes };
	const ticket = (await makeApiRequest.call(ctx, apiKey, {
		method: 'POST',
		endpoint: `${API_ENDPOINTS.QR_CODE}${config.uploadUrlPath}`,
		body: request,
		// The upload-url schema takes exactly fileName, mimeType and sizeBytes.
		stampCreatedFrom: false,
	})) as IQRCodeFileUploadTicket;

	try {
		await ctx.helpers.httpRequest({
			method: 'PUT',
			url: ticket.uploadFileURL,
			body: buffer,
			headers: { 'Content-Type': mimeType },
			json: false,
		});
	} catch (error) {
		throw toPosty5ApiError(error);
	}

	return { bucketFilePath: ticket.bucketFilePath, fileName: name };
}
