# Sources API

Available at [https://sources.tabitha.bible](https://sources.tabitha.bible)

## API

### 1. Hierarchical Navigation APIs

- `GET /` — Returns list of available source types (e.g. `["Bible"]`).
- `GET /[type]` — Returns primary IDs (books) for a given type (e.g. `/Bible`).
- `GET /[type]/[id_primary]` — Returns secondary IDs (chapters) for a primary ID (e.g. `/Bible/Acts`).
- `GET /[type]/[id_primary]/[id_secondary]` — Returns tertiary IDs (verses) for a secondary ID (e.g. `/Bible/Acts/10`).
- `GET /[type]/[id_primary]/[id_secondary]/[id_tertiary]` — Returns full source data and parsed semantic encoding for a verse (e.g. `/Bible/Acts/10/9`).

### 2. Simplified Encoding API

- `GET /[type]/[id_primary]/[id_secondary]/[id_tertiary]/simple-json` — Returns simplified, flattened JSON for a verse's semantic encoding.
  - **Query Params:** `glosses` (`true` | `false`) — Includes concept glosses from Ontology API.
  - **Example:** `/Bible/Acts/10/9/simple-json?glosses=true`

### 3. Reference Search & Redirect API

- `GET /search?ref={reference}` — Parses a reference string (e.g. `Acts 10:9`) and redirects (`303`) to the canonical resource path.

### 4. Encoding Analysis & Parsing APIs

- `GET /analyze?text={encoding}` — Analyzes raw text using the Editor API analyzer and resolves feature codes against the database.
- `GET /raw-to-json?raw_encoding={encoding}&simple={true|false}&project={project}` — Converts raw TBTA semantic or target encoding into JSON.

### 5. Lookups & Status APIs

- `GET /lookup/features?category={category}` — Returns grammatical features, feature codes, values, and examples.
- `GET /lookup/status/[type]/[id_primary]` — Returns translation/completion status for an entire book.
- `POST /lookup/status` — Batch lookup for verse statuses. Expects a JSON array of reference objects `[{ type, id_primary, id_secondary, id_tertiary }]`.

## Local development

`pnpm i`

### Running locally

#### 1. Load the database

Dump files can be found under the 'databases' folder within the databases repo: https://github.com/presciencelabs/tabitha-databases/tree/main/databases 

Running the following command will load the data locally:

`pnpm wrangler d1 execute <DB_NAME_FROM_WRANGLER_JSONC_FILE> --file <DB_NAME_FROM_WRANGLER_JSONC_FILE>.tabitha.sqlite.sql`

#### 2. Start the app

> `pnpm build` will need to be run the first time only.

```bash
pnpm dev
```

The site should then be available here: [http://localhost.tabitha.bible:8789](http://localhost.tabitha.bible:8789)

## Static analysis & Testing

### Static analysis

```bash
pnpm check
```

### Unit testing (Vitest)

Runs pure logic tests for reference parsing, feature decoding, semantic encoding, and API lookups:

```bash
pnpm test:unit
```

### End-to-end testing (Playwright)

> `pnpm exec playwright install chromium` will need to be run at least once to get headless browsers for testing.

```bash
pnpm test:e2e
```

🐛 Debugging E2E tests interactively:

```bash
pnpm test:e2e:dev
```

## Contributing

Always start your work in a new branch.

Run the following command as a last check before opening a PR

```bash
pnpm precommit
```
