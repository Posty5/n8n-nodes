// Mock n8n-workflow module for testing

export interface INodeExecutionData {
	json: any;
	binary?: any;
	pairedItem?: any;
}

export interface IExecuteFunctions {
	getInputData(): INodeExecutionData[];
	getNodeParameter(parameterName: string, itemIndex: number, fallbackValue?: any): any;
	getCredentials(type: string): Promise<any>;
	getNode(): any;
	getTimezone(): string;
	helpers: {
		httpRequest(options: any): Promise<any>;
		getBinaryDataBuffer(itemIndex: number, propertyName: string): Promise<Buffer>;
		constructExecutionMetaData(
			inputData: INodeExecutionData[],
			options: any,
		): INodeExecutionData[];
		returnJsonArray(data: any): INodeExecutionData[];
	};
	continueOnFail(): boolean;
}

export interface INodeType {
	description: INodeTypeDescription;
	execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}

export interface INodeTypeDescription {
	displayName: string;
	name: string;
	icon: string;
	group: string[];
	version: number;
	subtitle?: string;
	description: string;
	defaults: any;
	inputs: string[];
	outputs: string[];
	credentials: any[];
	properties: any[];
}

export interface IHttpRequestOptions {
	method: string;
	url: string;
	headers?: any;
	body?: any;
	qs?: any;
	json?: boolean;
	returnFullResponse?: boolean;
}

export type JsonObject = Record<string, any>;

/** Stand-in for n8n's `NodeOperationError`: the message, the node and the item it failed on. */
export class NodeOperationError extends Error {
	node: any;
	context: { itemIndex?: number };

	constructor(node: any, error: Error | string, options: { itemIndex?: number } = {}) {
		super(typeof error === 'string' ? error : error.message);
		this.name = 'NodeOperationError';
		this.node = node;
		this.context = { itemIndex: options.itemIndex };
	}
}

/** Stand-in for n8n's `NodeApiError`: like the real one, an explicit `message` / `httpCode` wins. */
export class NodeApiError extends Error {
	node: any;
	httpCode: string | null;
	context: { itemIndex?: number };

	constructor(
		node: any,
		errorResponse: JsonObject,
		options: { message?: string; httpCode?: string; itemIndex?: number } = {},
	) {
		super(options.message ?? errorResponse.message);
		this.name = 'NodeApiError';
		this.node = node;
		this.httpCode = options.httpCode ?? errorResponse.httpCode ?? null;
		this.context = { itemIndex: options.itemIndex };
	}
}
