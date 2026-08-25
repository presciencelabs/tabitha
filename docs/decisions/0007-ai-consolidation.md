# 0007: AI plumbing consolidation

## Status

Accepted

## Context

Four LLM call sites had accumulated across two apps (`apps/ontology/src/lib/server/semantic_search.ts`, `apps/copilot/src/lib/server/semantic_notes.ts`, and `apps/copilot/src/lib/server/brief/brief.ts` ×2), each hand-rolling its own model client, credentials, and JSON-response parsing. All four share the same config idiom (`temperature: 0.0`, a fixed `seed`, `systemInstruction`, `responseMimeType: 'application/json'`, `responseJsonSchema`), but the response parsing diverges — four different failure modes for the same shape of call. Credentials are also split across two auth schemes: ontology uses a raw Gemini API key (`API_KEY_GEMINI`), copilot uses a Vertex service account (four separate vars). This drift should be brought under one roof before it grows further, particularly ahead of rebuilding the editor's `ai-assist` feature, which would otherwise become a fifth divergent call site.

## Decision

Consolidate the shared, non-domain parts of AI usage into two new pieces, while deliberately leaving prompts where they are:

- **`packages/ai`** — a shared LLM plumbing package (`@tabitha/ai`) providing `generate_json<T>()` and `generate_text()`. It owns response parsing with one consistent failure mode, and merges config in three layers: package defaults ← per-client defaults (`{ app, feature }`) ← per-call overrides. Most of Google's `GenerateContentConfig` (temperature, schema, etc.) is overridable per call; `model` and `seed` are fixed centrally instead (see "Open questions" below — the pre-consolidation drift between call sites turned out to be unintentional, not a real per-app need), alongside credentials, gateway base URL, `cf-aig-*` headers, retry/backoff, and telemetry, which were already package-owned and not overridable — if a caller could override the gateway base URL or auth, centralization would be defeated. A narrow override for `model` or `seed` can be reintroduced later if a real per-call need for either actually emerges. **The client routes exclusively through Google Vertex AI** (never plain Google AI Studio), including for ontology, which previously used AI Studio's simpler API-key auth. Vertex is a hard requirement for copilot's global-deployment/data-residency needs, and there's no standing reason for the two apps to differ on this — every app gains Vertex's stronger data-use guarantees, at the cost of every app now needing a GCP project/region configured (previously only copilot did). An earlier draft of this package supported both providers behind an `AiProvider` union; simplified to Vertex-only since keeping AI Studio around had no real justification once BYOK removes per-app credential setup as a reason to prefer it.
- **Cloudflare AI Gateway with BYOK**, one gateway shared across all TaBiThA apps, sitting between every app and Vertex as a single control plane instead of each app calling Vertex directly. Credential centralization is the most visible benefit, but not the only reason it earns its place:
  - **Credentials.** Apps hold only a gateway token (BYOK) instead of app-specific model credentials.
  - **Caching.** `cache_ttl` (one hour, `tools/gateway/config.ts`) turns a repeated identical request into a free cache hit instead of a billed one — most valuable for ontology's ~74k-token search payloads, where Vertex bills per token regardless of whether the same answer was already computed minutes ago.
  - **Rate limiting.** A shared per-gateway limit (`rate_limiting_limit`/`rate_limiting_interval`) protects the account's Vertex quota and spend from a runaway client, without every app reimplementing its own limiter.
  - **Retry/backoff.** Transient provider errors are retried at the gateway (`retry_max_attempts`/`retry_delay`/`retry_backoff`) before an app ever sees a failure, instead of every call site hand-rolling its own retry loop on top of `@google/genai`.
  - **Observability.** Per-app cost/usage attribution via `cf-aig-metadata`, plus full request/response logging (the dashboard's Logs, Analytics, and User Insights tabs) for debugging and cost accounting — without adding logging code to every app.
  - **Firewall.** A uniform content/safety policy layer in front of every provider call — see the dedicated bullet below.

  Per-request headers (`cf-aig-cache-ttl`, `cf-aig-skip-cache`, `cf-aig-cache-key`) give the segmentation that would otherwise require multiple gateways. **Not used: a custom domain fronting the gateway URL.** The URL is pure server-to-server plumbing — only ever the `baseUrl` an app's Worker passes to the Vertex SDK, never exposed to a browser or any external consumer — so a custom domain would trade DNS/zone ownership for a cosmetically nicer hostname nobody but the apps themselves ever sees. Revisit if the gateway URL ever needs to be externally reachable or user-facing.
- **Firewall: Guardrails on, DLP not yet.** Prompt injection is blocked at the gateway (`guardrails.prompt.P1 = 'BLOCK'` in `tools/gateway/config.ts`) for every app uniformly, rather than each call site defending against it separately. The 13 Llama Guard 3 content-hazard categories (`S1`-`S13`: violence, hate, self-harm, sexual content, etc.) are deliberately left unenforced — TaBiThA's content is Bible text, where violence, war, and other mature themes are routine and legitimate, so blocking on those categories would false-positive on real scripture. DLP (sensitive-data scanning) is not enabled yet — it requires a Cloudflare Zero Trust DLP profile that doesn't exist in the account yet; revisit once there's a concrete definition of what counts as sensitive data for this app's traffic.
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
- Credential surface should shrink: ontology's `API_KEY_GEMINI` and copilot's four Vertex vars (`GEMINI_PROJECT_ID`, `GEMINI_LOCATION`, `GEMINI_CLIENT_EMAIL`, `GEMINI_PRIVATE_KEY`) are intended to be replaced by one gateway token, held once. **Confirmed** against the real BYOK-configured gateway (see "Things to verify" below); either app's old vars can now be deleted.
- Ontology gains a new operational requirement it didn't have before: a GCP project and region, since Vertex (unlike AI Studio) requires both regardless of BYOK. This is a one-time Phase 2 setup cost, not a per-app one, since all apps share the same gateway/project/region.
- Per-app cost/usage attribution via `cf-aig-metadata` is wired up in the package from the start. **Confirmed** it does not participate in the AI Gateway cache key (see "Things to verify" below), so ontology's large (~74k-token) search payloads won't have their caching fragmented by per-app tagging.
- A runaway batch job in one app (e.g. copilot) can throttle another app's calls (e.g. ontology's search), since the shared gateway has no built-in rate-limit isolation between apps. **Revisit trigger:** if this becomes a real problem, split into per-app gateways.
- **Revisit trigger:** if a cross-corpus AI capability emerges that doesn't belong to any single app, reconsider the `apps/ai` alternative above.

## Resolved questions

The original migration (Phase 3, below) preserved each existing call site's model and seed as an explicit per-client override, on the assumption the differences might have been deliberate rather than drift:

- **Ontology used `gemini-2.5-flash`; copilot used `gemini-3.5-flash`.**
- **`brief.ts` used seed `41`; `semantic_notes.ts` and `semantic_search.ts` used seed `42`.**

**Resolved (2026-08-24): both were drift, not intentional.** `model` and `seed` are now fixed in `packages/ai/src/client.ts` (`gemini-3.5-flash`, seed `42`) and removed entirely from the overridable config surface (see `AiCallDefaults` in `types.ts`) rather than left as a per-call override every site has to remember to set consistently. A narrow override can be reintroduced later if a real per-call need for either actually emerges (e.g. ontology's large ~74k-token payloads eventually warranting a cheaper/faster model) -- until then, one fixed value for both is simpler than an override surface nothing was using deliberately.

## Phase 3 status

Code migration is complete for all four call sites (`semantic_search.ts`, `semantic_notes.ts`, `brief.ts` ×2) -- both apps now route through `@tabitha/ai`, `@google/genai` is dropped from both apps' `package.json`, ontology's in-memory cache is replaced by `cf-aig-cache-ttl`, and both apps' `.env`/`wrangler.jsonc` are updated to the new gateway-token model. Each site's model and seed were initially preserved as an explicit override; see "Resolved questions" above for why they're now fixed package-wide instead.

One deliberate, minor behavior change beyond pure plumbing: the four sites previously handled an empty/malformed LLM response inconsistently (silent `[]`/`{notes: []}` fallback in some, an uncaught throw on invalid JSON in others). All four now catch `AiResponseError` uniformly and fail soft (empty results, `undefined`, or the existing retry path, depending on the site) -- consistent with the retry-oriented error handling `copilot`'s route handlers already do, and arguably safer than crashing on a malformed response. Flagging this explicitly since "behavior must not change" was the stated goal for this phase; this is the one place it does, narrowly, in the failure path only.

**Live-verified (2026-08-24)**: Vertex Provider Keys (BYOK) were added in the dashboard and `pnpm verify` in `tools/gateway` succeeded end to end -- see "Things to verify" below.

## Things to verify empirically before relying on this in production

- ~~**Vertex AI + BYOK client-side auth.**~~ **Confirmed working (2026-08-24).** `pnpm verify` in `tools/gateway` sent a real request through the live gateway with Vertex Provider Keys configured, and it succeeded end to end. The extraneous `x-goog-api-key` header the `@google/genai` SDK sends alongside `cf-aig-authorization` does not cause the 400s Cloudflare's BYOK docs warned about -- Cloudflare's gateway apparently ignores or tolerates it for Vertex's OAuth-bearer auth path.
- ~~**`cf-aig-metadata` and the cache key**~~ **Confirmed: does not fragment the cache (2026-08-24).** `pnpm verify:cache` in `tools/gateway` sent the same prompt through the live gateway with two different `{ app, feature }` values and inspected `cf-aig-cache-status` on each response. A request with different metadata than the one that populated the cache still came back `HIT`, and a follow-up request using the *original* metadata also hit the same entry -- one shared cache entry regardless of metadata. (The first same-metadata repeat came back `MISS`, which looked at first like metadata was the deciding factor, but a later HIT with different metadata plus a HIT reverting to the original metadata showed that was just normal cache-population lag after the first write, not metadata-based fragmentation.) Per-app cost/usage attribution via `cf-aig-metadata` is safe to rely on without worrying it splits the cache.
- ~~The exact Cloudflare REST endpoint and payload for gateway creation/update (Phase 2).~~ **Confirmed working** -- `tools/gateway/apply.ts` provisioned the real `tabitha` gateway successfully.
