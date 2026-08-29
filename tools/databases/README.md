# TaBiThA Databases (`@tabitha/databases`)

This package contains the TBTA-to-TaBiThA ETL migration engine, reference datasets, and canonical SQL snapshot dumps for the TaBiThA translation platform.

---

## 🗄️ Managed Databases

| Database | Primary App | Description |
| :--- | :--- | :--- |
| **Ontology** | `apps/ontology` | Concepts, stems, glosses, grammatical categories, complexity hints, and pending changes |
| **Sources** | `apps/sources` | Source texts (Bible, Community Development, Grammar Intro), verse records, and semantic encodings |
| **Targets** | `apps/targets` | Target language grammars, lexical entries, translation texts, and inflectional forms |
| **Auth** | `apps/ontology` | User profiles, permissions, and OAuth credentials |

---

## 📦 Package Contents

- **`snapshots/`**: Point-in-time SQL snapshot dumps used to seed local and production D1 databases.
- **`migrations/`**: Bun/TypeScript ETL scripts that ingest legacy TBTA SQLite databases and transform them into normalized TaBiThA SQLite schemas.
- **`data/`**: Linguistic data assets feeding the migration pipelines:
  - `data/ideal_texts/`: Reference translation documents (`.docx`, `.SFM`) for target languages (Indonesian, Swahili, etc.).
  - `data/inflections/`: Inflection transformation scripts, source rules, and generated CSV tables.
  - `data/status/`: Historical and current verse translation status CSVs.

---

## 🔄 Running ETL Migrations

All migration commands are run from within this package directory (`cd tools/databases`):

### 1. Full Migration (Orchestrator)

Runs all migrations sequentially against a directory of TBTA database exports, or a zip bundle containing them:

```bash
cd tools/databases
bun run migrate "<path_to_tbta_dbs_dir_or_zip>" YYYY-MM-DD
```

The orchestrator only reprocesses what actually changed: staging skips restaging any individually-delivered source (Swahili, Sample, etc.) that's byte-identical to the last run, and each output (Sources, Targets) is either skipped entirely, incrementally rebuilt from the changed inputs on top of the prior output, or fully rebuilt, depending on what changed.

### 2. Individual Database Migrations

Each migration pipeline can also be run independently:

#### Targets Migration (Multi-Language)

Accepts the base English database and any number of additional target language databases:

```bash
cd tools/databases
bun run migrate:targets \
  databases/English_YYYY-MM-DD.tbta.sqlite \
  databases/Swahili_YYYY-MM-DD.tbta.sqlite \
  databases/Indonesian_YYYY-MM-DD.tbta.sqlite \
  databases/Targets_YYYY-MM-DD.tabitha.sqlite
```

#### Sources Migration (Multi-Source)

Accepts any combination of source text databases:

```bash
cd tools/databases
bun run migrate:sources \
  databases/Bible_YYYY-MM-DD.tbta.sqlite \
  databases/CommunityDevelopmentTexts_YYYY-MM-DD.tbta.sqlite \
  databases/GrammarIntroduction_YYYY-MM-DD.tbta.sqlite \
  databases/MissionsDocuments_YYYY-MM-DD.tbta.sqlite \
  databases/Sources_YYYY-MM-DD.tabitha.sqlite
```

#### Ontology Migration

Populates the exhaustive concept examples (`Complex_Terms`) in an already-staged Ontology database, from a migrated Sources database and its Sources_Complex export:

```bash
cd tools/databases
bun run migrate:ontology \
  raw/Sources_YYYY-MM-DD.tabitha.sqlite \
  raw/Sources_Complex_YYYY-MM-DD.tabitha.sqlite \
  raw/Ontology_9494_YYYY-MM-DD.tabitha.sqlite
```

#### Auth Initialization

Creates default Auth permissions and role structures:

```bash
cd tools/databases
bun run migrate:auth databases/Auth.tabitha.sqlite
```

#### Status Update (Live D1)

Applies the latest verse-status CSVs (see `data/status/README.md` for how to export them) directly
to a live Sources D1 database, independent of any migration run:

```bash
cd tools/databases
bun run migrate:status <d1_database_name> [csv_dir] [YYYY-MM-DD]
```

`csv_dir` defaults to `data/status/`, and the date defaults to today -- both fall back to the latest
available file if an exact match isn't found.
