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

## D10 - Get Analytics is additive on node version 1, package 4.6.0.

**Status:** decided 2026-10-05 (feature `link-qr-visit-analytics`, task `n8n-nodes/link-qr-analytics-operations`). The task plan said 4.5.0 unless optimistic-concurrency's node v2 / 5.0.0 was in flight; 4.5.0 is taken by the truth pass (D06-D09) and node v2 has not started, so the operation ships as 4.6.0 on node v1. When `versioned-writes-node-v2` lands, v2 must carry `getAnalytics` too (read-only: no `If-Match`).

## D11 - Analytics: presets resolved client-side, breakdown toggle on by default, 403 as NodeApiError.

**Status:** decided 2026-10-05; time zone revised the same day by the owner. Presets are sent as explicit `from`/`to` (today and the N-1 days before, inclusive like the API's day ranges), so the request is reproducible from the execution log. "Today" is counted in the Time Zone option, else the workflow's time zone (`getTimezone()`: Workflow Settings → Timezone, default `GENERIC_TIMEZONE`), else UTC, and that same zone is always sent as `tz` (the API validates it with moment-timezone, max 64 chars), so the API buckets days exactly as the presets counted them. Consequence: from n8n the owner's account time zone (the API's `tz` default) is never used. An omitted `breakdown` means every breakdown the plan allows on the API side, the same as `all`. *All Breakdowns My Plan Allows* defaults on: `breakdown=all` never fails on a plan gate (locked ones go to `meta.locked`); the toggle makes that explicit in the request. `makeApiRequest` now reads the API message from `response.data` (axios, what n8n's `httpRequest` throws) as well as `response.body`, and keeps the status as `httpCode` on the thrown error (`IPosty5ApiError`); only Get Analytics maps a status (403 to `NodeApiError` with the API message unchanged, C4). The thrown message text of every other operation is unchanged (`Posty5 API Error: ...`). No plan name is hard-coded.

## D12 - Get Statistics is a plain pass-through (4.6.0).

**Status:** decided 2026-10-05 (owner approved SDK `statistics()`). `GET <SHORT_LINK|QR_CODE>/statistics` takes the API's own `period` (`today|7d|30d|month|custom`, default `30d`) and, for Custom, `from`/`to` day keys; the node computes no dates (the API counts UTC days on the server) and returns the `{ range, data }` answer unchanged. Parameters are `statisticsPeriod` / `statisticsFrom` / `statisticsTo`, distinct from Get Analytics' `range` / `from` / `to`. Errors keep the `Posty5 API Error:` text; the analytics not-found answer is a 400 and is not mapped.

Do not invent historical rationale. Record evidence-based current decisions and label unknown rationale explicitly.
