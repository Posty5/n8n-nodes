/**
 * Store Types for Posty5 N8N Nodes — dropshipping.
 * The names match `@posty5/store`, so a reader of one recognises the other.
 */

export type StoreSupplierOrderStatus =
	| 'queued'
	| 'needsReview'
	| 'submitted'
	| 'confirmed'
	| 'processing'
	| 'shipped'
	| 'delivered'
	| 'cancelled'
	| 'failed';

export type StoreSupplierOrderReviewReason =
	| 'insufficientBalance'
	| 'variantUnavailable'
	| 'destinationUnsupported'
	| 'costAboveLimit'
	| 'costChanged'
	| 'customerPaymentPending'
	| 'customerPaymentNotSettled'
	| 'connectionUnhealthy'
	| 'supplierRefused'
	| 'connectionMissing'
	| 'supplierAlreadyShipped'
	| 'testMode'
	| 'customerCaptureFailed';

export type StoreFulfilmentGroupStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

/** The part actions that address a part (order + part key). */
export type FulfilmentGroupAction = 'submit' | 'fulfil-manually';

/** The actions that address one supplier order by its id. */
export type SupplierOrderAction = 'retry' | 'pay' | 'cancel';

/** One supplier order, as far as the node reads it. */
export interface IStoreSupplierOrder {
	_id: string;
	orderId: string;
	orderNumber?: string;
	fulfilmentGroupKey: string;
	supplierKey: string;
	status: StoreSupplierOrderStatus;
	reviewReason?: StoreSupplierOrderReviewReason | null;
	reviewMessage?: string | null;
	retryable: boolean;
	[key: string]: unknown;
}

/**
 * The pagination block of a cursor-paged store list — the platform's list
 * envelope (`req.end_Searchable`), used by the orders search and the
 * supplier-order queue alike.
 */
export interface IStoreCursorPagination {
	nextCursor?: string | null;
	previousCursor?: string | null;
	hasMore?: boolean;
	totalCount?: number;
	pageSize?: number;
}

/** One page of a cursor-paged store list. */
export interface IStoreCursorPage<T> {
	items?: T[];
	pagination?: IStoreCursorPagination;
}

/** One part of a store order. */
export interface IOrderFulfilmentGroup {
	key: string;
	kind: 'merchant' | 'thirdParty';
	label: string;
	status: StoreFulfilmentGroupStatus;
	supplierOrderId?: string;
	shipment?: { carrierName?: string; trackingNumber?: string; trackingUrl?: string; status?: string };
	[key: string]: unknown;
}

/** A store order as the node reads it for Split Parts. */
export interface IStoreOrderWithParts {
	_id: string;
	orderNumber?: string;
	fulfilmentGroups?: IOrderFulfilmentGroup[];
	supplierOrders?: IStoreSupplierOrder[];
	[key: string]: unknown;
}

/** One output item of Split Parts: the part, with its order and supplier order attached. */
export interface IOrderPartItem extends IOrderFulfilmentGroup {
	orderId: string;
	orderNumber?: string;
	supplierOrder: IStoreSupplierOrder | null;
}
