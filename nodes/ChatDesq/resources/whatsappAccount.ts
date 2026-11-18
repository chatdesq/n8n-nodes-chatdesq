import type { INodeProperties } from 'n8n-workflow';
import { postReceiveUnwrap } from '../shared';

export const whatsappAccountDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['whatsappAccount'] } },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many connected numbers',
				description: 'List the WhatsApp Business numbers connected to your workspace',
				routing: {
					request: { method: 'GET', url: '/whatsapp-accounts' },
					output: { postReceive: postReceiveUnwrap },
				},
			},
		],
		default: 'getAll',
	},
];
