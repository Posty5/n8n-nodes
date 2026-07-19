# 05 - Public API Surface

| Public surface | Behavior | Source |
| --- | --- | --- |
| `posty5Api` | Credential with apiKey; authenticates using X-API-Key. | `credentials/Posty5Api.credentials.ts` |
| `posty5ShortLink` | create/delete/get/list/update. | `nodes/Posty5ShortLink/Posty5ShortLink.node.ts` |
| `posty5QrCode` | create/delete/get/list/update across seven QR types. | `nodes/Posty5QrCode/Posty5QrCode.node.ts` |
| `posty5HtmlHosting` | file/GitHub create/update, get/list/delete, cache/forms. | `nodes/Posty5HtmlHosting/Posty5HtmlHosting.node.ts` |
| `posty5FormSubmission` | get/get-adjacent/change-status/list. | `nodes/Posty5FormSubmission/Posty5FormSubmission.node.ts` |
| `posty5SocialPublisherWorkspace` | get/list/get-for-new-post. | `nodes/Posty5SocialPublisherWorkspace/Posty5SocialPublisherWorkspace.node.ts` |
| `posty5SocialPublisherPost` | publish video/image, status, list, defaults. | `nodes/Posty5SocialPublisherPost/Posty5SocialPublisherPost.node.ts` |

This is a compatibility surface. Treat exported names, operations, parameter values, types, and behavior as semver-sensitive.

Machine-readable routing metadata lives in [ROUTE_INDEX.json](ROUTE_INDEX.json).
