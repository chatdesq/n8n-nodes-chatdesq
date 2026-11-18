import type { INodeProperties } from 'n8n-workflow';
import { paging, postReceiveUnwrap } from '../shared';

const showFor = (operation: string[]) => ({ resource: ['contact'], operation });

const customFieldsRouting = {
	send: {
		type: 'body' as const,
		property: 'customFields',
		value: '={{ typeof $value === "string" ? JSON.parse($value) : $value }}',
	},
};

const contactFields = (operation: 'create' | 'update'): INodeProperties[] => [
	{
		displayName: 'Additional Fields',
		name: operation === 'create' ? 'createFields' : 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: showFor([operation]) },
		options: [
			{
				displayName: 'Custom Fields (JSON)',
				name: 'customFields',
				type: 'json',
				default: '{}',
				description: 'Object of custom field names and values, for example {"city": "Pune"}',
				routing: customFieldsRouting,
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				routing: { send: { type: 'body', property: 'email' } },
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				routing: { send: { type: 'body', property: 'name' } },
			},
			...(operation === 'update'
				? ([
						{
							displayName: 'Phone',
							name: 'phone',
							type: 'string',
							default: '',
							description: 'International format, for example 919876543210',
							routing: { send: { type: 'body', property: 'phone' } },
						},
					] as INodeProperties[])
				: []),
		],
	},
];

export const contactDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['contact'] } },
		options: [
			{
				name: 'Add Tag',
				value: 'addTag',
				action: 'Add tags to a contact',
				description: 'Add one or more tags to a contact',
				routing: {
					request: { method: 'POST', url: '=/contacts/{{$parameter.contactId}}/tags' },
					output: { postReceive: postReceiveUnwrap },
				},
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create a contact',
				description: 'Create a contact',
				routing: {
					request: { method: 'POST', url: '/contacts' },
					output: { postReceive: postReceiveUnwrap },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a contact',
				description: 'Get one contact with its custom fields and tags',
				routing: {
					request: { method: 'GET', url: '=/contacts/{{$parameter.contactId}}' },
					output: { postReceive: postReceiveUnwrap },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many contacts',
				description: 'Search contacts by name, phone, email, tag or segment',
				routing: {
					request: { method: 'GET', url: '/contacts' },
					output: { postReceive: postReceiveUnwrap },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a contact',
				description: "Update a contact's name, email, phone or custom fields",
				routing: {
					request: { method: 'PATCH', url: '=/contacts/{{$parameter.contactId}}' },
					output: { postReceive: postReceiveUnwrap },
				},
			},
		],
		default: 'getAll',
	},

	{
		displayName: 'Contact ID',
		name: 'contactId',
		type: 'string',
		required: true,
		default: '',
		description: 'ID (UUID) of the contact. Use Contact > Get Many to find it.',
		displayOptions: { show: showFor(['get', 'update', 'addTag']) },
	},

	{
		displayName: 'Phone',
		name: 'phone',
		type: 'string',
		required: true,
		default: '',
		placeholder: '919876543210',
		description: 'International format, with country code',
		displayOptions: { show: showFor(['create']) },
		routing: { send: { type: 'body', property: 'phone' } },
	},
	...contactFields('create'),
	...contactFields('update'),

	{
		displayName: 'Tag IDs',
		name: 'tagIds',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'tag-uuid-1, tag-uuid-2',
		description:
			'Comma-separated tag IDs (UUIDs) to add, up to 50. Tags must already exist in ChatDesq.',
		displayOptions: { show: showFor(['addTag']) },
		routing: {
			send: {
				type: 'body',
				property: 'add',
				value:
					'={{ String($value).split(",").map(function (s) { return s.trim(); }).filter(Boolean) }}',
			},
		},
	},

	{
		displayName: 'Search',
		name: 'search',
		type: 'string',
		default: '',
		description: 'Match on name, phone or email',
		displayOptions: { show: showFor(['getAll']) },
		routing: { send: { type: 'query', property: 'search' } },
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: showFor(['getAll']) },
		options: [
			{
				displayName: 'Segment ID',
				name: 'segmentId',
				type: 'string',
				default: '',
				description: 'Only contacts in this segment (UUID)',
				routing: { send: { type: 'query', property: 'segmentId' } },
			},
			{
				displayName: 'Tags',
				name: 'tags',
				type: 'string',
				default: '',
				description: 'Comma-separated tags to filter by',
				routing: { send: { type: 'query', property: 'tags' } },
			},
		],
	},
	...paging(showFor(['getAll'])),
];
