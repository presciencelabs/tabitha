# TaBiThA Database Tools

This package houses database utilities, schemas, and SQLite/D1 database dump workflows for the TaBiThA platform.

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

## 🛠️ Local Database Operations

### 1. Applying Database Dumps Locally
To populate your local D1 SQLite database for an app:

```bash
npx wrangler d1 execute <DB_NAME> --file=<DUMP_FILE>.sql
```

### 2. Backups and R2 Storage
Production snapshots are periodically exported and archived in Cloudflare R2 object storage (`db-backups/`).
