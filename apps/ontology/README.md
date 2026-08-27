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
  - **Example:** `/examples?concept=love-01&part_of_speech=Noun`

---

## 💻 Local Development & Setup

### 1. Configure Local Auth

`apps/ontology/.env.local` is created by the monorepo's onboarding step (`pnpm setup`, from the root), including a generated dev `AUTH_SECRET`. Fill in `GOOGLE_OAUTH_CLIENT_SECRET` there — grab it from the same Google Cloud Console client as `GOOGLE_OAUTH_CLIENT_ID`. The OAuth callback redirects to `http://localhost:3056/auth/callback`.

(If `.env.local` doesn't exist yet, or is missing a var after pulling a `.env` template change, run `pnpm setup:env` from the root to (re)generate it.)

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

To load the local D1 SQLite database dump into Miniflare state:

```bash
pnpm db:load:ontology
```

For complete database tooling and snapshots documentation, see [tools/databases/README.md](../../tools/databases/README.md).

### 4. Complex Terms Synchronization

Complex terms and simplification hints are synchronized from Google Sheets every 12 hours via Cloudflare Cron Triggers, or manually on demand.

- **Manual Sync via UI**: Sign in to the app, navigate to `/protected`, and click **"Sync Complex Terms Now"**.
- **Testing Cron Trigger locally**:

  ```bash
  npx wrangler dev --test-scheduled
  ```

  In a separate terminal:

  ```bash
  curl "http://localhost:8787/__scheduled"
  ```

---

## ✅ Testing & Verification

For unified monorepo testing, linting, and build verification commands, see [CONTRIBUTING.md](../../CONTRIBUTING.md) or run `pnpm precommit`.
