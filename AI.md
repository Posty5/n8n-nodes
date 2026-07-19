# Posty5 n8n Nodes - AI Entry Point

This repository is the n8n community node package. A published n8n community package that exposes Posty5 short links, QR codes, HTML hosting, form submissions, social workspaces, and social posts as workflow nodes.

## Required reading order

1. `AI_CONTEXT/00_START_HERE.md`
2. `AI_CONTEXT/14_AI_TASK_ROUTING.md`
3. `AI_CONTEXT/13_CHANGE_PLAYBOOK.md`
4. `AI_CONTEXT/FILE_INDEX.json`
5. `AI_CONTEXT/MODULE_INDEX.json`
6. `AI_CONTEXT/FEATURE_INDEX.json`

## Hard rules

- Use exact paths from the indexes; verify with search when an item is not indexed.
- Read `AI_CONTEXT/15_RISKY_AREAS.md` before changing security, compatibility, deployment, uploads, SSR, permissions, or public APIs.
- Never copy secret values into code, logs, documentation, fixtures, or chat output.
- Do not edit generated/local artifacts described in `AI_CONTEXT/03_FOLDER_MAP.md`.
- Run the checks in `AI_CONTEXT/11_LOCAL_DEVELOPMENT.md` and `AI_CONTEXT/12_TESTING_DEBUGGING.md`.
- Update the matching Markdown and JSON indexes whenever architecture, routes/API, config, integrations, modules, features, or patterns change.

Project context is local to `n8n-nodes/`; sibling repositories have their own rules.
