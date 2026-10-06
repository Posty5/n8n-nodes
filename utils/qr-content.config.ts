/**
 * Option lists and limits of the QR content types (vCard, event, WhatsApp,
 * review, social). They mirror the API's `QrContentConfig`
 * (`link-tools-service/.../qr-code/qr-text.config.ts`) and the npm SDK's
 * `QrCodeVCardPhoneKind` / `QrCodeReviewPlatform` / `QrCodeSocialPlatform`.
 */

export const QR_CONTENT_CONFIG = {
	vcard: {
		phoneKinds: ['mobile', 'work', 'home'],
		defaultPhoneKind: 'mobile',
		phonesMax: 3,
		emailsMax: 2,
		/** Separator of the Emails field (comma-separated → array). */
		emailSeparator: ',',
	},
	event: {
		defaultTimezone: 'UTC',
	},
	review: {
		platforms: ['google', 'tripadvisor', 'trustpilot', 'yelp', 'facebook', 'other'],
		/** The platform that takes a Place ID instead of a URL. */
		placeIdPlatform: 'google',
	},
	social: {
		platforms: [
			'instagram',
			'facebook',
			'tiktok',
			'x',
			'youtube',
			'linkedin',
			'snapchat',
			'telegram',
			'threads',
			'pinterest',
			'other',
		],
		/** Profiles a static code may carry; more makes the code dynamic-only. */
		maxProfilesStatic: 1,
		/** Profiles a dynamic code may carry (API `maxProfilesDynamic`). */
		maxProfilesDynamic: 12,
		defaultPlatform: 'instagram',
	},
	/** Types with no static form: the node hides Mode and always sends `mode: dynamic`. */
	dynamicOnlyTypes: ['appStore', 'file'],
	/** Types *Create Many* cannot send (the bulk route refuses a `file` row: it needs an upload first). */
	bulkExcludedTypes: ['file'],
	file: {
		/** Default binary property the file is read from. */
		defaultBinaryProperty: 'data',
		/** The API's default upload cap (`QR_FILE_MAX_UPLOAD_MB`, 10 MB); checked before any request. */
		maxUploadBytes: 10 * 1024 * 1024,
		fileNameMax: 120,
		/** MIME types a `file` code accepts (API `QrFileConfig.mimeTypes`). */
		mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
		/** File name sent when neither the field nor the binary has one. */
		fallbackFileName: 'file',
		uploadUrlPath: '/file/upload-url',
	},
} as const;

/** Errors the QR Code node raises before calling the API for a `file` code. */
export const QR_FILE_MESSAGES = {
	binaryMissing: (property: string) =>
		`No binary data in property "${property}" of the input item. Set Binary Property to the property holding the file.`,
	tooLarge: (maxMb: number) => `The file is larger than ${maxMb} MB, the Posty5 limit for a file QR code.`,
	empty: 'The file is empty.',
	mimeNotAllowed: (mimeType: string) =>
		`A file QR code takes a PDF, JPEG, PNG or WebP file, not "${mimeType || 'unknown'}".`,
	notInBulk: 'File QR codes cannot be created with Create Many: use Create (the file is uploaded first).',
} as const;

/** Display names of the option values above. */
export const QR_CONTENT_LABELS: Record<string, string> = {
	mobile: 'Mobile',
	work: 'Work',
	home: 'Home',
	google: 'Google',
	tripadvisor: 'Tripadvisor',
	trustpilot: 'Trustpilot',
	yelp: 'Yelp',
	facebook: 'Facebook',
	instagram: 'Instagram',
	tiktok: 'TikTok',
	x: 'X (Twitter)',
	youtube: 'YouTube',
	linkedin: 'LinkedIn',
	snapchat: 'Snapchat',
	telegram: 'Telegram',
	threads: 'Threads',
	pinterest: 'Pinterest',
	other: 'Other',
};

/** A static IANA time-zone list for the Event Timezone field (any other zone can be typed via an expression). */
export const QR_EVENT_TIMEZONES = [
	'UTC',
	'Africa/Cairo',
	'Africa/Casablanca',
	'Africa/Johannesburg',
	'Africa/Lagos',
	'Africa/Nairobi',
	'America/Anchorage',
	'America/Bogota',
	'America/Chicago',
	'America/Denver',
	'America/Los_Angeles',
	'America/Mexico_City',
	'America/New_York',
	'America/Sao_Paulo',
	'America/Toronto',
	'Asia/Baghdad',
	'Asia/Bangkok',
	'Asia/Dubai',
	'Asia/Hong_Kong',
	'Asia/Jakarta',
	'Asia/Karachi',
	'Asia/Kolkata',
	'Asia/Riyadh',
	'Asia/Seoul',
	'Asia/Shanghai',
	'Asia/Singapore',
	'Asia/Tokyo',
	'Australia/Melbourne',
	'Australia/Sydney',
	'Europe/Amsterdam',
	'Europe/Berlin',
	'Europe/Istanbul',
	'Europe/London',
	'Europe/Madrid',
	'Europe/Moscow',
	'Europe/Paris',
	'Europe/Rome',
	'Pacific/Auckland',
] as const;

/** n8n option rows for a list of values. */
export function toNodeOptions(values: readonly string[]): Array<{ name: string; value: string }> {
	return values.map((value) => ({ name: QR_CONTENT_LABELS[value] ?? value, value }));
}
