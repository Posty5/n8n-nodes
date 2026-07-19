# 04 - Modules and Ownership

| Area | Purpose | Primary path |
| --- | --- | --- |
| `credential` | posty5Api credential injects X-API-Key and tests connectivity. | `credentials/Posty5Api.credentials.ts` |
| `short-link` | Create, get, list, update, and delete short links. | `nodes/Posty5ShortLink/Posty5ShortLink.node.ts` |
| `qr-code` | CRUD for URL, text, email, WiFi, call, SMS, and geolocation QR codes. | `nodes/Posty5QrCode/Posty5QrCode.node.ts` |
| `html-hosting` | Create/update from file or GitHub, list/get/delete, cache/forms operations. | `nodes/Posty5HtmlHosting/Posty5HtmlHosting.node.ts` |
| `form-submission` | Get, adjacent, list, and status-changing operations. | `nodes/Posty5FormSubmission/Posty5FormSubmission.node.ts` |
| `social-workspace` | Get/list/get-for-new-post workspace operations. | `nodes/Posty5SocialPublisherWorkspace/Posty5SocialPublisherWorkspace.node.ts` |
| `social-post` | Publish video/image, inspect status/list/default settings. | `nodes/Posty5SocialPublisherPost/Posty5SocialPublisherPost.node.ts` |
| `api-utils` | HTTP envelope handling, pagination, createdFrom tagging, and signed uploads. | `utils/api.helpers.ts` |

## Editing rule

Start changes in the owning module. Move code to shared/core only after more than one feature genuinely owns the behavior. Update this file and [MODULE_INDEX.json](MODULE_INDEX.json) when ownership changes.
