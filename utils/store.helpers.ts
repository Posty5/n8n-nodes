/**
 * Helpers for the Posty5 Store node (dropshipping).
 */

import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { makeApiRequest } from './api.helpers';
import { API_ENDPOINTS } from './constants';
import type {
	FulfilmentGroupAction,
	IOrderPartItem,
	IStoreCursorPage,
	IStoreOrderWithParts,
	SupplierOrderAction,
} from '../types/store.types';

/**
 * The route for an action on one part of an order. The part key looks like
 * `supplier:<integrationId>`, so it is encoded before it enters the path.
 */
export function buildGroupActionEndpoint(
	storeId: string,
	orderId: string,
	groupKey: string,
	action: FulfilmentGroupAction,
): string {
	return `${API_ENDPOINTS.STORE_SUPPLIERS}/${storeId}/orders/${orderId}/groups/${encodeURIComponent(groupKey)}/${action}`;
}

/** The route for an action on one supplier order. */
export function buildSupplierOrderActionEndpoint(
	storeId: string,
	supplierOrderId: string,
	action: SupplierOrderAction,
): string {
	return `${API_ENDPOINTS.STORE_SUPPLIERS}/${storeId}/orders/${supplierOrderId}/${action}`;
}

/**
 * One item per part of an order, each carrying the order's id and number and
 * the supplier order behind it (newest attempt), or null for the store's own part.
 * An order from before parts existed still has one merchant part (the api adds it).
 */
export function splitOrderParts(order: IStoreOrderWithParts): IOrderPartItem[] {
	const supplierOrders = order.supplierOrders || [];
	return (order.fulfilmentGroups || []).map((group) => ({
		...group,
		orderId: order._id,
		orderNumber: order.orderNumber,
		supplierOrder: supplierOrders.find((row) => row.fulfilmentGroupKey === group.key) || null,
	}));
}

/**
 * A POST to the `/api/store-suppliers` routes, without the `createdFrom` stamp
 * their schemas never declared. Call it with the node's context:
 * `storeSupplierPost.call(this, apiKey, endpoint, body)`.
 */
export function storeSupplierPost(
	this: IExecuteFunctions,
	apiKey: string,
	endpoint: string,
	body: Record<string, unknown> = {},
): ReturnType<typeof makeApiRequest> {
	return makeApiRequest.call(this, apiKey, { method: 'POST', endpoint, body, stampCreatedFrom: false });
}

/** A GET for the store node, with empty filter values dropped from the query. */
export function storeGet(
	this: IExecuteFunctions,
	apiKey: string,
	endpoint: string,
	qs?: Record<string, unknown>,
): ReturnType<typeof makeApiRequest> {
	return makeApiRequest.call(this, apiKey, { method: 'GET', endpoint, ...(qs ? { qs: stripEmpty(qs) } : {}) });
}

/**
 * One page of a cursor-paged store list as output rows. The page's
 * `nextCursor` rides on the last row, so the next run can pass it back as the
 * Cursor filter and continue from there.
 */
export function rowsWithNextCursor(page: IStoreCursorPage<IDataObject> | undefined): IDataObject[] {
	const rows = [...(page?.items || [])];
	const nextCursor = page?.pagination?.nextCursor;
	if (rows.length && nextCursor) rows[rows.length - 1] = { ...rows[rows.length - 1], nextCursor };
	return rows;
}

/**
 * Every row of a cursor-paged store list (Return All): follows
 * `pagination.nextCursor` until `pagination.hasMore` is false. A cursor in `qs`
 * is the starting point. Stops, too, if the api hands back the cursor it was
 * just sent, so a misbehaving page can never loop forever.
 */
export async function storeGetAllByCursor(
	this: IExecuteFunctions,
	apiKey: string,
	endpoint: string,
	qs: Record<string, unknown>,
	pageSize: number,
): Promise<IDataObject[]> {
	const rows: IDataObject[] = [];
	let cursor = typeof qs.cursor === 'string' && qs.cursor ? qs.cursor : undefined;
	for (;;) {
		const page = (await storeGet.call(this, apiKey, endpoint, { ...qs, cursor, pageSize })) as
			| IStoreCursorPage<IDataObject>
			| undefined;
		rows.push(...(page?.items || []));
		const next = page?.pagination?.hasMore ? page.pagination.nextCursor : undefined;
		if (!next || next === cursor) return rows;
		cursor = next;
	}
}

/** Drop empty filter values so the api sees only what the user chose. */
export function stripEmpty(qs: Record<string, unknown>): Record<string, unknown> {
	return Object.fromEntries(
		Object.entries(qs).filter(([, value]) => value !== undefined && value !== null && value !== ''),
	);
}
