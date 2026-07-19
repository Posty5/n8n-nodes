# 08 - Workflows

| Workflow | Flow |
| --- | --- |
| Node execution | n8n loads node -> reads operation/parameters -> credential -> request helper -> maps result to items. |
| File upload | Request signed URL/config -> upload binary directly -> finalize Posty5 operation. |
| Build | prebuild removes dist -> tsc compiles registered credentials/nodes -> package.json publishes dist. |
| Test | Jest uses the n8n-workflow mock and node-focused test files. |

For common edit sequences, see [13_CHANGE_PLAYBOOK.md](13_CHANGE_PLAYBOOK.md).
