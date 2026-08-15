# TaBiThA Database Tools

This package houses database utilities, schemas, snapshots, and SQLite/D1 database dump workflows for the TaBiThA platform.

---

## 🗄️ Managed Databases

The TaBiThA platform utilizes Cloudflare D1 (SQLite at the edge) for each core service:

| Database | Primary Service | Contents |
|---|---|---|
| **Ontology** | `apps/ontology` | Concepts, stems, glosses, grammatical categories, complexity hints, and pending changes |
| **Sources** | `apps/sources` | Source texts (e.g. Bible), verse records, parsed semantic encodings, and feature codes |
| **Targets** | `apps/targets` | Target language grammars, lexical entries, translation texts, and inflectional forms |
| **Auth** | `apps/ontology` | User profiles, sessions, and OAuth authentication credentials |

---

## 📸 Snapshots Directory

Point-in-time SQL snapshot dumps are stored in `tools/databases/snapshots/`:

- `Auth.tabitha.sqlite.sql`
- `Ontology_9494_YYYY-MM-DD.tabitha.sqlite.sql`
- `Sources_YYYY-MM-DD.tabitha.sqlite.sql`
- `Targets_YYYY-MM-DD.tabitha.sqlite.sql`

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
```

---

## 🚀 One-Command Developer Setup

```bash
# Complete developer bootstrap (environment scaffolding + DB loading + verification)
pnpm setup

# Scaffold local .env.local files only
pnpm setup:env
```
