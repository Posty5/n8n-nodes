import type { INodeProperties, INodeType } from 'n8n-workflow';
import { Posty5HtmlHosting } from '../nodes/Posty5HtmlHosting/Posty5HtmlHosting.node';
import { Posty5QrCode } from '../nodes/Posty5QrCode/Posty5QrCode.node';
import { Posty5ShortLink } from '../nodes/Posty5ShortLink/Posty5ShortLink.node';
import { Posty5SocialPublisherPost } from '../nodes/Posty5SocialPublisherPost/Posty5SocialPublisherPost.node';
import { createdAtRangeQuery } from '../utils/date.helpers';
import { createMockExecuteFunctions, TEST_CONFIG } from './setup';

/**
 * Created From Date / Created To Date on the four list operations
 * (redesign-dashboards SDK-03): sent as `fromDate` / `toDate` when set, the
 * query unchanged when not, and the Social Publisher Post `workspaceId` kept.
 * Offline — `httpRequest` is a jest mock.
 */

interface IListCase {
	label: string;
	node: INodeType;
	/** The node's list parameters, without the date filters. */
	parameters: Record<string, unknown>;
	/** The collection the dates go in. */
	filtersParameter: string;
	/** What the query holds without the dates. */
	baseQuery: Record<string, unknown>;
	path: RegExp;
}

const CASES: IListCase[] = [
	{
		label: 'Short Link › List',
		node: new Posty5ShortLink(),
		parameters: { operation: 'list', returnAll: false, limit: 10 },
		filtersParameter: 'filters',
		baseQuery: { refId: 'R1', page: 1, pageSize: 10 },
		path: /\/api\/short-link$/,
	},
	{
		label: 'QR Code › List',
		node: new Posty5QrCode(),
		parameters: { operation: 'list', returnAll: false, limit: 10 },
		filtersParameter: 'filters',
		baseQuery: { refId: 'R1', page: 1, pageSize: 10 },
		path: /\/api\/qr-code$/,
	},
	{
		label: 'HTML Hosting › List',
		node: new Posty5HtmlHosting(),
		parameters: { operation: 'list', returnAll: false, limit: 10 },
		filtersParameter: 'filters',
		baseQuery: { refId: 'R1', page: 1, pageSize: 10 },
		path: /\/api\/html-hosting$/,
	},
	{
		label: 'Social Publisher Post › List Posts',
		node: new Posty5SocialPublisherPost(),
		parameters: { operation: 'listPosts', listWorkspaceId: 'ws1', returnAll: false, limit: 10 },
		filtersParameter: 'listFilters',
		baseQuery: { workspaceId: 'ws1', page: 1, pageSize: 10 },
		path: /\/api\/social-publisher-post$/,
	},
];

/** The list call's filters: Reference ID where the node has it, plus `dates`. */
function filtersFor(testCase: IListCase, dates: Record<string, unknown>): Record<string, unknown> {
	return testCase.filtersParameter === 'filters' ? { refId: 'R1', ...dates } : dates;
}

async function runList(testCase: IListCase, dates: Record<string, unknown>) {
	const mock = createMockExecuteFunctions(
		{ ...testCase.parameters, [testCase.filtersParameter]: filtersFor(testCase, dates) },
		[{ json: {} }],
		{ apiKey: TEST_CONFIG.apiKey },
		{ items: [] },
	);
	await testCase.node.execute!.call(mock);
	const request = (mock.helpers.httpRequest as jest.Mock).mock.calls[0][0];
	return { url: request.url as string, qs: request.qs as Record<string, unknown> };
}

describe('list operations — created-at date filters', () => {
	it.each(CASES)('$label sends fromDate and toDate when both are set', async (testCase) => {
		const { url, qs } = await runList(testCase, { fromDate: '2026-10-01', toDate: '2026-10-07' });
		expect(url).toMatch(testCase.path);
		expect(qs).toEqual({ ...testCase.baseQuery, fromDate: '2026-10-01', toDate: '2026-10-07' });
	});

	it.each(CASES)('$label sends the same query as before when the dates are unset or empty', async (testCase) => {
		expect((await runList(testCase, {})).qs).toEqual(testCase.baseQuery);
		expect((await runList(testCase, { fromDate: '', toDate: '  ' })).qs).toEqual(testCase.baseQuery);
	});

	it.each(CASES)('$label offers Created From Date and Created To Date as optional string filters', (testCase) => {
		const collection = testCase.node.description.properties.find(
			(property) =>
				property.name === testCase.filtersParameter &&
				(property.displayOptions?.show?.operation as string[] | undefined)?.includes(testCase.parameters.operation as string),
		);
		const options = (collection?.options ?? []) as INodeProperties[];
		for (const name of ['fromDate', 'toDate']) {
			const field = options.find((option) => option.name === name);
			expect(field).toMatchObject({ type: 'string', default: '' });
			expect(field?.required).toBeFalsy();
		}
	});
});

describe('createdAtRangeQuery', () => {
	it('sends a dateTime value or an expression date as its day', () => {
		expect(createdAtRangeQuery({ fromDate: '2026-10-01T00:00:00', toDate: '2026-10-07T23:59:59' })).toEqual({
			fromDate: '2026-10-01',
			toDate: '2026-10-07',
		});
	});

	it('sends a lone bound and leaves the pairing to the API', () => {
		expect(createdAtRangeQuery({ fromDate: '2026-10-01' })).toEqual({ fromDate: '2026-10-01' });
	});

	it('sends text that names no day as typed, so the API decides', () => {
		expect(createdAtRangeQuery({ fromDate: ' 01/10/2026 ', toDate: '2026-10-07' })).toEqual({
			fromDate: '01/10/2026',
			toDate: '2026-10-07',
		});
	});

	it('answers an empty query for no filters', () => {
		expect(createdAtRangeQuery(undefined)).toEqual({});
	});
});
