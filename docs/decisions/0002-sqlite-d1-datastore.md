# 0002: SQLite, via Cloudflare D1, as the primary datastore

## Status

Accepted

## Context

Every app needs a backing datastore, and the apps are already deployed on Cloudflare Workers. The workload this project envisions — a linguistic knowledge base and translation tooling — doesn't call for the capability of a full-featured RDBMS.

## Decision

Use SQLite as the data format across apps, hosted via Cloudflare D1.

- File-based storage brings a broad set of benefits: portability, embeddability, trivial local dev, and snapshot-based tooling. This is already paying off in practice — the E2E test suite seeds D1 by copying real production snapshot `.sqlite` files directly, rather than maintaining synthetic fixtures (`tools/databases/scripts/load_d1.ts`).
- D1 specifically was chosen out of trust in Cloudflare as a platform, and because D1's distributed, read-replica model fits the project's expected user base: read-heavy, globally-distributed translation teams benefit from low-latency reads served near them.
- SQLite compiling to WASM keeps a path open to genuinely offline-capable clients later — the same schema/queries could in principle run client-side, which lines up with the offline data-write-sync goal noted in [0001](./0001-service-worker-strategy.md). This is a promising option, not yet a built or committed mechanism.

## Alternatives considered

Postgres (e.g. via Cloudflare Hyperdrive, or a separately hosted instance) was ruled out early: the workload envisioned for this project doesn't warrant that level of capability, and a full RDBMS brings operational overhead a file-based datastore avoids entirely.

## Consequences

- Local dev, testing, and migration tooling all benefit from SQLite being a plain file, as already demonstrated by the snapshot-based E2E test setup.
- Read-heavy, globally-distributed access is well-served by D1's replica model.
- Keeps genuine offline support open as a future option via SQLite-over-WASM, without committing to a specific implementation yet.
- D1's operational limits (database size ceilings, write-throughput characteristics, product maturity relative to an established hosted Postgres) haven't been a deciding factor so far, since the current workload hasn't pushed against them — worth revisiting if usage grows substantially.
