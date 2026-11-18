import type { INodeProperties } from 'n8n-workflow';
import { paging, postReceiveUnwrap } from '../shared';

const showGetAll = { resource: ['conversation'], operation: ['getAll'] };
const showMessages = { resource: ['conversation'], operation: ['getMessages'] };

export const conversationDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['conversation'] } },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many conversations',
				description: 'List inbox conversations',
				routing: {
					request: { method: 'GET', url: '/conversations' },
					output: { postReceive: postReceiveUnwrap },
				},
			},
			{
				name: 'Get Messages',
				value: 'getMessages',
				action: 'Get messages of a conversation',
				description: 'Read the messages in one conversation',
				routing: {
					request: { method: 'GET', url: '=/conversations/{{$parameter.conversationId}}/messages' },
					output: { postReceive: postReceiveUnwrap },
				},
			},
		],
		default: 'getAll',
	},

	{
		displayName: 'Conversation ID',
		name: 'conversationId',
		type: 'string',
		required: true,
		default: '',
		description: 'ID (UUID) of the conversation. Use Conversation > Get Many to find it.',
		displayOptions: { show: showMessages },
	},
	...paging(showMessages),
	{
		displayName: 'Search',
		name: 'search',
		type: 'string',
		default: '',
		description: 'Only return messages containing this text',
		displayOptions: { show: showMessages },
		routing: { send: { type: 'query', property: 'search' } },
	},

	{
		displayName: 'Status',
		name: 'status',
		type: 'options',
		default: 'all',
		options: [
			{ name: 'All', value: 'all' },
			{ name: 'Open', value: 'open' },
			{ name: 'Pending', value: 'pending' },
			{ name: 'Resolved', value: 'resolved' },
		],
		displayOptions: { show: showGetAll },
		routing: { send: { type: 'query', property: 'status' } },
	},
	{
		displayName: 'Channel',
		name: 'channel',
		type: 'options',
		default: 'all',
		options: [
			{ name: 'All', value: 'all' },
			{ name: 'Facebook', value: 'facebook' },
			{ name: 'Instagram', value: 'instagram' },
			{ name: 'WhatsApp', value: 'whatsapp' },
		],
		displayOptions: { show: showGetAll },
		routing: { send: { type: 'query', property: 'channel' } },
	},
	{
		displayName: 'Search',
		name: 'search',
		type: 'string',
		default: '',
		description: 'Search by contact name, phone or message text',
		displayOptions: { show: showGetAll },
		routing: { send: { type: 'query', property: 'search' } },
	},
	...paging(showGetAll),
];
