# 01 - Project Overview

## Purpose

A published n8n community package that exposes Posty5 short links, QR codes, HTML hosting, form submissions, social workspaces, and social posts as workflow nodes.

## Capabilities

- **Posty5 API credential** - owned by `credential`.
- **Short-link automation** - owned by `short-link`.
- **QR automation** - owned by `qr-code`.
- **HTML hosting automation** - owned by `html-hosting`.
- **Form-submission workflow** - owned by `form-submission`.
- **Social publishing** - owned by `social-post`.

## Stack

- Project type: n8n community node package.
- Runtime: Node.js in the n8n execution runtime.
- Package/build system: npm.

## Boundaries

- Owns n8n node descriptions and request mapping, not backend behavior.
- Public node names, operations, parameters, and credential names are compatibility surfaces.
- dist and the packed .tgz archive are generated release artifacts.

The source of truth for ownership is [MODULE_INDEX.json](MODULE_INDEX.json); feature mapping is in [FEATURE_INDEX.json](FEATURE_INDEX.json).
