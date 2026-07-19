# 00 - Start Here

> Orientation for AI assistants. Continue with [14_AI_TASK_ROUTING.md](14_AI_TASK_ROUTING.md) for task-specific files.

## What this project does

A published n8n community package that exposes Posty5 short links, QR codes, HTML hosting, form submissions, social workspaces, and social posts as workflow nodes.

## Quick facts

| Fact | Value |
| --- | --- |
| Project | Posty5 n8n Nodes |
| Type | n8n community node package |
| Runtime | Node.js in the n8n execution runtime |
| Package/build system | npm |
| Scope root | n8n-nodes/ |
| Generated context date | 2026-07-19 |

## Main entrypoints

| Role | Path |
| --- | --- |
| Package registry | `package.json` |
| Credential type | `credentials/Posty5Api.credentials.ts` |
| API helper | `utils/api.helpers.ts` |
| Constants | `utils/constants.ts` |
| Nodes | `nodes` |
| Tests | `__tests__` |

## Runtime/control flow

n8n loads node -> reads operation/parameters -> credential -> request helper -> maps result to items.

## How to approach changes

1. Use [14_AI_TASK_ROUTING.md](14_AI_TASK_ROUTING.md) to find the owning area.
2. Read its entry in [04_MODULES.md](04_MODULES.md) and the matching JSON index.
3. Check [15_RISKY_AREAS.md](15_RISKY_AREAS.md).
4. Change maintained source only; do not edit generated artifacts.
5. Run the checks in [11_LOCAL_DEVELOPMENT.md](11_LOCAL_DEVELOPMENT.md).
6. Update context per [16_DOCUMENTATION_MAINTENANCE.md](16_DOCUMENTATION_MAINTENANCE.md).
