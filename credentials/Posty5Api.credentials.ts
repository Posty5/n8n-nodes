import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

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

	test: ICredentialTestRequest = {
		request: {
			url: '/api/short-link',
			method: 'GET',
			qs: {
				page: 1,
				pageSize: 1,
			},
		},
	};
}
