import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ChatDesqApi implements ICredentialType {
	name = 'chatDesqApi';

	displayName = 'ChatDesq API';

	icon = { light: 'file:chatdesq.svg', dark: 'file:chatdesq.dark.svg' } as const;

	documentationUrl = 'https://github.com/chatdesq/n8n-nodes-chatdesq#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Create a key in ChatDesq under Settings > API keys. It starts with sk_live_',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.chatdesq.com/v1',
			description: 'Leave as is unless ChatDesq support tells you to use a different API address',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl || "https://api.chatdesq.com/v1"}}',
			url: '/whatsapp-accounts',
			method: 'GET',
		},
	};
}
