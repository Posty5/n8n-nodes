# 17 - Established Patterns

| Pattern | Rule | Example |
| --- | --- | --- |
| Declarative node description | description.properties defines operations and conditional fields. | `nodes/Posty5ShortLink/Posty5ShortLink.node.ts` |
| Shared credential | All nodes request posty5Api. | `credentials/Posty5Api.credentials.ts` |
| Shared HTTP wrapper | Use n8n httpRequest, unwrap result, and enhance errors. | `utils/api.helpers.ts` |
| Colocated node test | Each registered node has a Jest test. | `__tests__/Posty5ShortLink.node.test.ts` |
| Dynamic options | A dropdown filled from the API uses `typeOptions.loadOptionsMethod`; the method lives in a `utils/` helper and is registered in the node's `methods.loadOptions`. `makeApiRequest` accepts the loadOptions context. | `utils/qr-templates.helpers.ts` (Short Link and QR Code) |
| Fetch-then-put update | An update whose PUT replaces the record GETs it first and sends the stored values back with the user's fields on top. A collection key the user added is the value to store (empty clears where the API allows it). | `nodes/Posty5ShortLink`, `nodes/Posty5QrCode` |
| Shared operation across nodes | An operation two nodes expose identically keeps its properties in one `utils/<name>.properties.ts` array (spread into each node's `properties`) and its execution in one helper; each node keeps only its own ID field and one `execute` branch. | `utils/analytics.properties.ts`, `utils/analytics.helpers.ts` |
| Multi-resource node | A node with more than one resource keeps each resource's `operation` property and fields in `nodes/<Node>/descriptions/<resource>.description.ts`; the node file only lists them and runs `execute()`. | `nodes/Posty5Store` |

Patterns describe current source, not aspirational refactors. Add a pattern only when multiple maintained examples or a clear architectural boundary support it.
