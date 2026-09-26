import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { API_ENDPOINTS, STORE_SUPPLIER_PAGE_SIZES } from '../../utils/constants';
import {
	buildGroupActionEndpoint,
	buildSupplierOrderActionEndpoint,
	splitOrderParts,
	storeGet,
	storeSupplierPost,
} from '../../utils/store.helpers';
import type { IStoreOrderWithParts } from '../../types/store.types';
import { fulfilmentGroupFields, fulfilmentGroupOperations } from './descriptions/fulfilment-group.description';
import { orderFields, orderOperations } from './descriptions/order.description';
import { productLinkFields, productLinkOperations } from './descriptions/product-link.description';
import { supplierFields, supplierOperations } from './descriptions/supplier.description';
import { supplierOrderFields, supplierOrderOperations } from './descriptions/supplier-order.description';
import { supplierProductFields, supplierProductOperations } from './descriptions/supplier-product.description';

/**
 * Posty5 Store — dropshipping workflows over `/api/store-suppliers` and the
 * order parts on `/api/store-orders`.
 *
 * No trigger: the api pushes nothing to merchants, so a trigger would poll —
 * which Schedule Trigger + Supplier Order → Get Many already does. Connecting and
 * configuring suppliers stays in the store's control panel: a supplier
 * credential in a node parameter would sit in plain text in the workflow JSON.
 */
export class Posty5Store implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Posty5 Store',
		name: 'posty5Store',
		icon: 'file:posty5.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Dropshipping with a Posty5 store: suppliers, imports, supplier orders and order parts',
		defaults: {
			name: 'Posty5 Store',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'posty5Api',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Fulfilment Group', value: 'fulfilmentGroup' },
					{ name: 'Order', value: 'order' },
					{ name: 'Product Link', value: 'productLink' },
					{ name: 'Supplier', value: 'supplier' },
					{ name: 'Supplier Order', value: 'supplierOrder' },
					{ name: 'Supplier Product', value: 'supplierProduct' },
				],
				default: 'supplierOrder',
			},
			fulfilmentGroupOperations,
			orderOperations,
			productLinkOperations,
			supplierOperations,
			supplierOrderOperations,
			supplierProductOperations,
			{
				displayName: 'Store ID',
				name: 'storeId',
				type: 'string',
				required: true,
				default: '',
				description: 'The store every operation acts on',
			},
			...fulfilmentGroupFields,
			...orderFields,
			...productLinkFields,
			...supplierFields,
			...supplierOrderFields,
			...supplierProductFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		const credentials = await this.getCredentials('posty5Api');
		const apiKey = credentials.apiKey as string;
		const suppliers = API_ENDPOINTS.STORE_SUPPLIERS;

		for (let i = 0; i < items.length; i++) {
			try {
				const storeId = this.getNodeParameter('storeId', i) as string;
				let responseData: IDataObject | IDataObject[] = {};

				if (resource === 'supplier') {
					if (operation === 'getCatalogue') {
						responseData = (await storeGet.call(this, apiKey, `${suppliers}/${storeId}/catalogue`))?.items || [];
					} else if (operation === 'getMany') {
						responseData = (await storeGet.call(this, apiKey, `${suppliers}/${storeId}`))?.items || [];
					} else if (operation === 'test') {
						const integrationId = this.getNodeParameter('integrationId', i) as string;
						responseData = await storeSupplierPost.call(this, apiKey, `${suppliers}/${storeId}/${integrationId}/test`);
					} else if (operation === 'getBalance') {
						const integrationId = this.getNodeParameter('integrationId', i) as string;
						responseData = await storeGet.call(this, apiKey, `${suppliers}/${storeId}/${integrationId}/balance`);
					}
				} else if (resource === 'supplierProduct') {
					if (operation === 'getImportStatus') {
						const jobId = this.getNodeParameter('jobId', i) as string;
						responseData = await storeGet.call(this, apiKey, `${suppliers}/${storeId}/imports/${encodeURIComponent(jobId)}`);
					} else {
						const integrationId = this.getNodeParameter('integrationId', i) as string;
						const base = `${suppliers}/${storeId}/${integrationId}`;
						if (operation === 'getMany') {
							const filters = this.getNodeParameter('filters', i, {}) as Record<string, unknown>;
							const page = this.getNodeParameter('page', i, 1) as number;
							const limit = this.getNodeParameter('limit', i, STORE_SUPPLIER_PAGE_SIZES.CATALOGUE_MAX) as number;
							responseData = (await storeGet.call(this, apiKey, `${base}/products`, { ...filters, page, pageSize: limit }))?.items || [];
						} else if (operation === 'get') {
							const supplierProductId = this.getNodeParameter('supplierProductId', i) as string;
							responseData = await storeGet.call(this, apiKey, `${base}/products/${encodeURIComponent(supplierProductId)}`);
						} else if (operation === 'resolveUrl') {
							const url = this.getNodeParameter('url', i) as string;
							responseData = await storeSupplierPost.call(this, apiKey, `${base}/products/resolve-url`, { url });
						} else if (operation === 'previewImport' || operation === 'import') {
							const ids = (this.getNodeParameter('supplierProductIds', i) as string)
								.split(',')
								.map((id) => id.trim())
								.filter(Boolean);
							const options = this.getNodeParameter('importOptions', i, {}) as {
								status?: string;
								tagNames?: string;
								allowDuplicate?: boolean;
							};
							const tagNames = (options.tagNames || '').split(',').map((tag) => tag.trim()).filter(Boolean);
							const body: Record<string, unknown> = {
								items: ids.map((supplierProductId) => ({ supplierProductId })),
								...(options.status || tagNames.length
									? { defaults: { ...(options.status ? { status: options.status } : {}), ...(tagNames.length ? { tagNames } : {}) } }
									: {}),
								...(operation === 'import' && options.allowDuplicate ? { allowDuplicate: true } : {}),
							};
							responseData = await storeSupplierPost.call(this, apiKey, `${base}/${operation === 'import' ? 'import' : 'import/preview'}`, body);
						}
					}
				} else if (resource === 'productLink') {
					if (operation === 'getMany') {
						const filters = this.getNodeParameter('filters', i, {}) as Record<string, unknown>;
						responseData = (await storeGet.call(this, apiKey, `${suppliers}/${storeId}/links`, filters))?.items || [];
					} else if (operation === 'sync') {
						const linkId = this.getNodeParameter('linkId', i) as string;
						responseData = await storeSupplierPost.call(this, apiKey, `${suppliers}/${storeId}/links/${linkId}/sync`);
					}
				} else if (resource === 'supplierOrder') {
					if (operation === 'getMany') {
						const filters = this.getNodeParameter('filters', i, {}) as Record<string, unknown>;
						const page = this.getNodeParameter('page', i, 1) as number;
						const limit = this.getNodeParameter('limit', i, 50) as number;
						responseData = (await storeGet.call(this, apiKey, `${suppliers}/${storeId}/orders`, { ...filters, page, pageSize: limit }))?.items || [];
					} else {
						const supplierOrderId = this.getNodeParameter('supplierOrderId', i) as string;
						if (operation === 'get') {
							responseData = await storeGet.call(this, apiKey, `${suppliers}/${storeId}/orders/${supplierOrderId}`);
						} else if (operation === 'retry') {
							const acceptCost = this.getNodeParameter('acceptCost', i, false) as boolean;
							responseData = await storeSupplierPost.call(
								this,
								apiKey,
								buildSupplierOrderActionEndpoint(storeId, supplierOrderId, 'retry'),
								acceptCost ? { acceptCost: true } : {},
							);
						} else if (operation === 'pay' || operation === 'cancel') {
							responseData = await storeSupplierPost.call(this, apiKey, buildSupplierOrderActionEndpoint(storeId, supplierOrderId, operation));
						}
					}
				} else if (resource === 'fulfilmentGroup') {
					const orderId = this.getNodeParameter('orderId', i) as string;
					const groupKey = this.getNodeParameter('groupKey', i) as string;
					if (operation === 'submit') {
						const payNow = this.getNodeParameter('payNow', i, false) as boolean;
						responseData = await storeSupplierPost.call(
							this,
							apiKey,
							buildGroupActionEndpoint(storeId, orderId, groupKey, 'submit'),
							payNow ? { payNow: true } : {},
						);
					} else if (operation === 'fulfilManually') {
						responseData = await storeSupplierPost.call(this, apiKey, buildGroupActionEndpoint(storeId, orderId, groupKey, 'fulfil-manually'));
					}
				} else if (resource === 'order') {
					if (operation === 'get') {
						const orderId = this.getNodeParameter('orderId', i) as string;
						const splitParts = this.getNodeParameter('splitParts', i, false) as boolean;
						const order = (await storeGet.call(this, apiKey, `${API_ENDPOINTS.STORE_ORDERS}/${storeId}/${orderId}`)) as IStoreOrderWithParts;
						responseData = (splitParts ? splitOrderParts(order) : order) as IDataObject | IDataObject[];
					} else if (operation === 'getMany') {
						const filters = this.getNodeParameter('filters', i, {}) as Record<string, unknown>;
						const limit = this.getNodeParameter('limit', i, 50) as number;
						const result = await storeGet.call(this, apiKey, `${API_ENDPOINTS.STORE_ORDERS}/${storeId}`, { ...filters, pageSize: limit });
						const rows: IDataObject[] = result?.items || [];
						const nextCursor = result?.pagination?.nextCursor;
						// The cursor rides on the last row, so the next run can continue from it.
						if (rows.length && nextCursor) rows[rows.length - 1] = { ...rows[rows.length - 1], nextCursor };
						responseData = rows;
					}
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
