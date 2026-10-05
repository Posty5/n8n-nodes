/**
 * The Template field of the Short Link and QR Code nodes: the dropdown's
 * options, and which template a run sends.
 *
 * The Posty5 API requires `templateId` on every create and update made with an
 * API key (which is every n8n call), so the node never sends a write without one.
 */

import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { makeApiRequest } from './api.helpers';
import { API_ENDPOINTS, LINK_TOOL_MESSAGES, QR_TEMPLATE_LOOKUP } from './constants';
import { firstText } from './link-tool.helpers';
import type { ILinkToolAdditionalFields, ILinkToolStoredFields } from '../types/common';
import type { IQRCodeTemplateLookupItem, IQRCodeTemplateLookupPage } from '../types/qr-code.types';

/**
 * `loadOptions` for the Template field: the caller's own templates first, then
 * the public ones. A template in both lists appears once, as the caller's.
 * A bad credential rejects the call, so n8n shows the error in the dropdown.
 */
export async function getQrTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const credentials = await this.getCredentials('posty5Api');
	const apiKey = credentials.apiKey as string;
	const qs = { pageSize: QR_TEMPLATE_LOOKUP.PAGE_SIZE };

	const [userPage, publicPage] = (await Promise.all([
		makeApiRequest.call(this, apiKey, {
			method: 'GET',
			endpoint: `${API_ENDPOINTS.QR_CODE_TEMPLATE}${QR_TEMPLATE_LOOKUP.USER_PATH}`,
			qs,
		}),
		makeApiRequest.call(this, apiKey, {
			method: 'GET',
			endpoint: `${API_ENDPOINTS.QR_CODE_TEMPLATE}${QR_TEMPLATE_LOOKUP.PUBLIC_PATH}`,
			qs,
		}),
	])) as Array<IQRCodeTemplateLookupPage | undefined>;

	return mergeQrTemplateOptions(userPage?.items || [], publicPage?.items || []);
}

/** The dropdown options for two lookup pages: the caller's templates, then the public ones not already listed. */
export function mergeQrTemplateOptions(
	userTemplates: IQRCodeTemplateLookupItem[],
	publicTemplates: IQRCodeTemplateLookupItem[],
): INodePropertyOptions[] {
	const seen = new Set<string>();
	const options: INodePropertyOptions[] = [];
	const lists: Array<[IQRCodeTemplateLookupItem[], string]> = [
		[userTemplates, QR_TEMPLATE_LOOKUP.USER_LABEL],
		[publicTemplates, QR_TEMPLATE_LOOKUP.PUBLIC_LABEL],
	];

	for (const [templates, description] of lists) {
		for (const template of templates) {
			const id = firstText(template?._id);
			if (!id || seen.has(id)) continue;
			seen.add(id);
			options.push({ name: firstText(template.name) || id, value: id, description });
		}
	}
	return options;
}

/**
 * The template a write sends: the Template field; else the deprecated
 * Additional Fields value that workflows saved before 4.6.0 carry; else, on
 * Update, the record's stored template. Throws when there is none, before any
 * request is made.
 */
export function requireTemplateId(
	selected: unknown,
	fields: ILinkToolAdditionalFields,
	stored?: ILinkToolStoredFields,
): string {
	const templateId = firstText(selected, fields.templateId, stored?.templateId);
	if (!templateId) throw new Error(LINK_TOOL_MESSAGES.TEMPLATE_REQUIRED);
	return templateId;
}
