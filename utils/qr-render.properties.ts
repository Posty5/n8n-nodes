/**
 * The QR Code node's *Render*, *Check Scannability* and *List Templates*
 * parameters (the QR Code ID field is the node's own, shown for Render too).
 * Read by `qr-render.helpers.ts`.
 */

import type { INodeProperties } from 'n8n-workflow';
import { QR_RENDER } from './constants';

const SHOW_ON_RENDER = { show: { operation: ['render'] } };
const SHOW_ON_CHECK = { show: { operation: ['checkScannability'] } };
const SHOW_ON_LIST_TEMPLATES = { show: { operation: ['listTemplates'] } };

export const QR_RENDER_PROPERTIES: INodeProperties[] = [
	// Check Scannability: which saved design to check
	{
		displayName: 'Source',
		name: 'scannabilitySource',
		type: 'options',
		noDataExpression: true,
		displayOptions: SHOW_ON_CHECK,
		options: [
			{ name: 'QR Code', value: 'qrCode', description: 'A saved QR code, as it renders (its template wins)' },
			{ name: 'Template', value: 'template', description: 'One of your templates, or a public one' },
		],
		default: 'qrCode',
	},
	{
		displayName: 'QR Code ID',
		name: 'qrCodeId',
		type: 'string',
		required: true,
		displayOptions: { show: { operation: ['checkScannability'], scannabilitySource: ['qrCode'] } },
		default: '',
		description: 'The ID of the QR code',
	},
	{
		displayName: 'Template Name or ID',
		name: 'scannabilityTemplateId',
		type: 'options',
		required: true,
		typeOptions: { loadOptionsMethod: 'getQrTemplates' },
		displayOptions: { show: { operation: ['checkScannability'], scannabilitySource: ['template'] } },
		default: '',
		description:
			'The template to check. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Sample Text',
		name: 'sampleText',
		type: 'string',
		displayOptions: { show: { operation: ['checkScannability'], scannabilitySource: ['template'] } },
		default: '',
		description: 'The content to check the template with. Empty uses a representative Posty5 QR URL.',
	},

	// Render: the file
	{
		displayName: 'Format',
		name: 'renderFormat',
		type: 'options',
		displayOptions: SHOW_ON_RENDER,
		options: [
			{ name: 'PNG', value: 'png', description: 'Raster image (every plan, up to 2048 px)' },
			{ name: 'SVG', value: 'svg', description: 'Vector image (paid plans)' },
			{ name: 'PDF', value: 'pdf', description: 'Print-ready PDF at the preset size (paid plans)' },
		],
		default: QR_RENDER.DEFAULT_FORMAT,
	},

	// Render and Check Scannability: the print size
	{
		displayName: 'Print Preset Name or ID',
		name: 'presetId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getQrPrintPresets' },
		displayOptions: { show: { operation: ['render', 'checkScannability'] } },
		default: '',
		description:
			'Print size. On Render a preset, a DPI, SVG, PDF or a PNG over 2048 px need a paid plan; PDF with no preset prints at Flyer 5cm. On Check Scannability a preset adds the module size in mm. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Custom Width (Mm)',
		name: 'customMm',
		type: 'number',
		displayOptions: { show: { operation: ['render', 'checkScannability'], presetId: [QR_RENDER.CUSTOM_PRESET_ID] } },
		typeOptions: { minValue: QR_RENDER.CUSTOM_MM_MIN, maxValue: QR_RENDER.CUSTOM_MM_MAX },
		default: QR_RENDER.DEFAULT_CUSTOM_MM,
		description: 'Printed width of the QR code for the Custom preset',
	},
	{
		displayName: 'DPI',
		name: 'dpi',
		type: 'options',
		displayOptions: { show: { operation: ['render'], renderFormat: ['png'] }, hide: { presetId: [''] } },
		options: QR_RENDER.DPI_VALUES.map((dpi) => ({ name: String(dpi), value: dpi })),
		default: QR_RENDER.DEFAULT_DPI,
		description: 'PNG resolution at the print preset',
	},
	{
		displayName: 'Size (Px)',
		name: 'sizePx',
		type: 'number',
		displayOptions: { show: { operation: ['render'], renderFormat: ['png', 'svg'], presetId: [''] } },
		typeOptions: { minValue: QR_RENDER.SIZE_PX_MIN, maxValue: QR_RENDER.SIZE_PX_MAX },
		default: QR_RENDER.DEFAULT_SIZE_PX,
		description: 'Width in pixels when no print preset is chosen. Over 2048 needs a paid plan.',
	},
	{
		displayName: 'Put Output File in Field',
		name: 'renderBinaryProperty',
		type: 'string',
		required: true,
		displayOptions: SHOW_ON_RENDER,
		default: QR_RENDER.DEFAULT_BINARY_PROPERTY,
		hint: 'The name of the output binary field to put the file in',
	},

	// List Templates
	{
		displayName: 'Scope',
		name: 'templateScope',
		type: 'options',
		displayOptions: SHOW_ON_LIST_TEMPLATES,
		options: [
			{ name: 'My Templates', value: 'mine', description: 'Templates you created' },
			{ name: 'Public Templates', value: 'public', description: "Posty5's public templates (any is a valid Template ID)" },
		],
		default: 'mine',
	},
	{
		displayName: 'Search',
		name: 'templateSearch',
		type: 'string',
		displayOptions: SHOW_ON_LIST_TEMPLATES,
		default: '',
		description: 'Only templates whose name contains this text',
	},
	{
		displayName: 'Limit',
		name: 'templateLimit',
		type: 'number',
		displayOptions: SHOW_ON_LIST_TEMPLATES,
		typeOptions: { minValue: 1, maxValue: QR_RENDER.LIST_TEMPLATES_MAX_LIMIT },
		default: QR_RENDER.LIST_TEMPLATES_DEFAULT_LIMIT,
		description: 'Max number of results to return',
	},
];
