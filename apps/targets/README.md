# Targets API & Explorer

- **Live URL**: [https://targets.tabitha.bible](https://targets.tabitha.bible)
- **Local Dev URL**: [http://localhost:1382](http://localhost:1382) (Port `1382`)

---

## 🔌 API

### 1. Hierarchical Navigation APIs

- `GET /` — Returns list of available target projects (e.g. `["English"]`).
- `GET /[project]` — Returns list of books for a project (e.g. `/English`).
- `GET /[project]/[book]` — Returns list of chapters for a book (e.g. `/English/John`).
- `GET /[project]/[book]/[chapter]` — Returns list of verses for a chapter (e.g. `/English/John/1`).
- `GET /[project]/[book]/[chapter]/[verse]` — Returns target translation text and audience for a verse (e.g. `/English/John/1/1`).

### 2. Search API

- `GET /[project]/search?q={query}` — Searches target translation text for a given query string.
  - **Query Params:**
    - `q` (`string`, required) — Search terms or pattern.
    - `mode` (`string`, optional) — `text` (default) or `phrase`. Omitting it keeps the original
      target-text behavior, so existing callers are unaffected.
  - **Example:** `/English/search?q=love`

- `GET /[project]/search?mode=phrase&q={phrase}` — Finds the verses whose **scripture** text
  contains the phrase, and reports which of them we hold a semantic encoding for.
  - **Example:** `/English/search?mode=phrase&q=kingdom%20of%20heaven`
  - **Returns:** `{ matches: [{ reference, has_encoding }], complete, notice }`
    - `has_encoding` — whether Sources holds a semantic encoding for that verse, so its structure
      can be fetched from the Sources API.
    - `complete` — `false` when the phrase was common enough that we stopped paging before the end
      of the results; there may be more verses than the ones listed.
    - `notice` — `unsupported_project` when the project has no scripture text to search against
      (currently Tagalog), `unavailable` when the upstream lookup failed, otherwise `null`.

#### Why phrase search returns no verse text

The JSON response deliberately carries **references only, never the matching scripture text**.

Phrase search runs against a licensed Bible from [API.Bible](https://api.bible), and that license
is conditioned on reporting every scripture view through their Fair Use Management System (FUMS).
We can only honor that for pages we render ourselves, where the tracking call fires once the
verses are on screen — we can't fire it on behalf of an API consumer. Returning the text here
would put licensed scripture outside the mechanism the license depends on.

Verse references are plain facts and carry no such restriction, so they're free to consume.

**If you need the verse text**, fetch it yourself from the references we return, under your own
license:

1. Request a key and the Bible you need at [api.bible](https://api.bible) (non-commercial
   agreements are available for non-monetized projects).
2. Fetch each verse via their API, using the `reference` values from the `matches` array.
3. Implement FUMS tracking in whatever renders that text — it's a condition of the license, not an
   optional extra.

The browser-facing search page at the same URL does render the text, because it also fires the
tracking. That difference is intentional, not an inconsistency.

### 3. Lexical & Feature Lookup APIs

- `GET /[project]/lookup/features?category={category}` — Returns source and lexical grammatical features for the target project.
  - **Query Params:** `category` (`string`, optional) — Filter by category (e.g. `Noun`, `Verb`).
  - **Example:** `/English/lookup/features?category=Noun`

- `GET /[project]/lookup/forms?word={word}` — Look up lexical stem matches and inflected forms.
  - **Query Params:** `word` (`string`, required) — Word or pattern (supports wildcards `*`, `#`, `%`).
  - **Example:** `/English/lookup/forms?word=followed`

---

## 💻 Local Development

From the **monorepo root**:

```bash
# Run Targets dev server only
bun run dev:targets

# Or run all apps concurrently
bun run dev
```

Or from within `apps/targets`:

```bash
bun run dev
```

---

## ✅ Testing & Verification

For unified monorepo testing, linting, and build verification commands, see [CONTRIBUTING.md](../../CONTRIBUTING.md) or run `bun run precommit`.
