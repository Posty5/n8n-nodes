# 10 - Environment and Configuration

> Names and purposes only. Read actual values only when a task explicitly requires it and never copy them into documentation or output.

| Name | Purpose | Source | Category |
| --- | --- | --- | --- |
| `posty5Api.apiKey` | Secret n8n credential injected as X-API-Key. | `credentials/Posty5Api.credentials.ts` | credential |
| `POSTY5_API_BASE_URL` | Compile-time constant Posty5 API origin. | `utils/constants.ts` | api |
| `createdFrom` | POST requests are tagged as n8n by the shared helper. | `utils/api.helpers.ts` | request |

## Rules

- Keep server secrets out of browser bundles and public package metadata.
- Update all typed variants/contracts when adding a build-time key.
- Update [ENV_INDEX.json](ENV_INDEX.json) with names, purpose, owner, and sensitivity - never values.
