# n8n-nodes-chatdesq

n8n community nodes for [ChatDesq](https://chatdesq.com), a WhatsApp Business API platform built by Apporio Infolabs Pvt Ltd.

With these nodes a workflow can send an approved WhatsApp template or a reply, create and update contacts, read conversations, and start whenever ChatDesq reports an event (for example a new inbound message).

Pricing: https://chatdesq.com/pricing

## Install

In n8n: **Settings > Community Nodes > Install**, enter `n8n-nodes-chatdesq`.
See the [n8n community nodes guide](https://docs.n8n.io/integrations/community-nodes/installation/).

## Credentials

1. In ChatDesq, open **Settings > API keys** and create a key. Give it only the scopes you need (for example `contacts:read`, `conversations:write`, `messagetemplate:write`, `webhooks:manage`).
2. In n8n, create a **ChatDesq API** credential and paste the key (it starts with `sk_live_`).
3. Leave **Base URL** as `https://api.chatdesq.com/v1` unless ChatDesq support tells you otherwise.

The key is sent as `Authorization: Bearer <key>`. n8n tests the credential with `GET /whatsapp-accounts`, so the key needs the `whatsappaccounts:read` scope for the test to pass. The API allows 120 requests a minute per key.

## ChatDesq node

| Resource | Operation | What it does |
|---|---|---|
| Message | Send Template | Sends one approved template to one number. Fields: phone number, template name, language code, body variables (in order). Optional: header text or media link, callback data, sending number. |
| Message | Send Text | Sends one free-form text. Only delivered within 24 hours of the customer's last message. |
| Message | Get Status | Returns a sent message and its delivery status. |
| Template | Get Many | Lists templates with approval status and category. |
| Contact | Create | Creates a contact (phone required; name, email, custom fields optional). |
| Contact | Get | Returns one contact by ID. |
| Contact | Get Many | Searches contacts by text, tags or segment, with limit and page. |
| Contact | Update | Changes name, email, phone or custom fields. |
| Contact | Add Tag | Adds existing tags (by ID, comma-separated) to a contact. |
| Conversation | Get Many | Lists inbox conversations by status, channel or search text. |
| Conversation | Get Messages | Reads the messages in one conversation. |
| WhatsApp Account | Get Many | Lists connected WhatsApp numbers (their IDs are used in "Send From"). |

List operations return one n8n item per record. The node can also be used as a tool by an AI Agent node.

### Left out on purpose

Bulk broadcasts, sequence enrolment, every delete operation and API key rotation are not included. These are the same limits as the ChatDesq MCP server. Do bulk sending and deletions in the ChatDesq dashboard, where they can be reviewed.

## ChatDesq Trigger node

Starts a workflow when ChatDesq sends an event. When you activate the workflow, the node registers its webhook URL with `POST /webhooks` for the events you choose (the list comes from `GET /webhooks/events`). When you deactivate the workflow, it deletes that webhook.

Every delivery carries Standard Webhooks headers. With **Verify Signature** on (the default), the node checks the HMAC-SHA256 signature using the signing secret ChatDesq returned when the webhook was created, rejects deliveries older than 5 minutes, and answers 401 to anything that fails. The key needs the `webhooks:manage` scope. The n8n instance must be reachable from the internet at its webhook URL.

## Compliance notes

- Send messages only to people who have opted in to hear from you on WhatsApp. Keep a record of the consent.
- Free-form text (Send Text) works only within 24 hours of the customer's last message to you. Outside that window, use Send Template with an approved template. Marketing, utility and authentication templates are billed and reviewed by Meta according to their category.
- Do not use these nodes for unsolicited or bulk promotional sending.
- You are responsible for your own compliance with WhatsApp's Business Messaging Policy and applicable law.

## Development

```
npm install
npm run build
npm run lint
npm run dev     # runs n8n locally with the nodes loaded
```

Releases are published from GitHub Actions with npm provenance (`.github/workflows/publish.yml`), triggered by pushing a version tag. The package has no runtime dependencies.

## Licence

MIT. Copyright Apporio Infolabs Pvt Ltd.
