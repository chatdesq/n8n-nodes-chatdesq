import type {
	IExecuteSingleFunctions,
	IN8nHttpFullResponse,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

/**
 * ChatDesq list endpoints wrap results in a `data` array. Turn that into one n8n item per
 * record; for single records unwrap `data` if present; otherwise pass the body through.
 */
export async function unwrapData(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	const body = response.body as unknown;
	if (body && typeof body === 'object' && 'data' in (body as Record<string, unknown>)) {
		const data = (body as { data: unknown }).data;
		if (Array.isArray(data)) {
			return data.map((json) => ({ json: json as INodeExecutionData['json'] }));
		}
		if (data && typeof data === 'object') {
			return [{ json: data as INodeExecutionData['json'] }];
		}
	}
	if (Array.isArray(body)) {
		return body.map((json) => ({ json: json as INodeExecutionData['json'] }));
	}
	return items;
}

export const postReceiveUnwrap = [unwrapData];

/** Limit and Page fields shared by the paged list operations. */
export function paging(
	show: { resource: string[]; operation: string[] },
): INodeProperties[] {
	return [
		{
			displayName: 'Limit',
			name: 'limit',
			type: 'number',
			default: 50,
			typeOptions: { minValue: 1, maxValue: 100 },
			description: 'Max number of results to return',
			displayOptions: { show },
			routing: { send: { type: 'query', property: 'limit' } },
		},
		{
			displayName: 'Page',
			name: 'page',
			type: 'number',
			default: 1,
			typeOptions: { minValue: 1 },
			description: 'Page number to fetch, starting at 1',
			displayOptions: { show },
			routing: { send: { type: 'query', property: 'page' } },
		},
	];
}
