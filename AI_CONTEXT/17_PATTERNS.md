# 17 - Established Patterns

| Pattern | Rule | Example |
| --- | --- | --- |
| Declarative node description | description.properties defines operations and conditional fields. | `nodes/Posty5ShortLink/Posty5ShortLink.node.ts` |
| Shared credential | All nodes request posty5Api. | `credentials/Posty5Api.credentials.ts` |
| Shared HTTP wrapper | Use n8n httpRequest, unwrap result, and enhance errors. | `utils/api.helpers.ts` |
| Colocated node test | Each registered node has a Jest test. | `__tests__/Posty5ShortLink.node.test.ts` |
| Multi-resource node | A node with more than one resource keeps each resource's `operation` property and fields in `nodes/<Node>/descriptions/<resource>.description.ts`; the node file only lists them and runs `execute()`. | `nodes/Posty5Store` |

Patterns describe current source, not aspirational refactors. Add a pattern only when multiple maintained examples or a clear architectural boundary support it.
