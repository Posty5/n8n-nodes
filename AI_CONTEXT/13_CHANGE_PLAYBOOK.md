# 13 - Change Playbook

## Feature/module change

1. Find the owner in [MODULE_INDEX.json](MODULE_INDEX.json).
2. Read the module source and adjacent types/tests.
3. Preserve the patterns in [17_PATTERNS.md](17_PATTERNS.md).
4. Update module and feature indexes.
5. Run the relevant build/tests.

## Public API/export change

1. Edit the canonical source listed in `05_API_SURFACE.md`.
2. Trace guards/resolvers/callers or exported types/consumers.
3. Preserve compatibility or document the deliberate breaking change.
4. Update `05_API_SURFACE.md`, `ROUTE_INDEX.json`, feature/module indexes, and tests.

## Configuration/integration change

1. Identify every variant and consumer.
2. Keep secret values outside docs and client bundles.
3. Update [09_EXTERNAL_INTEGRATIONS.md](09_EXTERNAL_INTEGRATIONS.md), [10_ENV_CONFIG.md](10_ENV_CONFIG.md), and their indexes.
4. Exercise failure/retry behavior as well as success.

## Folder/pattern change

Update [03_FOLDER_MAP.md](03_FOLDER_MAP.md), [FILE_INDEX.json](FILE_INDEX.json), [14_AI_TASK_ROUTING.md](14_AI_TASK_ROUTING.md), and pattern docs in the same task.
