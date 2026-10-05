# 18 - Decisions

## D01 - The package registers six nodes and one credential in package.json.

**Status:** observed in current source. Revisit only with compatibility, migration, and verification impact documented.

## D02 - All Posty5 requests use n8n native HTTP helpers.

**Status:** observed in current source. Revisit only with compatibility, migration, and verification impact documented.

## D03 - POST requests are tagged createdFrom: n8n.

**Status:** observed in current source. Revisit only with compatibility, migration, and verification impact documented.

## D04 - The published package contains dist only.

**Status:** observed in current source. Revisit only with compatibility, migration, and verification impact documented.

## D05 - ROUTE_INDEX is intentionally empty because this is a workflow-node package, not an HTTP server.

**Status:** observed in current source. Revisit only with compatibility, migration, and verification impact documented.

## D06 - The client version is compiled in from package.json.

**Status:** decided 2026-10-05 (mcp-server, `credential-test-via-current-key`). `utils/constants.ts` imports `version` from `../package.json` (`resolveJsonModule` was already on), so `X-Posty5-Client` cannot drift from the published version; the publish workflow runs no tests, so a hand-kept constant could. Cost: tsc copies `package.json` to `dist/package.json`, which ships in the tarball, and `jest.config.js` ignores `dist/` so the copy does not collide with the root manifest.

## D07 - The credential test mixes rule kinds.

**Status:** decided 2026-10-05. `n8n-workflow` types `ICredentialTestRequest.rules` as a list of one kind, but n8n's credential tester reads each rule by `type` (`responseCode` on a failed request, `responseSuccessBody` on a successful one). `credentials/Posty5Api.credentials.ts` lists both and casts the list; each rule is checked with `satisfies`.

Do not invent historical rationale. Record evidence-based current decisions and label unknown rationale explicitly.
