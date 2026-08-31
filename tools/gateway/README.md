# TaBiThA Gateway (`@tabitha/gateway`)

Provisions and reconciles the single Cloudflare AI Gateway that every TaBiThA app routes its Gemini calls through (see `docs/decisions/0007-ai-consolidation.md`). Apps consume the gateway via `@tabitha/ai`; this package only manages the gateway resource itself.

## Usage

1. Set `CLOUDFLARE_API_TOKEN` in `.env.local` -- an account token (Manage Account -> API Tokens, not My Profile -> API Tokens) named `AI Gateway - tools/gateway apply`, with the account-scoped "AI Gateway: Edit" permission. `CLOUDFLARE_ACCOUNT_ID` is already set in the committed `.env`.
2. Run `pnpm apply` to create the gateway if it doesn't exist yet, or update it to match `config.ts` if it does. Safe to re-run any time `config.ts` changes.

`config.ts` is the durable, versioned desired state -- change the gateway's config by editing it and re-running `pnpm apply`, not by hand-editing anything in the Cloudflare dashboard.

## Storing provider credentials (BYOK) -- manual, one-time

Not automated here -- more sensitive than gateway config, and best done through the dashboard's own validation rather than a hand-rolled API call:

1. Toggle **Authenticated Gateway** on under Gateway -> **Settings** (its "Create authentication token" button creates a personal token tied to your profile, not an account token -- don't use it). Instead create the token the same way as `CLOUDFLARE_API_TOKEN` above: Manage Account -> API Tokens -> Create Token, named `AI Gateway - runtime (copilot, ontology, editor)`, with the account-scoped "AI Gateway: Run" permission (D1/R2-style products, this one included, only offer whole-account scoping -- there's no narrower resource to pick). Save it as `AI_GATEWAY_TOKEN` in `.env.local` -- this is the per-request `cf-aig-authorization` token apps send, distinct from `CLOUDFLARE_API_TOKEN` above. Also set as the `AI_GATEWAY_TOKEN` secret on the `copilot`, `ontology`, and `editor` Workers (`wrangler versions secret put AI_GATEWAY_TOKEN` from each app directory, then `wrangler versions deploy <version-id>@100`).
2. Get a full Vertex service account JSON (a fresh key from Google Cloud Console is safest -- the decomposed `GEMINI_CLIENT_EMAIL`/`GEMINI_PRIVATE_KEY` env vars apps already hold won't paste-validate as JSON on their own).
3. Gateway -> **Provider Keys** -> Add -> provider **Google Vertex AI** -> paste the JSON -> pick the region matching `GEMINI_LOCATION`.

## Verifying it actually works

`pnpm verify` sends one real request through the live gateway using the real `@tabitha/ai` client (needs `AI_GATEWAY_TOKEN` in `.env.local` and `GEMINI_PROJECT_ID`/`GEMINI_LOCATION` in `.env`, alongside the BYOK setup above). This is a manual, credential-gated integration check -- not run in CI, and deliberately not named to match `bun test`'s automatic `*_test.ts` discovery -- and exists specifically to get a real answer to the open questions in `docs/decisions/0007-ai-consolidation.md` before any app depends on this in production.
