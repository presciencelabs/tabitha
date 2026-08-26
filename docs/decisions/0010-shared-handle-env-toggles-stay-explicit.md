# 0010: Shared `Handle` factories take env-driven toggles as parameters, not by reading `$env/static/public` themselves

## Status

Accepted

## Context

Two shared packages, `@tabitha/cors` (`create_cors_handle`) and `@tabitha/rate-limit` (`create_rate_limit_handle`), each need a per-app boolean that differs between local dev/CI and a real deployment (`allow_localhost`, `disabled`). The natural-looking DRY move is for the package itself to import the relevant `PUBLIC_*` var from `$env/static/public` and read it internally, so every consuming app's `hooks.server.ts` only has to call `create_x_handle()` with no extra wiring.

That doesn't work here, and the reason isn't a style preference: `$env/static/public` is a virtual module SvelteKit's Vite plugin generates *for a specific SvelteKit project*. Neither `packages/cors` nor `packages/rate-limit` is a SvelteKit project — neither has a `svelte.config.js`, an `app.d.ts`, or any generated `.svelte-kit` output — and neither has a `vite.config`/`vitest.config` wiring the SvelteKit plugin into its own tooling. If either package's `src/index.ts` imported `$env/static/public` directly:

- `pnpm test:unit` (plain `vitest run src`) can't resolve the import at all — the package's own test suite stops compiling.
- `pnpm check` (`tsc --noEmit`) has no types for it either, since those types are also generated per-SvelteKit-project output this package doesn't have.

The import would only ever resolve once the package's source is bundled into a real app's SvelteKit build — at the cost of the package no longer being independently testable or typecheckable on its own.

## Decision

Each app reads its own `PUBLIC_*` var via `$env/static/public` and passes it explicitly into the factory as an option (`create_cors_handle({ allow_localhost })`, `create_rate_limit_handle({ disabled })`). The shared package stays a plain function of its inputs, with zero dependency on SvelteKit's env virtual modules, and every consuming app declares the corresponding key in its own `.env`.

This keeps the DRY-looking duplication in two places, both accepted:

- **The `.env` declaration itself**, one near-identical block per app. This isn't specific to this pattern — every public env var in this monorepo (`PUBLIC_CORS_ALLOW_LOCALHOST`, `PUBLIC_SOURCES_API_HOST`, etc.) is already declared per-app the same way, because Vite/SvelteKit's env loading is rooted at each app's own directory by default. Centralizing this would mean a monorepo-wide change to `envDir` conventions, not something to bolt onto one variable.
- **The `hooks.server.ts` wiring**, one import plus one options field per app. Small, but deliberate: it's the seam between SvelteKit's per-app, build-time static env and a generic, shared runtime helper.

## Alternatives considered

- **Package reads `$env/static/public` internally.** Rejected — breaks the package's own `pnpm test:unit`/`pnpm check`, as shown above, and turns a missing `.env` declaration in some future consuming app into a build-time crash rather than the toggle just defaulting to its safe value (rate limiting/CORS restriction stays enforced).
- **Package reads `$env/dynamic/public` instead.** Same problem — it's a different SvelteKit virtual module, but still one the SvelteKit Vite plugin generates per-project, so it fails to resolve in these packages' standalone tooling exactly the same way.
- **Package reads plain `process.env` at runtime, bypassing SvelteKit's env system entirely.** Rejected — Cloudflare Workers doesn't populate `process.env` the way Node does; relying on it would likely just silently resolve to `undefined` in an actual deployment, which happens to be the safe default here but for the wrong reason, and would be a fragile, confusing mechanism to depend on.
- **A shared root-level `.env` across the monorepo** (custom `envDir` pointing outside each app). Technically possible in Vite, but a real architecture change affecting every existing public env var, not just this one — out of scope for either the CORS or rate-limit work that raised this question.

## Consequences

- Every future shared `Handle` factory that needs an env-driven per-app toggle repeats this same small amount of boilerplate: one `.env` line, one `$env/static/public` import, one options field passed at each call site. This is the accepted cost of keeping shared packages independently testable and typecheckable outside of any single app's SvelteKit build.
- A consuming app that forgets to declare the var in its own `.env` fails safe (the toggle just stays at its default, e.g. `disabled: false`), not with a build error — the tradeoff this ADR is explicitly choosing over the alternative's fail-broken behavior.
- If a third or fourth shared package needs the same kind of toggle and this boilerplate starts feeling heavier, revisit the "shared root-level `.env`" alternative above as a deliberate, monorepo-wide change — not by quietly special-casing one package.
