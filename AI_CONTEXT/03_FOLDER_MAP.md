# 03 - Folder Map

## Maintained source

| Path | Purpose |
| --- | --- |
| `credentials` | n8n credential declarations. |
| `nodes` | Six node implementations. |
| `utils` | Posty5 HTTP and upload helpers/constants. |
| `types` | Shared request/response/task types. |
| `__tests__` | Jest node tests. |
| `__mocks__` | n8n-workflow test mock. |

## Root entrypoints

| Role | Path |
| --- | --- |
| Package registry | `package.json` |
| Credential type | `credentials/Posty5Api.credentials.ts` |
| API helper | `utils/api.helpers.ts` |
| Constants | `utils/constants.ts` |
| Nodes | `nodes` |
| Tests | `__tests__` |

## Generated/local artifacts

Do not edit or index dependency folders, build output, coverage, caches, archives, logs, IDE state, or nested Git metadata. Common examples are `node_modules`, `dist`, `coverage`, `bin`, `obj`, `.angular`, `.astro`, `.vs`, package archives, and test/build logs. If output is wrong, change its source and rebuild.
