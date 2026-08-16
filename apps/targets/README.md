# Targets API & Explorer

- **Live URL**: [https://targets.tabitha.bible](https://targets.tabitha.bible)
- **Local Dev URL**: [http://localhost.tabitha.bible:8788](http://localhost.tabitha.bible:8788) (Port `8788`)

---

## API

### 1. Hierarchical Navigation APIs

- `GET /` — Returns list of available target projects (e.g. `["English"]`).
- `GET /[project]` — Returns list of books for a project (e.g. `/English`).
- `GET /[project]/[book]` — Returns list of chapters for a book (e.g. `/English/John`).
- `GET /[project]/[book]/[chapter]` — Returns list of verses for a chapter (e.g. `/English/John/1`).
- `GET /[project]/[book]/[chapter]/[verse]` — Returns target translation text and audience for a verse (e.g. `/English/John/1/1`).

### 2. Target Text Search API

- `GET /[project]/search?q={query}` — Searches target translation text for a given query string.
  - **Query Params:** `q` (`string`, required) — Search terms or pattern.
  - **Example:** `/English/search?q=love`

### 3. Lexical & Feature Lookup APIs

- `GET /[project]/lookup/features?category={category}` — Returns source and lexical grammatical features for the target project.
  - **Query Params:** `category` (`string`, optional) — Filter by category (e.g. `Noun`, `Verb`).
  - **Example:** `/English/lookup/features?category=Noun`

- `GET /[project]/lookup/forms?word={word}` — Look up lexical stem matches and inflected forms.
  - **Query Params:** `word` (`string`, required) — Word or pattern (supports wildcards `*`, `#`, `%`).
  - **Example:** `/English/lookup/forms?word=followed`

---

## Local Development

From the **monorepo root**:

```bash
# Run Targets dev server only
pnpm dev:targets

# Or run all apps concurrently
pnpm dev
```

Or from within `apps/targets`:

```bash
pnpm dev
```

---

## Testing & Verification

For unified monorepo testing, linting, and build verification commands, see [CONTRIBUTING.md](../../CONTRIBUTING.md) or run `pnpm precommit`.
