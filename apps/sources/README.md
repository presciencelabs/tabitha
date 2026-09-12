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
  - **Returns:** one result per reference, **in the order they were sent** — `[{ reference, status, has_encoding }]`.
  - `status` — the verse's workflow status (`Not Started`, `Initial Analysis in Progress`, `Initial Analysis Complete`, `Final Review in Progress`, `Ready to Translate`).
  - `has_encoding` — whether the verse actually holds a semantic encoding.

#### `status` and `has_encoding` answer different questions

Use `has_encoding` to decide whether there is a semantic encoding to fetch or display. It is
read from the encoding itself, so it always reflects the data.

`status` looks like it would serve the same purpose, but it will not: the two fields are
populated by **separate migrations from separate sources**. `semantic_encoding` comes from the
TBTA export (`migrate_source_texts.ts`), while `status` is loaded afterwards from the team's
verse-status CSV (`migrate_source_status.ts`), which maps their workflow phases — `Drafter [HE1]`,
`Phase 3 (POLISHING)`, `Complete` — onto the statuses above. Neither migration consults the other,
so nothing keeps them in step. `status` tells you how far along the people are; `has_encoding`
tells you what the database holds.

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
