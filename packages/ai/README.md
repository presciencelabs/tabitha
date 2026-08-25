# @tabitha/ai

Shared LLM plumbing for every TaBiThA app. Owns response parsing, retry/telemetry config, credentials, and the Cloudflare AI Gateway routing — so call sites only supply a prompt, a schema (for JSON calls), and per-call overrides. See [ADR 0007](../../docs/decisions/0007-ai-consolidation.md) for the full rationale.

## Request flow

```mermaid
graph LR
	App["App server code<br/>(copilot, ontology)"] -->|"create_ai_client({ app, feature, gateway })"| Client["@tabitha/ai<br/>generate_json() / generate_text()"]
	Client -->|"cf-aig-authorization: Bearer token<br/>cf-aig-metadata: { app, feature }"| Gateway["Cloudflare AI Gateway<br/>(tabitha)"]
	Gateway -->|"cache hit (1h TTL)"| Client
	Gateway -->|"cache miss"| Vertex["Google Vertex AI<br/>gemini-3.5-flash, BYOK"]
	Vertex --> Gateway
```

Every call is routed exclusively through **Google Vertex AI** (never plain Google AI Studio) via a single shared gateway named `tabitha`. The gateway — not the app — holds the real Google credentials (BYOK); apps authenticate to it with one `AI_GATEWAY_TOKEN`. Gateway-side behavior (cache TTL, rate limiting, retry/backoff, prompt-injection guardrails) is provisioned by `tools/gateway`, not this package — see [`tools/gateway/README.md`](../../tools/gateway/README.md).

## Usage

```ts
import { create_ai_client } from '@tabitha/ai'

const ai = create_ai_client({
	app: 'copilot',
	feature: 'brief',
	gateway: {
		account_id: env.CLOUDFLARE_ACCOUNT_ID,
		gateway_name: 'tabitha',
		token: env.AI_GATEWAY_TOKEN,
		project: env.GEMINI_PROJECT_ID,
		location: env.GEMINI_LOCATION,
	},
})

const result = await ai.generate_json<MyShape>({
	contents: myPromptContents,
	schema: myJsonSchema,
})
```

`app`/`feature` are attached to every request as `cf-aig-metadata` for per-app cost/usage attribution in the gateway dashboard; they don't affect caching (confirmed empirically — see ADR 0007).

## What's fixed vs. overridable

- **Fixed package-wide, never overridable per call:** gateway base URL, auth headers, `model` (`gemini-3.5-flash`), `seed` (`42`). Two apps drifted to different values for both pre-consolidation with no real justification, so both are centralized now; see ADR 0007's "Resolved questions" if a genuine per-call need for either resurfaces.
- **Overridable** (`AiCallDefaults`, layered package defaults ← per-client `defaults` ← per-call `config`): `temperature`, `frequencyPenalty`, `presencePenalty`, and the rest of Google's `GenerateContentConfig` except `seed`.

## Errors

Both `generate_json` and `generate_text` throw `AiResponseError` on an empty or unparseable model response — one consistent failure mode across every call site, replacing the four divergent ones ADR 0007 catalogued.
