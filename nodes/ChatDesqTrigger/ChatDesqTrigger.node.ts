import { createHmac, timingSafeEqual } from 'crypto';
import {
	NodeConnectionTypes,
	NodeOperationError,
	type IDataObject,
	type IHookFunctions,
	type ILoadOptionsFunctions,
	type INodePropertyOptions,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookFunctions,
	type IWebhookResponseData,
} from 'n8n-workflow';

const DEFAULT_BASE_URL = 'https://api.chatdesq.com/v1';

/** Events accepted by POST /webhooks (from the public OpenAPI spec). Used if the live list can't be loaded. */
const FALLBACK_EVENTS = [
	'message.received',
	'message.received.new_contact',
	'message.replied',
	'button.clicked',
	'flow.response',
	'session.message.sent',
	'template.message.sent',
	'message.delivered',
	'message.read',
	'message.failed',
	'contact.created',
	'contact.updated',
	'contact.deleted',
	'call.received',
	'call.completed',
	'call.missed',
	'call.failed',
	'deal.created',
	'deal.updated',
	'deal.stage_changed',
	'deal.won',
	'deal.lost',
	'deal.deleted',
	'broadcast.created',
	'broadcast.completed',
	'sequence.enrolled',
	'sequence.completed',
	'order.created',
	'order.status_updated',
	'order.paid',
	'order.payment_failed',
	'lead.customer.message',
	'lead.agent.message',
];

function unwrap(body: unknown): IDataObject {
	const obj = (body ?? {}) as IDataObject;
	const inner = obj.data;
	return inner && typeof inner === 'object' && !Array.isArray(inner) ? (inner as IDataObject) : obj;
}

async function chatDesqRequest(
	ctx: IHookFunctions | ILoadOptionsFunctions,
	method: 'GET' | 'POST' | 'DELETE',
	path: string,
	body?: IDataObject,
): Promise<unknown> {
	const credentials = await ctx.getCredentials('chatDesqApi');
	const baseUrl = String(credentials.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
	return await ctx.helpers.httpRequestWithAuthentication.call(ctx, 'chatDesqApi', {
		method,
		url: `${baseUrl}${path}`,
		body,
		json: true,
	});
}

/** Standard Webhooks: HMAC-SHA256 over "<id>.<timestamp>.<rawBody>", base64, in `v1,<sig>` entries. */
function verifySignature(
	secret: string,
	id: string,
	timestamp: string,
	rawBody: Buffer,
	header: string,
): boolean {
	const signedPayload = Buffer.concat([Buffer.from(`${id}.${timestamp}.`), rawBody]);
	const keys: Buffer[] = [Buffer.from(secret, 'utf8')];
	const stripped = secret.startsWith('whsec_') ? secret.slice(6) : secret;
	try {
		keys.push(Buffer.from(stripped, 'base64'));
	} catch {
		// not base64: the raw key above is used
	}
	const received = header
		.split(' ')
		.map((part) => part.split(','))
		.filter(([version]) => version === 'v1')
		.map(([, sig]) => Buffer.from(sig ?? '', 'utf8'));
	return keys.some((key) => {
		const expected = Buffer.from(
			createHmac('sha256', key).update(signedPayload).digest('base64'),
			'utf8',
		);
		return received.some((sig) => sig.length === expected.length && timingSafeEqual(sig, expected));
	});
}

export class ChatDesqTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ChatDesq Trigger',
		name: 'chatDesqTrigger',
		icon: { light: 'file:chatdesq.svg', dark: 'file:chatdesq.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Starts a workflow when something happens in ChatDesq, such as a WhatsApp message',
		defaults: {
			name: 'ChatDesq Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'chatDesqApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Event Names or IDs',
				name: 'events',
				type: 'multiOptions',
				typeOptions: { loadOptionsMethod: 'getEvents' },
				required: true,
				default: ['message.received'],
				description:
					'Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},
			{
				displayName: 'Verify Signature',
				name: 'verifySignature',
				type: 'boolean',
				default: true,
				description:
					'Whether to check the Standard Webhooks signature that ChatDesq adds to every delivery, and reject requests that fail the check',
			},
		],
	};

	methods = {
		loadOptions: {
			async getEvents(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				let events: string[] = FALLBACK_EVENTS;
				try {
					const body = (await chatDesqRequest(this, 'GET', '/webhooks/events')) as unknown;
					const root = (body as IDataObject)?.data ?? body;
					const list = Array.isArray(root)
						? root
						: ((root as IDataObject)?.events as unknown[] | undefined);
					if (Array.isArray(list) && list.length) {
						events = list.map((e) =>
							typeof e === 'string' ? e : String((e as IDataObject).name ?? (e as IDataObject).event),
						);
					}
				} catch {
					// fall back to the static list from the API spec
				}
				return events.map((value) => ({ name: value, value }));
			},
		},
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node');
				const id = staticData.webhookId as string | undefined;
				if (!id) return false;
				try {
					await chatDesqRequest(this, 'GET', `/webhooks/${encodeURIComponent(id)}`);
					return true;
				} catch {
					delete staticData.webhookId;
					delete staticData.signingSecret;
					return false;
				}
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const events = this.getNodeParameter('events', []) as string[];
				const response = await chatDesqRequest(this, 'POST', '/webhooks', {
					url: webhookUrl,
					events,
					description: 'n8n workflow trigger',
				});
				const hook = unwrap(response);
				const id = hook.id as string | undefined;
				if (!id) {
					throw new NodeOperationError(
						this.getNode(),
						'ChatDesq did not return a webhook ID when registering the webhook',
					);
				}
				const secret = (hook.signing_secret ?? hook.signingSecret) as string | undefined;
				const staticData = this.getWorkflowStaticData('node');
				staticData.webhookId = id;
				staticData.signingSecret = secret;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node');
				const id = staticData.webhookId as string | undefined;
				if (id) {
					try {
						await chatDesqRequest(this, 'DELETE', `/webhooks/${encodeURIComponent(id)}`);
					} catch (error) {
						this.logger.warn(`ChatDesq webhook delete failed: ${(error as Error).message}`);
						return false;
					}
					delete staticData.webhookId;
					delete staticData.signingSecret;
				}
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const verify = this.getNodeParameter('verifySignature', true) as boolean;

		if (verify) {
			const secret = this.getWorkflowStaticData('node').signingSecret as string | undefined;
			const id = this.getHeaderData()['webhook-id'] as string | undefined;
			const timestamp = this.getHeaderData()['webhook-timestamp'] as string | undefined;
			const signature = this.getHeaderData()['webhook-signature'] as string | undefined;
			const rawBody = req.rawBody;
			const res = this.getResponseObject();

			const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
			const valid =
				!!secret &&
				!!id &&
				!!timestamp &&
				!!signature &&
				!!rawBody &&
				ageSeconds <= 300 &&
				verifySignature(secret, id, timestamp, Buffer.from(rawBody), signature);

			if (!valid) {
				res.status(401).send('Invalid signature');
				return { noWebhookResponse: true };
			}
		}

		return {
			workflowData: [this.helpers.returnJsonArray(this.getBodyData())],
		};
	}
}
