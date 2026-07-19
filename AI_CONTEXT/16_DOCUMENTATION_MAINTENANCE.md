# 16 - Documentation Maintenance

Update AI context in the same task as durable code changes.

| Change | Required updates |
| --- | --- |
| Module/owner | 04_MODULES.md, MODULE_INDEX.json, FILE_INDEX.json, 14_AI_TASK_ROUTING.md |
| Export/public API | 05_API_SURFACE.md, ROUTE_INDEX.json, FEATURE_INDEX.json |
| Feature | 01_PROJECT_OVERVIEW.md, FEATURE_INDEX.json, owning module docs |
| State/data contract | 07_DATA_STATE.md, module/feature indexes, tests |
| Workflow/build | 02_ARCHITECTURE.md, 08_WORKFLOWS.md, 11_LOCAL_DEVELOPMENT.md |
| Integration | 09_EXTERNAL_INTEGRATIONS.md, INTEGRATION_INDEX.json, ENV_INDEX.json |
| Config name | 10_ENV_CONFIG.md, ENV_INDEX.json |
| Pattern/decision | 17_PATTERNS.md, PATTERN_INDEX.json, 18_DECISIONS.md |
| Risk/security | 06_AUTH_SECURITY.md, 15_RISKY_AREAS.md |

Validate JSON, links, and concrete indexed paths before completion. Use exact project-relative paths and names only for secrets.
