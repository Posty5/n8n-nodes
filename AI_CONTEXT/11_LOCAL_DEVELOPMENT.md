# 11 - Local Development

| Task | Command |
| --- | --- |
| Install | `npm ci` |
| Build | `npm run build` |
| Watch compiler | `npm run dev` |
| Lint | `npm run lint` |
| Format | `npm run format` |
| Tests | `npm test` |
| Coverage | `npm run test:coverage` |
| Package preparation | `npm run prepare` |

## Working rules

- Prefer clean installs from the lockfile.
- Run commands from the `n8n-nodes/` project root.
- Do not commit generated output, dependencies, archives, credentials, or local logs.
- Confirm command names against the current manifest/project files when documentation and source disagree.
