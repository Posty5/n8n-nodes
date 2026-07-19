# 09 - External Integrations

| System | Purpose | Owner/config source |
| --- | --- | --- |
| n8n-workflow | Node/credential interfaces and HTTP helpers | `package.json` |
| Posty5 API | All business operations | `utils/api.helpers.ts` |
| Signed object-storage URLs | Direct binary upload for hosting/social operations | `utils/api.helpers.ts` |

## Change rule

When an integration changes, update its owner, configuration names, error/retry behavior, tests, [INTEGRATION_INDEX.json](INTEGRATION_INDEX.json), and risky-area notes. Never document credential values.
