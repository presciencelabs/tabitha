# TaBiThA Database Tools

This package houses database utilities, schemas, snapshots, and SQLite/D1 database dump workflows for the TaBiThA platform.

---

## 🗄️ Managed Databases

The TaBiThA platform utilizes Cloudflare D1 (SQLite at the edge) for each core service:

| Database | Primary Service | Contents |
| --- | --- | --- |
| **Ontology** | `apps/ontology` | Concepts, stems, glosses, grammatical categories, complexity hints, and pending changes |
| **Sources** | `apps/sources` | Source texts (e.g. Bible), verse records, parsed semantic encodings, and feature codes |
| **Targets** | `apps/targets` | Target language grammars, lexical entries, translation texts, and inflectional forms |
| **Auth** | `apps/ontology` | User profiles, sessions, and OAuth authentication credentials |

---

## 📸 Snapshots, Migrations & Data

- SQL Snapshot dumps: `tools/databases/snapshots/`
- TBTA -> TaBiThA ETL migration pipeline: `tools/databases/migrations/`
- Reference datasets, inflections & status CSVs: `tools/databases/data/`
- Runtime DB loaders & inspectors: `scripts/dx/db_load.ts`, `scripts/dx/db_status.ts`

---

## 🛠️ Automated Database Loading (Bun)

From the monorepo root:

```bash
# Load all databases into local Wrangler environments
pnpm db:load

# Load a specific app's databases
pnpm db:load:ontology
pnpm db:load:sources
pnpm db:load:targets

# Inspect local database health, tables, row counts, and file sizes
pnpm db:status
```

---

## 🚀 One-Command Developer Setup

```bash
# Complete developer bootstrap (environment scaffolding + DB loading + verification)
pnpm setup

# Scaffold local .env.local files only
pnpm setup:env
```
