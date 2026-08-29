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
  - Ontology: `3056`
  - Targets: `1382`
  - Sources: `1947`
  - Editor: `1337`
  - Copilot: `9000`
- Validate all workspace configurations with `pnpm check:cloudflare`.

---

## 5. Workers Builds Git Integration (Monorepo Cutover)

Every app deploys to production via Cloudflare Workers Builds (dashboard-configured git integration), not any script or GitHub Actions step in this repo. As of this writing, Cloudflare has no public API for the git-connection step itself, so it's a one-time, per-Worker dashboard action: **Workers & Pages -> Create application -> Import a repository** -> select `presciencelabs/tabitha` (this monorepo -- several apps still have their git integration pointed at their old, now-legacy standalone single-app repos; cutting one over means reconnecting that Worker's integration to this monorepo instead).

Use these settings, established while deploying `apps/www` (2026-08):

- **Project name**: must match the app's `wrangler.jsonc` `"name"` field exactly -- this is what the Worker actually deploys as, and it's what any `routes`/`custom_domain` entries in that same `wrangler.jsonc` are attached to.
- **Build command**: `pnpm run build` -- not `npm run build`. This is a pnpm workspace; npm won't resolve it correctly. Cloudflare's autodetect defaults to `npm`, so this needs manually correcting every time.
- **Deploy command**: `pnpm exec wrangler deploy` -- not `npx wrangler deploy`, per this repo's `pnpm exec` convention (see the root-level guidance on this).
- **Non-production branch deploy command**: `pnpm exec wrangler versions upload` (same `npx` -> `pnpm exec` fix; the command itself, `versions upload` rather than a full deploy, is Cloudflare's correct default for preview builds).
- **Path / root directory**: `apps/<name>` -- without this, the build runs from the repo root and picks up the root `turbo run build` (which builds every app), not the target app's own build script.
- **API token**: reuse one shared token across every app's Workers Builds connection rather than creating a new one per app. Cloudflare's "Workers Scripts: Edit" permission is account-wide -- there is no way to scope it to a single Worker -- so a per-app token provides no real blast-radius reduction, just more credentials to manage. (Whatever token Cloudflare auto-creates inline in this flow is consumed entirely by its own build pipeline and never surfaced to you to copy elsewhere -- that's expected, not a bug.)
- **Build cache** (Settings -> Build, near the bottom): leave it on. `apps/www` has it enabled; match that for every app cut over after it.
- **Build watch paths** (Settings -> Build -> Build watch paths, set right after connecting): Cloudflare defaults a new Workers Build to include paths `[*]` and excludes `[]`, meaning it builds on every push to the repo regardless of which files changed -- in a monorepo this means every app's Workers Build fires on every PR, including ones that only touch an unrelated app or `tools/`. There is no `wrangler.jsonc` field or public API for this setting; it's dashboard-only, entered one path at a time (the UI doesn't accept a space- or comma-delimited paste). Work out the include list from what the app's build script (usually just `vite build`) actually loads: the app's own directory (`apps/<name>/*`), every `@tabitha/*` workspace package it depends on at build time via its `dependencies` and any build-tool packages under `devDependencies` that its `vite.config.ts`/`svelte.config.js` import (e.g. `@tabitha/vite-config`) -- but not dev-only tooling like `@tabitha/eslint-config`/`@tabitha/tsconfig` that only `check`/`lint` scripts use, since those aren't part of the Workers Build pipeline -- plus root `package.json` and `pnpm-lock.yaml` (a pnpm workspace install resolves the whole monorepo, so either can change what the app builds with even without touching `apps/<name>/` itself). `apps/www`'s list, done 2026-08-29, is a worked example: `apps/www/*`, `packages/types/*`, `packages/api-client/*`, `packages/ui/*`, `packages/vite-config/*`, `package.json`, `pnpm-lock.yaml`.

**Custom domain claim failure**: if the target hostname (e.g. a bare apex like `tabitha.bible`) already has DNS records that predate its Workers Custom Domain -- typically leftover `A`/`CNAME` records from before the zone moved to Cloudflare -- the deploy will partially fail with `Hostname '...' already has externally managed DNS records (A, CNAME, etc). Delete them first or try a different hostname.` The Worker itself still deploys fine in this case (check `wrangler deployments list`); only the custom-domain trigger fails. Fix: delete the conflicting records from the zone's DNS tab, then retrigger the build (push a new commit, or trigger a rebuild from the dashboard).

**Zone-level config** (DNS records, redirect rules) is managed separately from all of the above, via `tools/dns` -- see that package's README. It reconciles specific, named records/rules against the live Cloudflare API and is safe to run repeatedly; it deliberately never does a whole-zone listing-and-reconciliation, so it can't touch anything it doesn't explicitly declare.
