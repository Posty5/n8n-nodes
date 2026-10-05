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

## D06 - Short Link and QR Code updates are fetch-then-put (4.5.0).

**Status:** decided 2026-10-05 (feature `link-qr-truth-pass`). Both `PUT` routes replace the record with the body they get: the short-link update requires `baseUrl`, resets an omitted `createdFrom` to "api" and `subCategory`/`templateType` to empty; the QR update renames an untitled code after its text and drops `templateType`. So Update GETs the record and sends the stored values back with the user's fields on top. It never sends `customLandingId` (the short-link update schema refuses it), never copies the stored Android/iOS URLs (sent only when the user adds the field, so the API keeps or re-derives them per TP-D4), and never copies the stored `pageInfo.image` (refused by both schemas). It is last-write-wins; `optimistic-concurrency/n8n-nodes/versioned-writes-node-v2` keeps this as node v1's behaviour and adds `If-Match` from the fetched version.

## D07 - Template is a dropdown, required on Create, optional on Update (4.5.0).

**Status:** decided 2026-10-05. The API refuses every API-key create and update without `templateId` (TP-D7). The field is a top-level `options` property with `loadOptionsMethod: getQrTemplates` (user-lookup first, then public-lookup; both callable with the API key). It is declared twice under one name: `required` on Create; optional on Update, where an empty value falls back to the stored template, so "Update with only an ID and a new name" works as the feature's acceptance criterion asks. This departs from the task plan's "required on Create and Update"; the API requirement is met either way. The node also refuses a Create without a template before calling the API.

## D08 - The legacy `additionalFields.templateId` stays as a deprecated option (4.5.0).

**Status:** decided 2026-10-05. n8n rebuilds a collection's value from its declared options when it loads a workflow (`NodeHelpers.getNodeParameters`), so removing the option would drop the template from every workflow saved by 4.4.0 and break a Short Link Create that worked. The option is kept as "Template ID (Deprecated)" and read only when the Template field is empty. Remove it in the next major. `isEnableMonetization` was removed outright: the API never accepted it, so no working workflow depends on it.

## D09 - The QR Code node builds no `options.text` (4.5.0).

**Status:** decided 2026-10-05. The server builds the encoded text from `qrCodeTarget` for every type and ignores a client value (TP contract, A14/A17). The node sends `options: {}` because the schema requires the key; the template supplies the design.

Do not invent historical rationale. Record evidence-based current decisions and label unknown rationale explicitly.
