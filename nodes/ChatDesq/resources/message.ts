import type { INodeProperties } from 'n8n-workflow';
import { postReceiveUnwrap } from '../shared';

const show = (operation: string[]) => ({ resource: ['message'], operation });

export const messageDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['message'] } },
		options: [
			{
				name: 'Get Status',
				value: 'getStatus',
				action: 'Get message status',
				description: 'Get a sent message and its delivery status',
				routing: {
					request: {
						method: 'GET',
						url: '=/messages/{{encodeURIComponent($parameter.messageId)}}',
					},
					output: { postReceive: postReceiveUnwrap },
				},
			},
			{
				name: 'Send Template',
				value: 'sendTemplate',
				action: 'Send a template message',
				description: 'Send one approved WhatsApp template to one opted-in number',
				routing: {
					request: { method: 'POST', url: '/messages', body: { type: 'template' } },
					output: { postReceive: postReceiveUnwrap },
				},
			},
			{
				name: 'Send Text',
				value: 'sendText',
				action: 'Send a text message',
				description:
					"Send one free-form text. Works only within 24 hours of the customer's last message.",
				routing: {
					request: { method: 'POST', url: '/messages', body: { type: 'text' } },
					output: { postReceive: postReceiveUnwrap },
				},
			},
		],
		default: 'sendTemplate',
	},

	// ---- Send Template / Send Text ----
	{
		displayName: 'Phone Number',
		name: 'to',
		type: 'string',
		required: true,
		default: '',
		placeholder: '919876543210',
		description:
			'Recipient in international format, with country code. Send only to people who opted in.',
		displayOptions: { show: show(['sendTemplate', 'sendText']) },
		routing: { send: { type: 'body', property: 'to' } },
	},
	{
		displayName: 'Template Name',
		name: 'templateName',
		type: 'string',
		required: true,
		default: '',
		description: 'Name of an approved template. Use Template > Get Many to list them.',
		displayOptions: { show: show(['sendTemplate']) },
		routing: { send: { type: 'body', property: 'template.name' } },
	},
	{
		displayName: 'Language Code',
		name: 'language',
		type: 'string',
		default: 'en',
		placeholder: 'en',
		description: 'Language code of the template, for example en, hi or en_US',
		displayOptions: { show: show(['sendTemplate']) },
		routing: { send: { type: 'body', property: 'template.language' } },
	},
	{
		displayName: 'Body Variables',
		name: 'parameters',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		default: {},
		placeholder: 'Add Variable',
		description: 'Values for the numbered variables in the template body, in order',
		displayOptions: { show: show(['sendTemplate']) },
		options: [
			{
				displayName: 'Variable',
				name: 'values',
				values: [
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'Text that replaces this variable',
					},
				],
			},
		],
		routing: {
			send: {
				type: 'body',
				property: 'template.parameters',
				value: '={{ ($value.values || []).map(function (v) { return String(v.value); }) }}',
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'templateOptions',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: show(['sendTemplate']) },
		options: [
			{
				displayName: 'Callback Data',
				name: 'callbackData',
				type: 'string',
				default: '',
				description: 'Your own reference, returned in delivery webhooks (up to 512 characters)',
				routing: { send: { type: 'body', property: 'callbackData' } },
			},
			{
				displayName: 'Header Media URL',
				name: 'headerMediaLink',
				type: 'string',
				default: '',
				description: 'Public link to the image, video or document for a media header',
				routing: { send: { type: 'body', property: 'template.headerMedia.link' } },
			},
			{
				displayName: 'Header Text',
				name: 'headerText',
				type: 'string',
				default: '',
				description: 'Value for a text header variable, if the template has one',
				routing: { send: { type: 'body', property: 'template.headerText' } },
			},
			{
				displayName: 'Send From (WhatsApp Account ID)',
				name: 'from',
				type: 'string',
				default: '',
				description:
					'ID of the WhatsApp number to send from. Leave empty for the default number. See WhatsApp Account > Get Many.',
				routing: { send: { type: 'body', property: 'from' } },
			},
		],
	},

	// ---- Send Text ----
	{
		displayName: 'Text',
		name: 'text',
		type: 'string',
		typeOptions: { rows: 4 },
		required: true,
		default: '',
		description: 'Message text, up to 4096 characters. Only delivered inside the 24-hour window.',
		displayOptions: { show: show(['sendText']) },
		routing: { send: { type: 'body', property: 'text' } },
	},
	{
		displayName: 'Additional Fields',
		name: 'textOptions',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: show(['sendText']) },
		options: [
			{
				displayName: 'Callback Data',
				name: 'callbackData',
				type: 'string',
				default: '',
				description: 'Your own reference, returned in delivery webhooks (up to 512 characters)',
				routing: { send: { type: 'body', property: 'callbackData' } },
			},
			{
				displayName: 'Send From (WhatsApp Account ID)',
				name: 'from',
				type: 'string',
				default: '',
				description: 'ID of the WhatsApp number to send from. Leave empty for the default number.',
				routing: { send: { type: 'body', property: 'from' } },
			},
		],
	},

	// ---- Get Status ----
	{
		displayName: 'Message ID',
		name: 'messageId',
		type: 'string',
		required: true,
		default: '',
		description: 'ID returned when the message was sent',
		displayOptions: { show: show(['getStatus']) },
	},
];
