# Targets API

Available at [https://targets.tabitha.bible](https://targets.tabitha.bible)

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

## Local development

`pnpm i`

### Running locally

#### 1. Load the database

Dump files can be found under the "Artifacts" section of the workflow runs of the databases repo:  https://github.com/presciencelabs/tabitha-databases/actions/workflows/deploy.yml

Running the following command will load the data locally:

`wrangler d1 execute <DB_NAME_FROM_WRANGLER_TOML_FILE> --file=<DB_NAME_FROM_WRANGLER_TOML_FILE>.tabitha.sqlite.sql`

#### 2. Start the app

> `pnpm build` will need to be run the first time only.

```bash
pnpm dev
```

The site should then be available here: [http://localhost.tabitha.bible:8788](http://localhost.tabitha.bible:8788)

## Static analysis

```bash
pnpm check
```
### Testing locally

> `pnpm exec playwright install` will need to be run at least once to get the headless browsers for testing.

```bash
pnpm test:e2e
```

🐛 debugging tests can be done with `pnpm test:e2e:dev`.

## Contributing

Always start your work in a new branch.

Run the following command as a last check before opening a PR

```bash
pnpm precommit
```
