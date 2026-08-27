# 0011: Windows `db:load` Node fallback

## Status

Accepted

## Context

`pnpm db:load:ontology` (and `:sources`/`:targets`) runs `bun scripts/dx/db_load.ts <app>`. That script's `resolve_workerd_hashes()` calls Wrangler's `getPlatformProxy()`, which boots Miniflare, which spawns the `workerd` binary via `child_process.spawn` with piped stdio.

On Windows, this fails with `ENOENT: Failed to connect` (`errno: 2`, `syscall: "connect"`), thrown from inside Bun's own `node:child_process` shim (`#createStdioObject`/`#getBunSpawnIo`). Because `db_load.ts` runs under Bun rather than Node, Bun's Windows implementation of stdio piping for spawned child processes handles the call — and that implementation is broken. This matches a long-standing, unresolved upstream Bun issue ([oven-sh/bun#13543](https://github.com/oven-sh/bun/issues/13543), closed "not planned"), and Wrangler-under-Bun-on-Windows has its own dedicated crash report too ([oven-sh/bun#10464](https://github.com/oven-sh/bun/issues/10464)). Neither has an upstream fix as of this writing.

The rest of the monorepo's dev tooling isn't exposed to this: `pnpm dev` runs via `turbo run dev` → Node/Vite, not Bun, and `db_load.ts` is the only `scripts/dx/` file that calls `getPlatformProxy()`. So this is a narrow, contained problem, not a sign that Bun-as-script-runner needs to be reconsidered generally.

## Decision

The `resolve_workerd_hashes()` logic was extracted out of `db_load.ts` into its own plain-JavaScript module, `scripts/dx/resolve_workerd_hashes.mjs` (no TypeScript syntax, so it needs no build step or type-stripping flag to run under a plain `node` invocation — unlike the rest of `scripts/`, which relies on Bun's native TS execution). `db_load.ts` now branches on `os.platform()`:

- **Non-Windows:** imports and calls the `.mjs` module in-process, exactly as before (Bun can import plain `.mjs` directly).
- **Windows:** shells out to the system `node` binary (`execSync('node "<helper>"', { input, encoding: 'utf-8' })`), passing `{ app_dir, wrangler_path, entries, d1_state_dir }` as JSON on stdin and reading the resolved hash map back as JSON on stdout.

There is a single source of truth for the resolution logic either way — Windows doesn't get a forked copy that can drift from the Bun path, only a different caller.

`getPlatformProxy()` itself writes informational lines (e.g. `Using secrets defined in apps\ontology\.env`) straight to stdout, which lands in the same captured buffer as the helper's JSON result. `resolve_workerd_hashes` on the Windows branch picks the JSON back out by taking the first captured line that starts with `{`, rather than assuming the whole buffer is parseable JSON.

A second, unrelated Windows incompatibility surfaced once this got far enough to run: `import_sqlite_snapshot()` piped SQL into `sqlite3` via a POSIX-only shell pipeline (`(echo ...; cat ...; echo ...) | sqlite3 ...`), which `cmd.exe` (execSync's default shell on Windows) can't parse. Fixed the same way — build the SQL in Node (`readFileSync` + string concatenation) and feed it to `sqlite3` via `execSync`'s `input` option instead of shell pipe syntax, which needs no shell-specific behavior at all.

## Alternatives considered

**Document as a known Windows caveat, recommend WSL2.** Sidesteps the bug entirely (Bun-on-Linux isn't affected), and is the cheapest option, but leaves native Windows dev broken for anyone who can't or doesn't want to use WSL2.

**Platform-detect the whole script's runner** (`node` on win32, `bun` elsewhere), instead of just the one function. Rejected — `db_load.ts` and its sibling `scripts/dx/` files rely on Bun's native TypeScript execution and `import.meta.main` throughout; running the whole file under Node would need `--experimental-strip-types` (or a loader) to hold up across every import in the chain, including `packages/types/src/index.ts`, which isn't verified and is a much larger surface than the one function that actually needs Node.

**Do nothing, track upstream.** Rejected as the sole answer — the upstream issues are already long-standing and one is closed "not planned," so there's no clear signal a fix is coming. Worth revisiting if that changes (see Consequences).

## Consequences

- `db:load`, `db:load:ontology`, `db:load:sources`, and `db:load:targets` now work on native Windows, not just WSL2/macOS/Linux.
- `resolve_workerd_hashes.mjs` must stay free of TypeScript syntax and Bun-only APIs, since it's the one piece of `scripts/dx/` that has to run under a plain `node` binary. A future change that reintroduces a Bun-specific dependency there would silently break the Windows path only.
- Windows now has a hard, explicit dependency on `node` being present on `PATH` for this one code path — already true in practice, since Node.js is a listed prerequisite in `CONTRIBUTING.md`/`README.md`.
- **Revisit trigger:** if `oven-sh/bun#13543` (or the underlying Windows stdio-piping gap) is ever fixed upstream, the Windows branch in `resolve_workerd_hashes` can be removed and Bun used unconditionally again.
