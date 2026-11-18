import type { INodeProperties } from 'n8n-workflow';
import { postReceiveUnwrap } from '../shared';

export const templateDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['template'] } },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many templates',
				description: 'List WhatsApp templates with their approval status and category',
				routing: {
					request: { method: 'GET', url: '/templates' },
					output: { postReceive: postReceiveUnwrap },
				},
			},
		],
		default: 'getAll',
	},
];
