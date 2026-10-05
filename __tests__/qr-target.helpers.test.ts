import { buildQrCodeTarget } from '../utils/qr-target.helpers';

/** A parameter reader over a plain object, like the node's `getNodeParameter` with a fallback. */
function reader(values: Record<string, unknown>) {
	return (name: string, fallback?: unknown) =>
		values[name] !== undefined ? values[name] : fallback;
}

describe('qr-target.helpers', () => {
	describe('buildQrCodeTarget', () => {
		it('should send numbers from expressions as text where the API wants a string', () => {
			expect(buildQrCodeTarget('call', reader({ phoneNumber: 201234567890 }))).toEqual({
				type: 'call',
				call: { phoneNumber: '201234567890' },
			});
			expect(buildQrCodeTarget('sms', reader({ smsPhoneNumber: 201234567890 }))).toEqual({
				type: 'sms',
				sms: { phoneNumber: '201234567890' },
			});
		});

		it('should keep coordinates as numbers and pass expression text through', () => {
			expect(
				buildQrCodeTarget('geolocation', reader({ latitude: 0, longitude: '-74.006' })),
			).toEqual({
				type: 'geolocation',
				geolocation: { latitude: 0, longitude: '-74.006' },
			});
		});

		it('should leave the content unencoded: the server builds the QR text', () => {
			const target = buildQrCodeTarget(
				'email',
				reader({ email: 'a@example.com', emailSubject: 'Q&A?', emailBody: 'line 1\nline 2' }),
			);
			expect(target).toEqual({
				type: 'email',
				email: { email: 'a@example.com', subject: 'Q&A?', body: 'line 1\nline 2' },
			});
			expect(target).not.toHaveProperty('text');
		});

		it('should default the WiFi authentication to WPA', () => {
			expect(
				buildQrCodeTarget('wifi', reader({ wifiName: 'Office', wifiPassword: 'secret' })),
			).toEqual({
				type: 'wifi',
				wifi: { name: 'Office', authenticationType: 'WPA', password: 'secret' },
			});
		});

		it('should refuse a type the API does not validate', () => {
			expect(() => buildQrCodeTarget('contact', reader({}))).toThrow(
				'Unsupported QR type "contact"',
			);
		});
	});
});
