# 0011: No preemptive abstraction layer over Cloudflare primitives

## Status

Accepted

## Context

Cloudflare was chosen as the hosting platform in [0003](./0003-cloudflare-platform.md), and D1 as the datastore in [0002](./0002-sqlite-d1-datastore.md), both as conscious trades of vendor lock-in against platform cohesion and trust. Neither entry quantified how deep that lock-in actually runs in practice, which prompted an audit of every Cloudflare-specific touchpoint across the monorepo's six apps (`editor`, `ontology`, `sources`, `targets`, `copilot`, `www`) before deciding whether to build an abstraction layer to keep a future migration cheap.

The audit (wrangler configs, `lib/server` code, `packages/*`) found:

- **D1** — every data-backed app (`targets`, `sources`, `ontology`'s two databases) calls `D1Database` directly (`.prepare/.bind/.batch/.withSession`) from `lib/server` functions, with `db` passed in as an explicit parameter rather than reached for ad hoc. The schema itself is plain SQLite DDL. This is the one genuinely sticky primitive: `.withSession()` (D1's read-replica consistency model) and `.batch()` (D1's atomicity semantics) don't have a vendor-neutral shape until a specific target datastore is known.
- **R2** (ontology backups only) — S3-compatible API, a trivial swap to any S3-compatible store.
- **Workers Rate Limiting** — already isolated behind `@tabitha/rate-limit`, which fails open if the binding is missing.
- **Cron trigger** (ontology) — a plain `scheduled()` export; only the trigger config is Workers-specific.
- **`adapter-cloudflare`** — a config-level SvelteKit adapter, swappable on its own terms.
- **Cloudflare AI Gateway** — a thin BYOK proxy in front of Google Vertex AI (`packages/ai/src/client.ts`), used for observability/cost tracking only. The actual inference vendor is Google, not Cloudflare.
- **Not used at all**: Durable Objects, Queues, Vectorize, KV, Workers AI, Turnstile, Access/Zero Trust — the primitives that tend to create genuine one-way doors elsewhere (stateful coordination, proprietary vector search, proprietary inference).

Net finding: lock-in is real but shallow, and concentrated almost entirely in the D1 access layer, which is already contained to a bounded, greppable set of files per app rather than scattered.

## Decision

Do not build a vendor-abstraction or adapter layer over D1 (or the other Cloudflare primitives) preemptively. Keep data access as it is today: apps call `D1Database` directly, passed as an explicit parameter into `lib/server` functions.

## Alternatives considered

- **A thin adapter interface now** (e.g. wrapping `prepare/bind/all/run` behind a vendor-neutral type). Rejected — the calls that map cleanly to almost any datastore already aren't the expensive part of a future migration. The expensive part is D1-specific behavior (`withSession`, `batch`) that has no meaningful vendor-neutral shape without knowing the target, so a thin wrapper wouldn't reduce the actual migration work, only relocate where the D1-specific code lives.
- **A full repository/ORM-style abstraction now.** Rejected on the same basis, more strongly — it would either flatten to the lowest common denominator and silently give up the D1-specific behavior the apps currently rely on (a functional regression, not a neutral one), or become vendor-aware internally and stop being a real abstraction at all. Either way it's designed against a guess at the eventual target (Turso, Postgres, self-hosted SQLite each model sessions/transactions differently) rather than a real one.

## Consequences

- A future migration off D1 means rewriting the data-access layer in each affected app directly against the new vendor's client — a real, bounded, mechanical porting job, not a one-file adapter swap. This is accepted as the cost of not guessing at an interface today.
- Because D1 access is already passed explicitly as a parameter rather than reached for globally, the migration surface stays easy to find (grep for `D1Database`) even without a dedicated abstraction.
- Revisit this decision only once a specific target datastore is actually chosen — at that point, design the interface against that vendor's real semantics, not a hypothetical one.
- 🎉 The migration surface staying this contained is itself a payoff of already passing `db` in as a parameter rather than reaching for it globally — the [Hollywood Principle](https://en.wikipedia.org/wiki/Hollywood_principle) ("don't call us, we'll call you") at work, not a new practice adopted for this decision.
