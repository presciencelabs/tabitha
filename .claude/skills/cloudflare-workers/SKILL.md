---
name: cloudflare-workers
description: Cloudflare Workers, Cloudflare D1 (SQLite), R2 storage, and Wrangler 4 development skill. TRIGGER when writing, configuring, inspecting, or debugging Cloudflare Worker endpoints, SvelteKit Cloudflare adapter code, D1 database queries, R2 bucket storage, wrangler.jsonc files, or local Miniflare emulation.
metadata:
  version: 4.x
---

# Cloudflare Workers, D1 & R2 Best Practices

Guidelines for developing, deploying, and maintaining Cloudflare Workers, D1 SQLite databases, and R2 storage in the TaBiThA monorepo.

---

## 1. Cloudflare D1 (SQLite at the Edge)

### Query Execution Methods
- **Single row / scalar**: `.first<T>()` or `.first<T>('column_name')`
  ```typescript
  const user = await db.prepare('SELECT * FROM Users WHERE id = ?').bind(user_id).first<DbUser>()
  ```
- **Multiple rows**: `.all<T>()`
  ```typescript
  const { results } = await db.prepare('SELECT * FROM Concepts WHERE stem LIKE ? LIMIT 50').bind(pattern).all<DbConcept>()
  ```
- **Mutation (INSERT/UPDATE/DELETE)**: `.run()`
  ```typescript
  const result = await db.prepare('UPDATE Users SET name = ? WHERE id = ?').bind(name, id).run()
  ```
- **Atomic Batches (Transactions)**: Use `db.batch([...])` to execute multiple queries in a single transaction round-trip:
  ```typescript
  await db.batch([
  	db.prepare('INSERT INTO Logs (msg) VALUES (?)').bind('User updated'),
  	db.prepare('UPDATE Accounts SET status = ? WHERE id = ?').bind('active', account_id)
  ])
  ```

### Session Consistency & Bookmarking (`withSession`)
When performing sequential read-after-write operations across distributed edge nodes, use D1 Sessions to guarantee monotonic read consistency:
```typescript
const session = db.withSession(token)
const result = await session.prepare('SELECT ...').all()
const next_token = session.latestCommitToken
```
Ensure `"placement": { "mode": "off" }` in `wrangler.jsonc` when utilizing session tokens.

---

## 2. Local D1 & Miniflare Emulation

- Local D1 SQLite files are stored by Miniflare at:
  `apps/<app>/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/<sha256(database_id)>.sqlite`
- Use `pnpm db:load` (from `tools/databases/scripts/load_d1.ts`) to stream SQL snapshot dumps directly into Miniflare state in ~1-2 seconds.
- Inspect local database health, tables, and row counts via `pnpm db:status`.

---

## 3. Cloudflare R2 Object Storage

- Use typed R2 bucket bindings from `platform.env`:
  ```typescript
  // Upload object
  await env.R2_db_backups.put(filename, stream, {
  	httpMetadata: { contentType: 'application/x-sqlite3' },
  	customMetadata: { timestamp: String(Date.now()) }
  })

  // Download object
  const object = await env.R2_db_backups.get(filename)
  if (object) {
  	const body = await object.arrayBuffer()
  }
  ```

---

## 4. Wrangler 4 Configuration (`wrangler.jsonc`)

- **JSONC format**: Keep JSON with comments clean and valid.
- **`compatibility_flags`**: Always include `["nodejs_compat"]`.
- **`compatibility_date`**: Keep synchronized with today's date via `pnpm update:safe`.
- **Dedicated Local Dev Ports**:
  - Ontology: `5173`
  - Targets: `8788`
  - Sources: `8789`
  - Editor: `8790`
  - Copilot: `8793`
- Validate all workspace configurations with `pnpm check:cloudflare`.
