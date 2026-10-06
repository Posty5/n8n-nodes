/**
 * `qrCodeTarget` for the QR Code node.
 *
 * The API reads a QR code's content from `qrCodeTarget: { type, [type]: {...} }`
 * and nowhere else. The node builds no `options.text`: the server encodes the
 * target itself, so the stored text is always the one its safety checks saw.
 */

import { QR_CODE_TYPES, QR_WIFI_AUTH } from './constants';
import { toText } from './link-tool.helpers';
import { QR_CONTENT_CONFIG } from './qr-content.config';
import type {
	IQRCodeAppStoreTarget,
	IQRCodeEmailTarget,
	IQRCodeFileTarget,
	IQRCodeSocialProfilesParameter,
	IQRCodeSocialTarget,
	IQRCodeEventTarget,
	IQRCodeReviewTarget,
	IQRCodeSocialProfile,
	IQRCodeVCardAddress,
	IQRCodeVCardPhone,
	IQRCodeVCardPhonesParameter,
	IQRCodeVCardTarget,
	IQRCodeWhatsappTarget,
	QrCodeReviewPlatform,
	QrCodeSocialPlatform,
	QrCodeVCardPhoneKind,
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

/** Sets `target[key]` to the trimmed text of `value`, or leaves it unset when empty. */
function setText<T extends object>(target: T, key: keyof T & string, value: unknown): void {
	const text = toText(value).trim();
	if (text) (target as Record<string, unknown>)[key] = text;
}

/** A boolean parameter, also accepting the text `"true"` an expression may produce. */
function readBoolean(value: unknown): boolean {
	return value === true || toText(value).trim().toLowerCase() === 'true';
}

/**
 * An event date-time as the API takes it: an ISO string kept as typed (a
 * wall-clock value is read in the event's timezone), a `Date` as ISO, or
 * `undefined` when empty.
 */
function readEventDateTime(value: unknown): string | undefined {
	if (value instanceof Date) return value.toISOString();
	const text = toText(value).trim();
	return text || undefined;
}

/** The vCard target: empty fields are not sent; emails split on commas, at most the API's cap. */
function buildVCardTarget(read: QrParameterReader): IQRCodeVCardTarget {
	const config = QR_CONTENT_CONFIG.vcard;
	const vcard: IQRCodeVCardTarget = {};
	setText(vcard, 'firstName', read('vcardFirstName', ''));
	setText(vcard, 'lastName', read('vcardLastName', ''));
	setText(vcard, 'organization', read('vcardOrganization', ''));
	setText(vcard, 'jobTitle', read('vcardJobTitle', ''));

	const phonesParameter = (read('vcardPhones', {}) ?? {}) as IQRCodeVCardPhonesParameter;
	const phones: IQRCodeVCardPhone[] = (phonesParameter.phone ?? [])
		.map((row) => ({
			kind: (toText(row.kind).trim() || config.defaultPhoneKind) as QrCodeVCardPhoneKind,
			number: toText(row.number).trim(),
		}))
		.filter((phone) => phone.number);
	// Over the cap is sent as is: the API's 400 names the limit.
	if (phones.length) vcard.phones = phones;

	const emailsValue = read('vcardEmails', '');
	const emails = (Array.isArray(emailsValue) ? emailsValue : toText(emailsValue).split(config.emailSeparator))
		.map((email) => toText(email).trim())
		.filter(Boolean);
	if (emails.length) vcard.emails = emails;

	setText(vcard, 'website', read('vcardWebsite', ''));

	const addressParameter = (read('vcardAddress', {}) ?? {}) as Record<string, unknown>;
	const address: IQRCodeVCardAddress = {};
	for (const key of ['street', 'city', 'region', 'postalCode', 'country'] as const) {
		setText(address, key, addressParameter[key]);
	}
	if (Object.keys(address).length) vcard.address = address;

	setText(vcard, 'note', read('vcardNote', ''));
	return vcard;
}

/**
 * The social target from the Profiles fixedCollection (up to 12 rows). Rows
 * with neither a handle nor a URL are dropped; over the cap is sent as is (the
 * API's 400 names the limit). `title` only when set.
 */
function buildSocialTarget(read: QrParameterReader): IQRCodeSocialTarget {
	const parameter = (read('socialProfiles', {}) ?? {}) as IQRCodeSocialProfilesParameter;
	const profiles: IQRCodeSocialProfile[] = [];
	for (const row of parameter.profile ?? []) {
		const profile: IQRCodeSocialProfile = {
			platform: (toText(row.platform).trim() || QR_CONTENT_CONFIG.social.defaultPlatform) as QrCodeSocialPlatform,
		};
		setText(profile, 'handle', row.handle);
		setText(profile, 'url', row.url);
		if (profile.handle || profile.url) profiles.push(profile);
	}
	const social: IQRCodeSocialTarget = { profiles };
	setText(social, 'title', read('socialTitle', ''));
	return social;
}

/**
 * `dynamic` when the target has no static form — an `appStore` or `file` code,
 * or `social` with more than one profile — so the node sends `mode: dynamic`
 * whatever Mode says (the API answers 400 to a static one); else `undefined`.
 */
export function requiredQrMode(target: IQRCodeTarget): QrCodeMode | undefined {
	if ((QR_CONTENT_CONFIG.dynamicOnlyTypes as readonly string[]).includes(target.type)) return 'dynamic';
	if (target.type === 'social' && (target.social?.profiles.length ?? 0) > QR_CONTENT_CONFIG.social.maxProfilesStatic) {
		return 'dynamic';
	}
	return undefined;
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

		case 'vcard':
			return { type: 'vcard', vcard: buildVCardTarget(read) };

		case 'event': {
			const event: IQRCodeEventTarget = {
				title: toText(read('eventTitle', '')).trim(),
				startsAt: readEventDateTime(read('eventStartsAt', '')) ?? '',
			};
			setText(event, 'location', read('eventLocation', ''));
			setText(event, 'description', read('eventDescription', ''));
			const endsAt = readEventDateTime(read('eventEndsAt', ''));
			if (endsAt) event.endsAt = endsAt;
			if (readBoolean(read('eventAllDay', false))) event.allDay = true;
			setText(event, 'timezone', read('eventTimezone', QR_CONTENT_CONFIG.event.defaultTimezone));
			setText(event, 'url', read('eventUrl', ''));
			return { type: 'event', event };
		}

		case 'whatsapp': {
			const whatsapp: IQRCodeWhatsappTarget = {
				phoneNumber: toText(read('whatsappPhoneNumber', '')).trim(),
			};
			const message = toText(read('whatsappMessage', ''));
			if (message) whatsapp.message = message;
			return { type: 'whatsapp', whatsapp };
		}

		case 'review': {
			const platform = toText(read('reviewPlatform', 'google')).trim() as QrCodeReviewPlatform;
			const review: IQRCodeReviewTarget = { platform };
			// Place ID is a Google-only field; another platform never sends it.
			if (platform === QR_CONTENT_CONFIG.review.placeIdPlatform) {
				setText(review, 'placeId', read('reviewPlaceId', ''));
			}
			setText(review, 'url', read('reviewUrl', ''));
			return { type: 'review', review };
		}

		case 'social':
			return { type: 'social', social: buildSocialTarget(read) };

		case 'appStore': {
			const appStore: IQRCodeAppStoreTarget = { fallbackUrl: toText(read('appStoreFallbackUrl', '')).trim() };
			setText(appStore, 'androidUrl', read('appStoreAndroidUrl', ''));
			setText(appStore, 'iosUrl', read('appStoreIosUrl', ''));
			return { type: 'appStore', appStore };
		}

		case 'file': {
			// `bucketFilePath` is added by the node after the upload (see `uploadQrFile`);
			// without it an update keeps the stored file.
			const file: IQRCodeFileTarget = {};
			setText(file, 'fileName', read('fileName', ''));
			return { type: 'file', file };
		}

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
