# Ontology Web App

- **Live URL**: [https://ontology.tabitha.bible](https://ontology.tabitha.bible)
- **Local Dev URL**: [http://localhost:3056](http://localhost:3056) (Port `3056`, `strictPort: true` for OAuth redirects)

---

## 🔌 API

### 1. Concept Search API

- `GET /search?q={query}` — Searches ontology concepts by stem, gloss, or category.
  - **Query Params:**
    - `q` (`string`, required) — Search term.
    - `scope` (`stems` | `glosses` | `all`, optional, default `stems`) — Search scope.
    - `category` (`string`, optional) — Filter by grammatical category.
  - **Example:** `/search?q=love&scope=all`

### 2. Simplification Hints API

- `GET /simplification_hints?complex_term={term}` — Retrieves simplification hints for complex terms.
  - **Query Params:**
    - `complex_term` (`string`, required) — Complex term to query.
    - `category` (`string`, optional) — Grammatical category.
  - **Example:** `/simplification_hints?complex_term=disciple`

### 3. Concept Usage Examples API

- `GET /examples?concept={concept}&part_of_speech={pos}` — Retrieves usage examples for an ontology concept along with current translation status.
  - **Query Params:**
    - `concept` (`string`, required) — Concept stem-sense identifier.
    - `part_of_speech` (`string`, required) — Part of speech (e.g. `Noun`, `Verb`).
    - `source` (`string`, optional) — Source reference filter.
  - **Example:** `/examples?concept=love-B&part_of_speech=Noun`

---

## 💻 Local Development & Setup

### 1. Configure Local Auth

`apps/ontology/.env.local` is created by the monorepo's onboarding step (`bun run setup`, from the root), including a generated dev `AUTH_SECRET`. Fill in `GOOGLE_OAUTH_CLIENT_SECRET` there — grab it from the same Google Cloud Console client as `GOOGLE_OAUTH_CLIENT_ID`. The OAuth callback redirects to `http://localhost:3056/auth/callback`.

(If `.env.local` doesn't exist yet, or is missing a var after pulling a `.env` template change, run `bun run setup:env` from the root to (re)generate it.)

### 2. Running Locally

From the **monorepo root**:

```bash
# Run Ontology dev server only
bun run dev:ontology

# Or run all apps concurrently
bun run dev
```

Or from within `apps/ontology`:

```bash
bun run dev
```

### 3. Loading Local Database

To load the local D1 SQLite database dump into Miniflare state:

```bash
bun run db:load:ontology
```

For complete database tooling and snapshots documentation, see [tools/databases/README.md](../../tools/databases/README.md).

### 4. Complex Terms Synchronization

Complex terms and simplification hints are synchronized from Google Sheets every 12 hours via Cloudflare Cron Triggers, or manually on demand.

- **Manual Sync via UI**: Sign in to the app, navigate to `/protected`, and click **"Sync Complex Terms Now"**.
- **Testing Cron Trigger locally**:

  ```bash
  bunx wrangler dev --test-scheduled
  ```

  In a separate terminal:

  ```bash
  curl "http://localhost:8787/__scheduled"
  ```

### 5. Semantic Search Index

The **Semantic Search** scope finds related concepts by comparing embeddings (vectors describing each concept's meaning) stored in a Cloudflare Vectorize index, `ontology-concepts`, bound as `VECTORIZE_Concepts`. See [ADR 0016](../../docs/decisions/0016-semantic-search-via-vectorize-embeddings.md) for why.

The index holds derived data only. It is rebuilt from D1 by the same 12-hour cron as the complex terms (the embedding sync runs right after them), so it never needs a manual rebuild. Each run re-embeds only concepts whose gloss or how-to hint changed. The **"Sync Complex Terms Now"** button doesn't touch embeddings.

- **One-time setup** (per Cloudflare account; production and preview share the index). Create the index before the first deploy that binds it, or the deploy fails:

  ```bash
  cd apps/ontology && bunx wrangler vectorize create ontology-concepts --dimensions=768 --metric=cosine
  ```

  The dimensions must match `EMBEDDING_DIMENSIONS` in `@tabitha/ai`. The next cron run then fills the index from scratch, which takes about 3,800 embedding calls. Deleting and recreating the index (for example, after changing the dimensions) just triggers another full fill.

- **Before the first fill**, confirm the AI Gateway serves embeddings:

  ```bash
  cd tools/gateway && bun run verify:embedding
  ```

- **Local development**: Vectorize has no local simulation, so a semantic search locally shows only the normal stem results and logs an error that the binding "needs to be run remotely". That's expected.

---

## ✅ Testing & Verification

For unified monorepo testing, linting, and build verification commands, see [CONTRIBUTING.md](../../CONTRIBUTING.md) or run `bun run precommit`.
