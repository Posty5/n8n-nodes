import { Posty5QrCode } from '../nodes/Posty5QrCode/Posty5QrCode.node';
import { Posty5ShortLink } from '../nodes/Posty5ShortLink/Posty5ShortLink.node';
import { encodePathSegment } from '../utils/api.helpers';
import { createMockExecuteFunctions } from './setup';

/**
 * IDs reach the URL path from node parameters, often mapped from upstream data
 * (a form submission, a webhook body). One such value must stay one segment of
 * the route it was meant for, never a path to another route of the same API key.
 */
describe('encodePathSegment', () => {
	it('leaves an ObjectId unchanged', () => {
		expect(encodePathSegment('64f0c1a2b3c4d5e6f7a8b9c0')).toBe('64f0c1a2b3c4d5e6f7a8b9c0');
	});

	it('escapes separators, so a value cannot add segments, a query or a fragment', () => {
		expect(encodePathSegment('../api-key/current')).toBe('..%2Fapi-key%2Fcurrent');
		expect(encodePathSegment('x?pageSize=1000#y')).toBe('x%3FpageSize%3D1000%23y');
		expect(encodePathSegment('a\\b')).toBe('a%5Cb');
	});

	it('refuses a dot segment, which the URL parser would resolve to a parent path', () => {
		expect(() => encodePathSegment('..')).toThrow('".." is not a valid ID');
		expect(() => encodePathSegment('.')).toThrow('"." is not a valid ID');
	});

	it('reads a missing value as empty, not as "undefined"', () => {
		expect(encodePathSegment(undefined)).toBe('');
		expect(encodePathSegment(null)).toBe('');
	});
});

describe('IDs in request paths', () => {
	const API_KEY = 'test-api-key';

	it('keeps a mapped Short Link ID inside /api/short-link/:id', async () => {
		const context = createMockExecuteFunctions(
			{ operation: 'get', shortLinkId: '../api-key/current' },
			[{ json: {} }],
			{ apiKey: API_KEY },
			{ result: { _id: 'sl1' } },
		);

		await new Posty5ShortLink().execute.call(context);

		expect(context.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				method: 'GET',
				url: 'https://api.posty5.com/api/short-link/..%2Fapi-key%2Fcurrent',
			}),
		);
	});

	it('sends no request for a dot-segment ID', async () => {
		const context = createMockExecuteFunctions(
			{ operation: 'get', shortLinkId: '..' },
			[{ json: {} }],
			{ apiKey: API_KEY },
		);

		await expect(new Posty5ShortLink().execute.call(context)).rejects.toThrow('".." is not a valid ID');
		expect(context.helpers.httpRequest).not.toHaveBeenCalled();
	});
});

describe('Secret parameters', () => {
	it('masks the QR Code WiFi password in the editor', () => {
		const wifiPassword = new Posty5QrCode().description.properties.find((prop) => prop.name === 'wifiPassword');
		expect(wifiPassword?.typeOptions?.password).toBe(true);
	});
});
