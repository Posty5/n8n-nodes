# 06 - Authentication and Security

## Rules and trust boundaries

- The API key is an n8n password credential and must never be logged or copied into node parameters.
- All nodes rely on X-API-Key; preserve the credential name posty5Api for saved workflows.
- Signed upload URLs are short-lived capabilities and must not be persisted or exposed.
- Error enhancement must avoid echoing credential headers or sensitive response bodies.
- Public parameter names and operation values are serialized into saved n8n workflows.

## Secret handling

- Document configuration names and purposes only, never values.
- Never print credentials, tokens, cookies, signed URLs, private endpoints, or production payloads.
- Browser/client checks are not backend authorization.
- Read [15_RISKY_AREAS.md](15_RISKY_AREAS.md) before security-sensitive work.
