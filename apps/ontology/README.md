# Ontology Web App

- **Live URL**: [https://ontology.tabitha.bible](https://ontology.tabitha.bible)
- **Local Dev URL**: [http://localhost.tabitha.bible:5173](http://localhost.tabitha.bible:5173) (Port `5173`, `strictPort: true` for OAuth redirects)

---

## API

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
  - **Example:** `/examples?concept=love-01&part_of_speech=Noun`

---

## Local Development & Setup

### 1. Configure Local Auth

Grab relevant Google / GitHub OAuth credentials from `.env` and add them to your local `.env.local` file. The OAuth callback redirects to `http://localhost.tabitha.bible:5173/auth/callback`.

### 2. Running Locally

From the **monorepo root**:

```bash
# Run Ontology dev server only
pnpm dev:ontology

# Or run all apps concurrently
pnpm dev
```

Or from within `apps/ontology`:

```bash
pnpm dev
```

### 3. Loading Local Database

To load a local D1 SQLite database dump:

```bash
npx wrangler d1 execute <DB_NAME> --file=<DUMP_FILE>.sql
```

### 4. Complex Terms Synchronization

Complex terms and simplification hints are synchronized from Google Sheets every 12 hours via Cloudflare Cron Triggers, or manually on demand.

- **Manual Sync via UI**: Sign in to the app, navigate to `/protected`, and click **"Sync Complex Terms Now"**.
- **Testing Cron Trigger locally**:

  ```bash
  npx wrangler dev --test-scheduled
  ```

  In a separate terminal:

  ```bash
  curl "http://localhost.tabitha.bible:8787/__scheduled"
  ```

---

## Testing & Verification

```bash
# Run typechecking and linting
pnpm check

# Run unit tests
pnpm test:unit

# Run end-to-end tests
pnpm test:e2e

# Build for Cloudflare
pnpm build
```
