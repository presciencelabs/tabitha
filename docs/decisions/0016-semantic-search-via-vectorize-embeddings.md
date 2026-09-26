# 0016: Semantic search via Vectorize embeddings instead of a whole-ontology prompt

## Status

Accepted (2026-09-25). How the sync is triggered was amended by [0018](./0018-scheduled-work-via-scheduler-worker.md): the ontology Worker's own cron, described below, was never actually called.

## Context

**Every uncached semantic search in `apps/ontology` sent about 74,000 input tokens to Gemini, just to get back at most 10 concept keys.** `find_related_concepts` (`apps/ontology/src/lib/server/semantic_search.ts`) put the whole filtered ontology (about 3,800 of about 5,800 concepts, each as a key plus its gloss) into the prompt next to the one search term, and asked `gemini-3.5-flash` which concepts were related. The code's own comment measured the input at roughly 73,800 tokens. That is the price of *one search*, not of a session or a data load. It is paid again for every search term the AI Gateway's one-week response cache hasn't seen word for word.

Nearly every other problem with the feature follows from that one number:

- **Cost scales with the ontology, not with the question.** The search term is a few tokens, and the other ~74k are the same concept list resent every time. Every concept added to the ontology makes *every future search* more expensive.
- **The next planned feature makes it worse.** Issue #78 ("Show related LDV entries in the search") wants Longman Defining Vocabulary headwords that aren't yet in the ontology to show up as related results. Under the prompt design, each of those words is more text in every search's prompt.
- **Latency.** The model has to read ~74k tokens before it writes its first token of output.
- **It's reachable without signing in.** The root page sits outside `/protected`, and the only throttle is the shared per-IP rate limit of 60 requests per minute. An expensive call on an open page is a cost exposure, not just a performance issue.
- **The filters exist to save tokens, and one of them fights caching.** Whole numbers, most proper names, and dates were excluded to shrink the prompt. The filter that drops the concept equal to the search term changes the prompt partway through the list, which defeats Gemini's implicit prefix caching (a TODO in the code noted this).
- **Two full-table D1 reads per search** (`Concepts` and `Complex_Terms`), only to build the prompt and then resolve the model's answer.

The design also limits quality, which is separate from token count. A model reading a 3,800-item list can quietly skip concepts in the middle of a long context. It returns a list with no scores, so results can't be ranked, thresholded, or extended. And any edit anywhere in the concept list changes the prompt, which can shift the answers to unrelated searches.

## Decision

Replace the prompt with **embeddings stored in Cloudflare Vectorize**. The expensive "understand every concept" work moves out of the search request and into a background sync that runs once per changed gloss.

- **Embed each searchable concept ahead of time.** The document text is the concept's stem (as the title) plus its gloss with parenthesized classifiers removed. For concepts not yet in the ontology, it is the stem plus the first how-to hint. The same exclusions as before apply (whole numbers, proper names, dates, `DELETE`). Model: `gemini-embedding-2` at 768 dimensions, through the existing AI Gateway to Vertex (ADR 0007) via a new `create_embedding_client` in `@tabitha/ai`. Vectors go into one Vectorize index, `ontology-concepts` (cosine), which the production and preview Workers share the same way they already share `DB_Ontology`.
- **Per search, embed only the search term** (a few tokens, cached at the gateway for a week like before). Query the nearest 11 vectors, drop the exact-stem match, and resolve the remaining ≤10 with one keyed D1 lookup per table (`get_concepts_by_keys`) instead of two full-table reads.
- **Keep the index in sync from the existing 12-hour cron** (now run through the `scheduler` Worker, per [0018](./0018-scheduled-work-via-scheduler-worker.md)), right after the complex-terms sync, since how-to hints feed the embedded text. Each vector's metadata stores a SHA-256 hash of exactly what was embedded, model name included. A run re-embeds only concepts whose hash changed and deletes vectors for concepts that became unsearchable. The first run after deploy is the backfill. An approved concept edit can take up to 12 hours to show up in semantic search; that lag was accepted deliberately.

| Per search | Before (prompt) | After (embeddings) |
| --- | --- | --- |
| Model input | ~74,000 tokens | the search term only (a few tokens) |
| Grows with the ontology (and #78's LDV words) | yes, linearly | no |
| D1 reads | 2 full-table reads | 2 keyed lookups of ≤10 rows |
| Result ranking | unscored list | similarity-ordered, scored |

## Alternatives considered

- **Keep the prompt and cache harder** (explicit Vertex context caching of the concept list). This reduces the cost of the ~74k tokens without removing them, and it still grows with every concept added, including #78's. It treats the symptom, not the cause.
- **Workers AI for the embedding model.** Simpler: a binding with no gateway token. It was rejected because it adds a second inference vendor outside the AI Gateway's observability and outside ADR 0007's single-route consolidation. Vertex through the gateway keeps inference with Google.
- **Store the per-concept text hashes in a new D1 table.** Schema belongs to the `tools/databases/migrations` pipeline, so this would have added a table of derived data to every ontology snapshot plus a one-off manual change to the live database. Keeping the hash on the vector itself leaves the index as the only state.
- **Set `"remote": true` on the Vectorize binding** so local dev queries the real index. Every `vite dev` and CI's e2e run would then need Cloudflare credentials. Instead, local dev gets no semantic results (see Consequences).
- **Add an LLM re-rank of the top ~30 candidates now.** Deferred. It costs a few hundred tokens rather than ~74k, and stays available if the quality comparison below shows embeddings alone miss too much.

## Consequences

- **The per-search token bill stops depending on the ontology.** That is the outcome this decision exists for, and it is also what makes #78 practical: LDV headwords become more vectors in the same index (tagged as not in the ontology) rather than more prompt.
- **Quality trade-off.** Embeddings measure similarity; they don't reason. Leaps the prompt could make, such as "noon" → `12PM` or "tenth" → `.1`, may rank low, and antonyms such as "hot" and "cold" often sit close together (arguably fine for "related"). Before relying on this in production, compare old and new results on a handful of real search terms. The LLM re-rank above is the fallback if needed.
- **New Cloudflare primitive.** ADR 0014 listed Vectorize as unused. The lock-in it adds is shallow: the index is derived data, fully rebuildable from D1 by running the same sync, so moving to another vector store means pointing that sync at a new client. Consistent with ADR 0014, there is no abstraction layer over Vectorize. The small `ConceptIndex` type in `concept_embeddings.ts` only bridges a typing gap: `wrangler types` still emits the legacy `VectorizeIndex` type.
- **Local dev and e2e have no semantic results.** Vectorize has no local simulation. `find_related_concepts` fails soft to an empty list, the same as an embedding failure, and the e2e spec now only checks that the page degrades cleanly. Unit tests cover ranking and filtering against a fake index.
- **One-time setup before the first deploy.** Create the index with `bunx wrangler vectorize create ontology-concepts --dimensions=768 --metric=cosine`. A deploy that binds a missing index fails. Run `tools/gateway`'s `bun run verify:embedding` once to confirm the gateway serves `:embedContent`. The backfill (about 3,800 gateway calls, well within a Worker's 10,000-subrequest limit) then happens on the next 00:00/12:00 UTC scheduled run, or immediately by calling the sync endpoint by hand (see `apps/scheduler/README.md`).
- **Orphaned vectors are possible but harmless.** A how-to hint removed from the spreadsheet, or keys that disappear when a new ontology database is loaded, leave vectors nothing deletes. Search resolves every match against current D1 rows, so an orphan can only take up one of the 11 slots. If orphans start to matter, a periodic full reconcile using Vectorize's `list-vectors` API would clean them up.
- **Revisit** if the quality comparison falls short (add the re-rank), if the 12-hour lag after approved edits becomes a real complaint (re-embed on approval), or once #78 adds non-ontology entries to the index.
