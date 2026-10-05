import {
	IAuthenticateGeneric,
	IAuthenticateRuleResponseCode,
	IAuthenticateRuleResponseSuccessBody,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';
import {
	API_ENDPOINTS,
	CredentialTestConst,
	POSTY5_API_BASE_URL,
	Posty5ClientConst,
} from '../utils/constants';

export class Posty5Api implements ICredentialType {
	name = 'posty5Api';
	displayName = 'Posty5 API';
	documentationUrl = 'https://guide.posty5.com/';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description:
				'Your Posty5 API key. Get it from https://studio.posty5.com/account/settings?tab=APIKeys',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-API-Key': '={{$credentials.apiKey}}',
			},
		},
	};

	/**
	 * Asks the API which key this is. A credential test has no node defaults to
	 * borrow, so `baseURL` is set here, from the constant the nodes use.
	 */
	test: ICredentialTestRequest = {
		request: {
			baseURL: POSTY5_API_BASE_URL,
			url: API_ENDPOINTS.API_KEY_CURRENT,
			method: 'GET',
			headers: {
				[Posty5ClientConst.HEADER]: Posty5ClientConst.VALUE,
			},
		},
		// n8n-workflow types `rules` as a list of one kind, but its credential tester
		// reads every rule by `type`: `responseCode` when the request fails,
		// `responseSuccessBody` when it succeeds (failing when the value at `key`
		// equals `value`). One list carrying both is what gives this test both checks.
		rules: [
			{
				type: 'responseCode',
				properties: {
					value: CredentialTestConst.INVALID_KEY_STATUS,
					message: CredentialTestConst.INVALID_KEY_MESSAGE,
				},
			} satisfies IAuthenticateRuleResponseCode,
			{
				type: 'responseSuccessBody',
				properties: {
					key: CredentialTestConst.KEY_ID_PATH,
					value: undefined,
					message: CredentialTestConst.NO_KEY_ID_MESSAGE,
				},
			} satisfies IAuthenticateRuleResponseSuccessBody,
		] as ICredentialTestRequest['rules'],
	};
}
