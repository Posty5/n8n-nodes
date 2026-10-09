/**
 * Sync bulk create (`POST /api/short-link/bulk`, `POST /api/qr-code/bulk`).
 * Mirrors the API's `link-bulk-job/interface.ts` and the npm SDK's `@posty5/core`
 * bulk shapes.
 */

import type { IQRCodeTarget, QrCodeMode, QrCodeTargetType } from './qr-code.types';

/** Defaults applied to every row that does not set the field itself. */
export interface IBulkDefaults {
	templateId?: string;
	tag?: string;
	refId?: string;
}

/** One row of a short-link bulk create. */
export interface IShortLinkBulkRow {
	url: string;
	name?: string;
	customId?: string;
	tag?: string;
	refId?: string;
	templateId?: string;
}

/** One row of a QR bulk create: `target` is the type's object (`qrCodeTarget[type]`). */
export interface IQrCodeBulkRow {
	type: QrCodeTargetType;
	target: NonNullable<IQRCodeTarget[QrCodeTargetType]>;
	mode?: QrCodeMode;
	name?: string;
	customId?: string;
	tag?: string;
	refId?: string;
	templateId?: string;
}

export interface IBulkRowError {
	field?: string;
	message: string;
}

/** The outcome of one row. `row` is 1-based over the request's rows. */
export interface IBulkRowResult {
	row: number;
	status: 'created' | 'failed';
	id?: string;
	shortUrl?: string;
	qrCodeDownloadURL?: string;
	errors?: IBulkRowError[];
}

export interface IBulkCreateResult {
	created: number;
	failed: number;
	items: IBulkRowResult[];
}

/** The *Defaults* and *Options* collections of *Create Many*. */
export interface IBulkNodeOptions {
	batchSize?: number;
	fetchMetadata?: boolean;
	failOnRowError?: boolean;
}

/** One input item prepared for a bulk request: a row to send, or the error that kept it local. */
export type BulkPreparedRow<TRow> = { row: TRow } | { error: string };

/** How one node's bulk route turns a chunk of rows into a body. */
export interface IBulkRoute<TRow> {
	endpoint: string;
	toBody: (rows: TRow[], defaults: IBulkDefaults) => Record<string, unknown>;
}
