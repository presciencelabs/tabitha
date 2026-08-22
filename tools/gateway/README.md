# TaBiThA Gateway (`@tabitha/gateway`)

Provisions and reconciles the single Cloudflare AI Gateway that every TaBiThA app routes its Gemini calls through (see `docs/decisions/0005-ai-consolidation.md`). Apps consume the gateway via `@tabitha/ai`; this package only manages the gateway resource itself.

## Usage

1. Set `CLOUDFLARE_API_TOKEN` in `.env.local` (a Cloudflare API token with the account-scoped "AI Gateway: Edit" permission -- see `.env` for the dashboard link). `CLOUDFLARE_ACCOUNT_ID` is already set in the committed `.env`.
2. Run `pnpm apply` to create the gateway if it doesn't exist yet, or update it to match `config.ts` if it does. Safe to re-run any time `config.ts` changes.

`config.ts` is the durable, versioned desired state -- change the gateway's config by editing it and re-running `pnpm apply`, not by hand-editing anything in the Cloudflare dashboard.

## Storing provider credentials (BYOK)

Storing the real Google Vertex AI service account in the gateway (so apps only need the gateway token, never real Google credentials) is a separate, one-time, more sensitive step not yet automated here -- see the `provider_configs` sub-resource in Cloudflare's AI Gateway API (`POST /accounts/{account_id}/ai-gateway/gateways/{gateway_id}/provider_configs`, with `provider_slug: 'google-vertex-ai'`). Do this manually via the dashboard or API once the gateway exists.
