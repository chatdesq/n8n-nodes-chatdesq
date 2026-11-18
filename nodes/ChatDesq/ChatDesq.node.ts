import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { contactDescription } from './resources/contact';
import { conversationDescription } from './resources/conversation';
import { messageDescription } from './resources/message';
import { templateDescription } from './resources/template';
import { whatsappAccountDescription } from './resources/whatsappAccount';

export class ChatDesq implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ChatDesq',
		name: 'chatDesq',
		icon: { light: 'file:chatdesq.svg', dark: 'file:chatdesq.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Send WhatsApp messages and manage contacts with ChatDesq',
		defaults: {
			name: 'ChatDesq',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'chatDesqApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: '={{$credentials.baseUrl || "https://api.chatdesq.com/v1"}}',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Contact', value: 'contact' },
					{ name: 'Conversation', value: 'conversation' },
					{ name: 'Message', value: 'message' },
					{ name: 'Template', value: 'template' },
					{ name: 'WhatsApp Account', value: 'whatsappAccount' },
				],
				default: 'message',
			},
			...messageDescription,
			...templateDescription,
			...contactDescription,
			...conversationDescription,
			...whatsappAccountDescription,
		],
	};
}
