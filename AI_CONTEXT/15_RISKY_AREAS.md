# 15 - Risky Areas

| Area | Path | Why risky |
| --- | --- | --- |
| Saved-workflow compatibility | `nodes` | Renaming node names, operations, or parameter values breaks existing workflows. |
| Credential compatibility | `credentials/Posty5Api.credentials.ts` | Renaming posty5Api or apiKey breaks stored credentials. |
| Shared request helper | `utils/api.helpers.ts` | Changes affect every node and may expose headers/errors. |
| Binary upload | `utils/api.helpers.ts` | Content type, signed URL, and large buffers are sensitive. |
| Package registry | `package.json` | Only paths listed in n8n are loaded. |
| Generated archive | `posty5-n8n-nodes-posty5-4.1.0.tgz` | Never edit or index as source. |

Before editing: trace callers/consumers, identify compatibility and security impact, take the narrowest change, and run both focused and structural checks.
