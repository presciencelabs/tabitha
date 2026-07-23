# Ontology web app

Available at [https://ontology.tabitha.bible](https://ontology.tabitha.bible)

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

## Local development

`pnpm i`

### Running locally

#### 1. Load the database

Running the following command will load the data locally:

`pnpx wrangler d1 execute <DB_NAME_FROM_WRANGLER_TOML_FILE> --file=<DB_NAME_FROM_WRANGLER_TOML_FILE>.tabitha.sqlite.sql`

> dump files can be found in https://github.com/presciencelabs/tabitha-databases/tree/main/databases

🚨 If wanting to test downloads locally, files will need to be loaded into the local R2.  For example:

`pnpx wrangler r2 object put db-backups/Ontology.9493.2025-08-15.tabitha.sqlite --file ../tabitha-databases/databases/Ontology.9493.2025-08-15.tabitha.sqlite`

#### 2. Configure local auth

Grab relevant OAuth keys from a teammate's `.env.local` file and add them to your local `.env.local` file.

#### 3. Start the app

> `pnpm build` will need to be run the first time only.

```bash
pnpm dev
```

The site should then be available here: [http://localhost.tabitha.bible:5173](http://localhost.tabitha.bible:5173)

### Static analysis

```bash
pnpm check
```

### Testing locally

> `pnpm exec playwright install` will need to be run at least once to get the headless browsers for testing.

```bash
pnpm test:e2e
```

🐛 debugging tests can be done with `pnpm test:e2e:dev`.

### Contributing

Always start your work in a new branch.

Run the following command as a last check before opening a PR

```bash
pnpm precommit
```
