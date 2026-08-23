# Ontology e2e tests

Standard Playwright specs (`pnpm test:e2e`), with one addition: `/protected/*` routes are reachable in tests without ever going through Google OAuth.

## How authenticated tests work

`auth.setup.ts` runs once before the suite (wired in via `playwright.config.js`'s `globalSetup`) and:

1. Runs `pnpm db:grant e2e-test@tabitha.local`, giving that fixture account every Ontology permission in your local Auth D1 -- the same command described in the root `CONTRIBUTING.md`.
2. Signs an Auth.js session JWT for that email using `@auth/core/jwt`'s `encode()` and the app's own `AUTH_SECRET`, then saves it as a cookie in `e2e/.auth/user.json` (gitignored).

Every test then runs with that `storageState` already applied (see `playwright.config.js`'s `use.storageState`), so `page.goto('/protected/...')` just works -- no login step needed in the test itself.

See [`docs/decisions/0006-e2e-auth-bypass-via-signed-session-cookie.md`](../../../docs/decisions/0006-e2e-auth-bypass-via-signed-session-cookie.md) for why this approach was chosen over automating a real Google sign-in.

## Requirements

- `apps/ontology/.env.local` must have a real `AUTH_SECRET` (from `pnpm setup:env`) -- it has to be the *same* secret the dev server itself uses, since the signed cookie is decrypted with it.
- The local Auth D1 must exist (`pnpm db:load:ontology`), since that's what `db:grant` writes into.
- `bun` must be on `PATH` (same requirement as `pnpm db:grant`/`db:load` generally).

## If a protected-route test starts failing with a 401/redirect-to-login

- Confirm `AUTH_SECRET` in `.env.local` actually matches what the running dev server loaded (a stale copy from a different environment won't decrypt).
- Confirm this app is still on the JWT session strategy with no custom `jwt`/`session` callbacks in `hooks.server.ts` -- if either changes, `auth.setup.ts`'s token shape (or the cookie-signing approach entirely) needs to be revisited; see ADR 0006's consequences.
- Re-run `pnpm db:grant e2e-test@tabitha.local` by hand and check its output -- if the local Auth D1 was just reloaded from a snapshot, grants reset with it.
