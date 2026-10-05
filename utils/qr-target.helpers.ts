/**
 * `qrCodeTarget` for the QR Code node.
 *
 * The API reads a QR code's content from `qrCodeTarget: { type, [type]: {...} }`
 * and nowhere else. The node builds no `options.text`: the server encodes the
 * target itself, so the stored text is always the one its safety checks saw.
 */

import { QR_CODE_TYPES, QR_WIFI_AUTH } from './constants';
import { toText } from './link-tool.helpers';
import type {
	IQRCodeEmailTarget,
	IQRCodeAccess,
	IQRCodeScanRulesParameter,
	IQRCodeSmsTarget,
	IQRCodeTarget,
	IQRCodeWifiTarget,
	QrCodeMode,
	QrParameterReader,
} from '../types/qr-code.types';

/** A coordinate as the API takes it: a number, or the text an expression produced. */
function toCoordinate(value: unknown): number | string {
	return typeof value === 'number' ? value : toText(value).trim();
}

/**
 * The `qrCodeTarget` for one QR type, read from that type's node fields.
 * Optional values left empty (email subject/body, SMS message, WiFi password)
 * are not sent; an open network never sends a password.
 */
export function buildQrCodeTarget(qrType: string, read: QrParameterReader): IQRCodeTarget {
	switch (qrType) {
		case 'url':
			return { type: 'url', url: { url: toText(read('url', '')).trim() } };

		case 'freeText':
			return { type: 'freeText', freeText: { text: toText(read('text', '')) } };

		case 'email': {
			const email: IQRCodeEmailTarget = { email: toText(read('email', '')).trim() };
			const subject = toText(read('emailSubject', ''));
			const body = toText(read('emailBody', ''));
			if (subject) email.subject = subject;
			if (body) email.body = body;
			return { type: 'email', email };
		}

		case 'wifi': {
			const authenticationType =
				toText(read('wifiAuthType', QR_WIFI_AUTH.DEFAULT)) || QR_WIFI_AUTH.DEFAULT;
			const wifi: IQRCodeWifiTarget = { name: toText(read('wifiName', '')), authenticationType };
			const password =
				authenticationType === QR_WIFI_AUTH.OPEN_NETWORK ? '' : toText(read('wifiPassword', ''));
			if (password) wifi.password = password;
			return { type: 'wifi', wifi };
		}

		case 'call':
			return { type: 'call', call: { phoneNumber: toText(read('phoneNumber', '')).trim() } };

		case 'sms': {
			const sms: IQRCodeSmsTarget = { phoneNumber: toText(read('smsPhoneNumber', '')).trim() };
			const message = toText(read('smsMessage', ''));
			if (message) sms.message = message;
			return { type: 'sms', sms };
		}

		case 'geolocation':
			return {
				type: 'geolocation',
				geolocation: {
					latitude: toCoordinate(read('latitude', 0)),
					longitude: toCoordinate(read('longitude', 0)),
				},
			};

		default:
			throw new Error(`Unsupported QR type "${qrType}". Use one of: ${QR_CODE_TYPES.join(', ')}.`);
	}
}

/**
 * A Mode parameter value as the API takes it: `static`, `dynamic`, or
 * `undefined` for anything else (an empty "Keep Current", or an expression that
 * resolved to an empty string), so the caller sends no `mode` at all.
 */
export function readQrMode(value: unknown): QrCodeMode | undefined {
	const mode = toText(value).trim().toLowerCase();
	return mode === 'static' || mode === 'dynamic' ? mode : undefined;
}

/** A date-time parameter as ISO, or `undefined` when empty (an expression that resolved to ''). */
function readDateTime(value: unknown): string | undefined {
	if (value instanceof Date) return value.toISOString();
	const text = toText(value).trim();
	if (!text) return undefined;
	const parsed = new Date(text);
	// Leave anything unparseable as typed: the API's 400 names the field.
	return Number.isNaN(parsed.getTime()) ? text : parsed.toISOString();
}

/**
 * The `access` body value from the Scan Rules collection:
 * - `undefined`: nothing set, send no `access` (Update keeps the stored rules);
 * - `null`: Clear Scan Rules is on, send `access: null`;
 * - otherwise the rules object, which replaces the stored rules as a whole.
 * Empty values (including expressions that resolve to '') are skipped.
 */
export function buildQrAccess(rules: IQRCodeScanRulesParameter | undefined): IQRCodeAccess | null | undefined {
	if (!rules) return undefined;
	if (rules.clearScanRules === true || toText(rules.clearScanRules).trim().toLowerCase() === 'true') return null;

	const access: IQRCodeAccess = {};
	const activeFrom = readDateTime(rules.activeFrom);
	if (activeFrom) access.activeFrom = activeFrom;
	const expiresAt = readDateTime(rules.expiresAt);
	if (expiresAt) access.expiresAt = expiresAt;
	const maxVisitsText = toText(rules.maxVisits).trim();
	if (maxVisitsText) access.maxVisits = Number(maxVisitsText);
	const fallbackUrl = toText(rules.fallbackUrl).trim();
	if (fallbackUrl) access.fallbackUrl = fallbackUrl;

	return Object.keys(access).length ? access : undefined;
}
