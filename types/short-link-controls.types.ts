/**
 * Short link controls (access, routing, variants, UTM, pixels, tags, campaign,
 * health) as the node reads them from its parameters and sends them to the API.
 */

import type { LINK_CAMPAIGN_COLORS, LINK_PIXEL_PROVIDERS } from '../utils/constants';

export type LinkPixelProviderType = (typeof LINK_PIXEL_PROVIDERS)[number];
export type LinkCampaignColorType = (typeof LINK_CAMPAIGN_COLORS)[number];

/** The control fields of the Create / Update Additional Fields and of Set Rules' Rules. */
export interface IShortLinkControlFields {
	tags?: string;
	campaignId?: string;
	activeFrom?: string;
	expiresAt?: string;
	maxVisits?: number;
	fallbackUrl?: string;
	password?: string;
	removePassword?: boolean;
	utm?: { values?: IShortLinkUtm };
	routingRules?: string | unknown[];
	variants?: string | unknown[];
	pixels?: { pixel?: IShortLinkPixel[] };
	pixelsConsentAcknowledged?: boolean;
	healthMonitor?: boolean;
}

export interface IShortLinkUtm {
	source?: string | null;
	medium?: string | null;
	campaign?: string | null;
	term?: string | null;
	content?: string | null;
}

export interface IShortLinkPixel {
	provider: LinkPixelProviderType;
	id: string;
}

export interface IShortLinkAccess {
	activeFrom?: string | null;
	expiresAt?: string | null;
	maxVisits?: number | null;
	fallbackUrl?: string | null;
	password?: string | null;
}

/** The control keys of a create / update body. */
export interface IShortLinkControlBody {
	tags?: string[];
	campaignId?: string | null;
	access?: IShortLinkAccess;
	utm?: IShortLinkUtm | null;
	routing?: unknown[] | null;
	variants?: unknown[] | null;
	pixels?: IShortLinkPixel[] | null;
	pixelsConsentAcknowledged?: boolean;
	health?: { enabled: boolean };
}

/** Campaign operations' fields. */
export interface ILinkCampaignFields {
	description?: string;
	color?: LinkCampaignColorType | '';
	utm?: { values?: IShortLinkUtm };
	archived?: boolean;
}

export interface ILinkCampaignBody {
	name?: string;
	description?: string | null;
	color?: LinkCampaignColorType | null;
	utm?: IShortLinkUtm | null;
	archived?: boolean;
}

export interface ILinkCampaignLookupItem {
	_id: string;
	name: string;
	archived?: boolean;
}
