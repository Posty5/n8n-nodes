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
