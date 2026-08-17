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

Runs all migrations sequentially against a directory of TBTA database exports:

```bash
cd tools/databases
bun run migrate "<path_to_tbta_dbs_dir>" YYYY-MM-DD
```

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
  databases/Sources_YYYY-MM-DD.tabitha.sqlite
```

#### Ontology Migration

Ingests legacy Ontology and Sample databases and generates exhaustive concept examples:

```bash
cd tools/databases
bun run migrate:ontology \
  databases/Ontology_YYYY-MM-DD.tbta.sqlite \
  databases/Sample_YYYY-MM-DD.tbta.sqlite \
  databases/Ontology_9494_YYYY-MM-DD.tabitha.sqlite
```

#### Auth Initialization

Creates default Auth permissions and role structures:

```bash
cd tools/databases
bun run migrate:auth databases/Auth.tabitha.sqlite
```
