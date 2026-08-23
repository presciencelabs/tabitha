# 0005: JSON endpoints over SvelteKit form actions for concept edits

## Status

Accepted

## Context

`apps/ontology`'s concept create/update pages originally submitted via SvelteKit's form actions (`export const actions`, native `<form method="POST" action="?/update">`), ending in a server-side `redirect()` to `/protected/changes`.

An offline-capable write queue is planned for this same flow (concept editing is the pilot for the monorepo's offline strategy): a service worker will eventually need to record a change locally, then replay it to the server later, and read back a structured result to update its own local state (applied vs. still-pending vs. failed).

## Decision

Concept create/update submissions go through plain JSON `+server.ts` endpoints (`concept/create/submit`, `concept/update/submit`) called via the client's own `fetch()`, not SvelteKit's `actions` + `use:enhance`.

## Alternatives considered

- **Keep the redirect-based form action.** Rejected: the only way to pass the submission's outcome (applied vs. pending) across a server-side `redirect()` was to encode it in the query string, which made a false "success" bookmarkable and forced a navigation the UI didn't actually want.
- **Form action returning data, read via `use:enhance`.** This fixes the redirect/query-string problem, but the response is still SvelteKit's own action-result wire format (`$app/forms`, devalue-encoded) — awkward for a future service worker's replay logic to construct and parse, since it isn't arbitrary-`fetch()`-friendly the way plain JSON is. A plain JSON contract is directly reusable by both the live UI path today and the queued/replayed path later, with no adapter layer in between.

## Consequences

- These routes lose SvelteKit's free progressive-enhancement/no-JS fallback. Accepted as a non-issue: this is a small, internal, always-JS tool for a handful of authorized editors.
- Slightly more boilerplate per endpoint than a form action would need (manual JSON parsing instead of `request.formData()`, an authorization check that now lives in both `load` and the `+server.ts` handler instead of being shared via `actions`).
- The offline write queue, when built, calls these same endpoints unchanged — no rework anticipated there.
