import type {
	IAuthenticateGeneric,
	IAuthenticateRuleResponseCode,
	IAuthenticateRuleResponseSuccessBody,
} from 'n8n-workflow';
import { Posty5Api } from '../credentials/Posty5Api.credentials';
import { version } from '../package.json';

/**
 * The credential definition n8n reads: its Test button and its auth header.
 *
 * The expected values are spelled out rather than read back from
 * `utils/constants.ts`, so a change to a constant shows up here as a change to
 * what n8n actually sends.
 */
describe('Posty5Api credential', () => {
	const credential = new Posty5Api();
	// n8n-workflow types `rules` as a list of one kind; the credential mixes both.
	const rules = (credential.test.rules ?? []) as Array<
		IAuthenticateRuleResponseCode | IAuthenticateRuleResponseSuccessBody
	>;

	describe('identity (saved workflows depend on these names)', () => {
		it('keeps the credential name and its apiKey password field', () => {
			expect(credential.name).toBe('posty5Api');

			const apiKey = credential.properties.find((property) => property.name === 'apiKey');
			expect(apiKey?.typeOptions?.password).toBe(true);
			expect(apiKey?.required).toBe(true);
		});

		it('sends the key as X-API-Key', () => {
			const authenticate = credential.authenticate as IAuthenticateGeneric;
			expect(authenticate.properties.headers).toEqual({
				'X-API-Key': '={{$credentials.apiKey}}',
			});
		});
	});

	describe('Test button', () => {
		it('asks GET /api/api-key/current on the API origin the nodes use, and names the client', () => {
			expect(credential.test.request).toEqual({
				baseURL: 'https://api.posty5.com',
				url: '/api/api-key/current',
				method: 'GET',
				headers: { 'X-Posty5-Client': `posty5-n8n/${version}` },
			});
		});

		it('no longer tests by listing short links', () => {
			expect(credential.test.request.url).not.toContain('short-link');
			expect(credential.test.request.qs).toBeUndefined();
		});

		it('shows "Invalid or revoked API key" on a 401', () => {
			expect(rules).toContainEqual({
				type: 'responseCode',
				properties: { value: 401, message: 'Invalid or revoked API key' },
			});
		});

		describe('a 200 passes only when it names the key', () => {
			const bodyRule = rules.find(
				(rule): rule is IAuthenticateRuleResponseSuccessBody => rule.type === 'responseSuccessBody',
			);
			// n8n's credential tester fails a successful response when
			// `get(body, key) === value`; this walks the same dotted path.
			const failsOn = (body: object): boolean => {
				const found = String(bodyRule?.properties.key)
					.split('.')
					.reduce<unknown>(
						(node, segment) =>
							node !== null && typeof node === 'object'
								? (node as Record<string, unknown>)[segment]
								: undefined,
						body,
					);
				return found === bodyRule?.properties.value;
			};

			it('is a responseSuccessBody rule on result.apiKey._id', () => {
				expect(bodyRule?.properties).toEqual(
					expect.objectContaining({ key: 'result.apiKey._id', value: undefined }),
				);
				expect(bodyRule?.properties.message).toEqual(expect.any(String));
			});

			it('passes the /api/api-key/current envelope', () => {
				expect(
					failsOn({
						message: 'ok',
						result: { apiKey: { _id: 'key-1', name: 'n8n', recordScope: 'key' } },
					}),
				).toBe(false);
			});

			it('fails a 200 that carries no key id', () => {
				expect(failsOn({ message: 'ok', result: { items: [] } })).toBe(true);
				expect(failsOn({ message: 'ok', result: { apiKey: {} } })).toBe(true);
				expect(failsOn({})).toBe(true);
			});
		});
	});
});
