# 02 - Architecture

## Topology

A published n8n community package that exposes Posty5 short links, QR codes, HTML hosting, form submissions, social workspaces, and social posts as workflow nodes.

### Node execution

n8n loads node -> reads operation/parameters -> credential -> request helper -> maps result to items.

### File upload

Request signed URL/config -> upload binary directly -> finalize Posty5 operation.

### Build

prebuild removes dist -> tsc compiles registered credentials/nodes -> package.json publishes dist.

### Test

Jest uses the n8n-workflow mock and node-focused test files.

## Ownership rules

- Owns n8n node descriptions and request mapping, not backend behavior.
- Public node names, operations, parameters, and credential names are compatibility surfaces.
- dist and the packed .tgz archive are generated release artifacts.

## State and contracts

- Nodes are stateless per execution and read parameters/credentials from n8n.
- makeApiRequest unwraps a response.result envelope when present.
- POST bodies receive createdFrom: n8n.
- Pagination combines filter and page/pageSize query values.
- Binary uploads bypass Posty5 after receiving a signed URL.

Use [04_MODULES.md](04_MODULES.md) for owner paths and [17_PATTERNS.md](17_PATTERNS.md) for implementation conventions.
