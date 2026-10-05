# 05 - Public API Surface

| Public surface | Behavior | Source |
| --- | --- | --- |
| `posty5Api` | Credential with apiKey; authenticates using X-API-Key. | `credentials/Posty5Api.credentials.ts` |
| `posty5ShortLink` | create/delete/get/list/update. Template dropdown (`methods.loadOptions.getQrTemplates`) required on create, optional on update. Update is fetch-then-put (GET, then PUT with `baseUrl`, never `customLandingId`). S13 fields: Landing Page, Page Title/Description, Android/iOS URL, Tag, Reference ID. List: Search = name, Destination URL Contains, Landing Page Enabled. | `nodes/Posty5ShortLink/Posty5ShortLink.node.ts` |
| `posty5QrCode` | create/delete/get/list/update across seven QR types. Sends `qrCodeTarget: { type, <type>: {...} }` and `options: {}` (no `options.text`, the server builds it); same Template dropdown; update is fetch-then-put. | `nodes/Posty5QrCode/Posty5QrCode.node.ts` |
| `posty5HtmlHosting` | file/GitHub create/update, get/list/delete, cache/forms. | `nodes/Posty5HtmlHosting/Posty5HtmlHosting.node.ts` |
| `posty5FormSubmission` | get/get-adjacent/change-status/list. | `nodes/Posty5FormSubmission/Posty5FormSubmission.node.ts` |
| `posty5SocialPublisherWorkspace` | get/list/get-for-new-post. | `nodes/Posty5SocialPublisherWorkspace/Posty5SocialPublisherWorkspace.node.ts` |
| `posty5SocialPublisherPost` | publish video/image, status, list, defaults. | `nodes/Posty5SocialPublisherPost/Posty5SocialPublisherPost.node.ts` |
| `posty5Store` | dropshipping: supplier, supplierProduct, productLink, supplierOrder, fulfilmentGroup, order resources (21 operations). No trigger. | `nodes/Posty5Store/Posty5Store.node.ts` |

This is a compatibility surface. Treat exported names, operations, parameter values, types, and behavior as semver-sensitive.

Machine-readable routing metadata lives in [ROUTE_INDEX.json](ROUTE_INDEX.json).
