# Sources API & Explorer

- **Live URL**: [https://sources.tabitha.bible](https://sources.tabitha.bible)
- **Local Dev URL**: [http://localhost:1947](http://localhost:1947) (Port `1947`)

---

## 🔌 API

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
- `GET /lookup/status/[type]` — Returns translation/completion status for every book of a given type.
- `GET /lookup/status/[type]/[id_primary]` — Returns translation/completion status for an entire book.
- `POST /lookup/status` — Batch lookup for verse statuses. Expects a JSON array of reference objects `[{ type, id_primary, id_secondary, id_tertiary }]`.

---

## 💻 Local Development

From the **monorepo root**:

```bash
# Run Sources dev server only
bun run dev:sources

# Or run all apps concurrently
bun run dev
```

Or from within `apps/sources`:

```bash
bun run dev
```

---

## ✅ Testing & Verification

For unified monorepo testing, linting, and build verification commands, see [CONTRIBUTING.md](../../CONTRIBUTING.md) or run `bun run precommit`.
