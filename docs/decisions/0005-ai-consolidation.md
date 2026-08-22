# 0005: AI plumbing consolidation

## Status

Accepted

## Context

Four LLM call sites had accumulated across two apps (`apps/ontology/src/lib/server/semantic_search.ts`, `apps/copilot/src/lib/server/semantic_notes.ts`, and `apps/copilot/src/lib/server/brief/brief.ts` ×2), each hand-rolling its own model client, credentials, and JSON-response parsing. All four share the same config idiom (`temperature: 0.0`, a fixed `seed`, `systemInstruction`, `responseMimeType: 'application/json'`, `responseJsonSchema`), but the response parsing diverges — four different failure modes for the same shape of call. Credentials are also split across two auth schemes: ontology uses a raw Gemini API key (`API_KEY_GEMINI`), copilot uses a Vertex service account (four separate vars). This drift should be brought under one roof before it grows further, particularly ahead of rebuilding the editor's `ai-assist` feature, which would otherwise become a fifth divergent call site.

## Decision

Consolidate the shared, non-domain parts of AI usage into two new pieces, while deliberately leaving prompts where they are:

- **`packages/ai`** — a shared LLM plumbing package (`@tabitha/ai`) providing `generate_json<T>()` and `generate_text()`. It owns response parsing with one consistent failure mode, and merges config in three layers: package defaults ← per-client defaults (`{ app, feature }`) ← per-call overrides. Anything in Google's `GenerateContentConfig` (model, temperature, seed, schema, etc.) is overridable per call; credentials, gateway base URL, `cf-aig-*` headers, retry/backoff, and telemetry are owned by the package and not overridable — if a caller could override the gateway base URL or auth, centralization would be defeated. **The client routes exclusively through Google Vertex AI** (never plain Google AI Studio), including for ontology, which previously used AI Studio's simpler API-key auth. Vertex is a hard requirement for copilot's global-deployment/data-residency needs, and there's no standing reason for the two apps to differ on this — every app gains Vertex's stronger data-use guarantees, at the cost of every app now needing a GCP project/region configured (previously only copilot did). An earlier draft of this package supported both providers behind an `AiProvider` union; simplified to Vertex-only since keeping AI Studio around had no real justification once BYOK removes per-app credential setup as a reason to prefer it.
- **Cloudflare AI Gateway with BYOK**, one gateway shared across all TaBiThA apps. Apps hold only a gateway token instead of app-specific model credentials. Per-request headers (`cf-aig-cache-ttl`, `cf-aig-skip-cache`, `cf-aig-cache-key`) give the segmentation that would otherwise require multiple gateways.
- **Prompts stay in the consuming app.** They are domain knowledge that co-evolves with the types they reference (ontology's concept shape, copilot's trigger/education-level semantics, editor's token structure), not shared plumbing.
- **Gateway lifecycle code lives in `tools/gateway`**, not `scripts/dx`, following the `tools/` vs `scripts/` boundary rule (see companion change to `AGENTS.md`): `tools/` creates and maintains real, durable infrastructure; `scripts/dx` exists to get a developer's local environment running.

## Alternatives considered

**A dedicated `apps/ai` service**, consolidating prompts and model calls into one owning app that other apps would call via a Cloudflare service binding. Rejected — not on principle, but because it isn't earned yet:

1. **Type/domain coupling.** A prompt-owning service would need copilot's trigger and education-level semantics, ontology's concept shape, and editor's token structure compiled into it. Service bindings make moving *data* free but do nothing for this coupling.
2. **Deploy bottleneck.** Every prompt tweak would become a deploy of a shared dependency used by every app.
3. **Review cohesion.** Prompt, schema, and domain types want to be reviewed together as one PR; splitting them across app and service boundaries works against that.

Note that data gravity was *not* a reason against `apps/ai` — sharing a D1 binding across apps is already accepted practice in this monorepo, and holding a binding does not make an app the conceptual owner of a schema. This alternative should be revisited if a capability emerges that spans corpora and owns no single app's data (e.g. a chat/agent over ontology + sources + targets together).

**Multiple AI Gateways** (one per app), which would give rate-limit isolation out of the box. Rejected in favor of one gateway with per-request header segmentation, to keep gateway administration and cost attribution in one place. Rate-limit isolation is the one thing a single gateway does not provide — noted as a revisit trigger below.

## Consequences

- Every new AI call site gets consistent JSON-response handling, retry/backoff, and telemetry for free, instead of re-deriving them.
- Credential surface should shrink: ontology's `API_KEY_GEMINI` and copilot's four Vertex vars (`GEMINI_PROJECT_ID`, `GEMINI_LOCATION`, `GEMINI_CLIENT_EMAIL`, `GEMINI_PRIVATE_KEY`) are intended to be replaced by one gateway token, held once. This needs empirical confirmation against a real BYOK-configured gateway (see "Things to verify" below) before either app's old vars can actually be deleted.
- Ontology gains a new operational requirement it didn't have before: a GCP project and region, since Vertex (unlike AI Studio) requires both regardless of BYOK. This is a one-time Phase 2 setup cost, not a per-app one, since all apps share the same gateway/project/region.
- Per-app cost/usage attribution via `cf-aig-metadata` is wired up in the package from the start (there's no production traffic yet to fragment), but should still be verified empirically to confirm it does not participate in the AI Gateway cache key before ontology starts sending real search traffic through it — if it does, per-app tagging would fragment caching, which matters most for ontology's large (~74k-token) payloads.
- A runaway batch job in one app (e.g. copilot) can throttle another app's calls (e.g. ontology's search), since the shared gateway has no built-in rate-limit isolation between apps. **Revisit trigger:** if this becomes a real problem, split into per-app gateways.
- **Revisit trigger:** if a cross-corpus AI capability emerges that doesn't belong to any single app, reconsider the `apps/ai` alternative above.

## Open questions for the team

This consolidation preserves each existing call site's current model and seed as an explicit per-client override, on the assumption that the differences below were deliberate rather than drift. Worth confirming with whoever originally set them, since the answer only costs a follow-up cleanup either way:

- **Ontology uses `gemini-2.5-flash`; copilot uses `gemini-3.5-flash`.** Was ontology pinned to `2.5-flash` on purpose (e.g. cost/latency tradeoff for its large ~74k-token payloads), or should it move onto the newer model like copilot?
- **`brief.ts` uses seed `41`; `semantic_notes.ts` and `semantic_search.ts` use seed `42`.** Was that split intentional, or did it just drift from copy-paste? If not intentional, all call sites should standardize on one seed.

## Things to verify empirically before Phase 3 migration

- **Vertex AI + BYOK client-side auth.** `@google/genai`'s Node auth layer only skips its own Google-credential resolution when an `apiKey` is supplied on the client -- otherwise it tries to resolve real Application Default Credentials, which would fail in a Cloudflare Worker. Supplying the gateway token as `apiKey` avoids that failure (confirmed by tracing the SDK's precedence logic that this doesn't change the request body or URL -- those are still driven by the real `project`/`location`), but the SDK then also sends an `x-goog-api-key` header carrying that same (not-a-real-Google-key) value on every request. Cloudflare's BYOK docs warn that sending a provider-key-style header alongside `cf-aig-authorization` can cause confusing 400s; it's unconfirmed whether that applies here, since Vertex's native auth is OAuth-bearer-based rather than API-key-based, and the extraneous header may simply be ignored. Test against a real BYOK-configured gateway before depending on this in production.
- **`cf-aig-metadata` and the cache key**, as above.
- The exact Cloudflare REST endpoint and payload for gateway creation/update (Phase 2).
