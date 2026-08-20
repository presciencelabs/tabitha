# 0003: Cloudflare as the hosting platform

## Status

Accepted

## Context

The project needed a hosting/compute platform for all five apps, which in turn shapes runtime constraints (Cloudflare Workers) and the datastore choice ([0002](./0002-sqlite-d1-datastore.md)).

## Decision

Host on Cloudflare (Workers, D1, and other platform primitives as needed).

This wasn't evaluated fresh for this project — it's built on prior personal experience with Cloudflare across other work, which earned trust over time on a few technical dimensions in particular:

- The edge-compute model.
- Pricing.
- Having compute, database, and other primitives under a single, unified platform rather than stitched together across vendors.

That accumulated experience also translates into confidence in Cloudflare's staying power as a company — a factor in its own right for a project expected to run for years.

## Alternatives considered

No formal in-project bake-off against other platforms (Vercel, AWS, Fly.io, etc.) took place. The choice was informed by prior experience rather than a fresh comparison for this project specifically.

## Consequences

- The project is tied to Cloudflare's specific primitives and their constraints (e.g. Workers' runtime limits, D1's characteristics as covered in [0002](./0002-sqlite-d1-datastore.md)) — a conscious trade of vendor lock-in against the platform-cohesion and trust benefits above.
- Because the decision predates and sits outside this project's own history, a future contributor evaluating "why Cloudflare" won't find the reasoning in this repo's commit history — this entry is that record.
