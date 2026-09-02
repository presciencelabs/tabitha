# 0013: Replace pnpm with Bun as the package manager

## Status

Accepted

## Context

The monorepo already used Bun as its script runtime (every `scripts/{dx,ci,audits}` file, D1 tooling, etc. ran via `bun <file>.ts`), but dependency management was still pnpm — a deliberately narrower cut than what was possible, parked as its own follow-up when Bun was first adopted to speed up the CI build step. That earlier decision flagged one specific risk to resolve before revisiting: whether Bun's own package-manager features (`trustedDependencies`, `overrides`) could fully replicate pnpm's `onlyBuiltDependencies`/`allowBuilds`/`overrides` behavior in `pnpm-workspace.yaml`, since those gate which packages' install scripts are allowed to run (`@google/genai`, `esbuild`, `protobufjs`, `workerd`) and pin a transitive dependency version (`rolldown@1.2.3`).

That question resolved cleanly: Bun's `trustedDependencies` field is a strict allowlist that *replaces* Bun's own built-in trusted-package defaults rather than extending them, so declaring the same four packages there produces an equivalent allowlist with no risk of an unlisted package (`tesseract.js`, `unrs-resolver`) sneaking through via Bun's own defaults. The one version override in use (`rolldown`) is a flat, single-package pin — well within what Bun's `overrides` field supports (it only breaks down on multi-level nesting like `a>b>c`, unused here).

## Decision

Replace pnpm with Bun's own package manager across the whole monorepo:

- `pnpm-workspace.yaml` removed; its `packages` globs became package.json's own `workspaces` field, `onlyBuiltDependencies`/`allowBuilds` became `trustedDependencies`, and `overrides` moved into package.json's `overrides` field (same shape pnpm used).
- `pnpm-lock.yaml` replaced by `bun.lock` (Bun's default text-based lockfile as of Bun 1.2+, not the older binary `bun.lockb`).
- Every `pnpm <script>` invocation across root/app/package `package.json` scripts, CI (`.github/workflows/ci.yml`, `.github/actions/setup-workspace/action.yml`), `.vscode/tasks.json`, and every doc/skill/README became `bun run <script>`; `pnpm exec <bin>` became `bunx <bin>`; `pnpm --filter <pkg> <script>` became `bun --filter <pkg> <script>` (Bun's `--filter` runs a package.json script scoped to matching workspace packages, same as pnpm's, but doesn't support pnpm's `--filter <pkg> exec <arbitrary command>` form — the two call sites that used that, in `scripts/ci/report_coverage.ts` and `scripts/dx/update_safe.ts`, were rewritten as `cd <pkg-dir> && bunx <bin>` instead).
- `.npmrc` (`engine-strict=true`, `resolution-mode=highest`) was dropped rather than translated: neither has a Bun equivalent, but both were already inert — no `package.json` in the repo declares an `engines` field for `engine-strict` to enforce, and `resolution-mode` is a pnpm-specific resolver-algorithm choice with no analogous setting to carry over.
- `check_readme_badges.ts`'s pnpm-version badge became a Bun-version badge (reads the same `packageManager` field, now `bun@<version>`), and `scripts/ci/plan.ts`'s force-full-CI-run trigger list swapped `pnpm-lock.yaml`/`pnpm-workspace.yaml` for `bun.lock`.
- **Node.js was narrowed from a blanket prerequisite to Windows-only.** With pnpm gone, every remaining local workflow was verified end-to-end (typecheck, lint, unit tests, all 6 apps' production builds, Playwright, and Wrangler's `getPlatformProxy()`/`workerd` spawn used by `db:load`) with no `node` binary reachable on `PATH` at all, confirming Node was never actually needed outside the one documented exception: [ADR 0011](0011-windows-db-load-node-fallback.md)'s Windows-only `db_load.ts` fallback, which shells out to a real `node` binary as a workaround for an unresolved Bun-on-Windows stdio bug. CI's shared `setup-workspace` action no longer installs Node.js for every job; only `windows_dx_smoke` does. `doctor.ts`'s Node.js check is now a hard `FAIL` only on `win32`, a `WARN` elsewhere. `CONTRIBUTING.md`/`README.md` prerequisites now list Node.js as Windows-only.

A pre-existing, unrelated bug surfaced during verification and was fixed as part of this change: `packages/ui/src/themes/theme.css` uses the `@tailwindcss/typography` Tailwind plugin, but that package was never declared as a dependency of `packages/ui` anywhere — it only resolved under pnpm through a symlink-walk quirk specific to pnpm's node_modules layout (there was even a code comment about it, for an unrelated `@source` directive in the same file). Bun's isolated linker doesn't replicate that quirk, so the build failed outright until `@tailwindcss/typography` was added to `packages/ui`'s `peerDependencies` (matching how `daisyui`/`tailwindcss` were already declared there) — the correct fix regardless of package manager, not a Bun-specific workaround.

## Alternatives considered

**Stay on pnpm, keep Bun scoped to script execution only.** The status quo prior to this decision. Rejected now that the specific blocking risk (config-translation fidelity) was resolved — running two JS toolchains (pnpm for installs, Bun for execution) when one covers both is unnecessary surface area.

**Migrate the package manager but leave Node.js listed as a required prerequisite.** Simpler to write up, but false: verification showed nothing outside the Windows `db_load.ts` path needs it, and continuing to ask every contributor to install a tool the repo doesn't actually use would be exactly the kind of unnecessary setup friction this migration was meant to reduce.

## Consequences

- One toolchain (Bun) instead of two (pnpm + Bun) for dependency management and script execution.
- Most contributors (macOS/Linux) no longer need Node.js installed at all; Windows contributors still do, solely for the `db:load` fallback in ADR 0011.
- **Manual follow-up required, not captured by this PR:** every app's Cloudflare Workers Builds dashboard settings (Build command, Deploy command, Non-production branch deploy command — see `.claude/skills/cloudflare-workers/SKILL.md` §5) are dashboard-only config, not git-tracked, and still say `pnpm run build` / `pnpm exec wrangler ...`. Each of the 6 apps needs its dashboard settings updated before its next production deploy, or that deploy breaks (no `pnpm`/`pnpm-lock.yaml` in the repo anymore) — and it's not a same-shape swap: Cloudflare's automatic dependency-install step doesn't reliably detect `bun.lock` (Bun's text-based lockfile), so the Build command needs a `SKIP_DEPENDENCY_INSTALL=true` Build Variable plus an explicit `bun install &&` prefix, not just `pnpm run build` → `bun run build`.
- Losing `.npmrc`'s `engine-strict`/`resolution-mode` is a no-op today (both were already unused), but there's no Bun equivalent if either becomes relevant later — worth remembering if an `engines` field is ever added to a `package.json` in this repo, since Bun won't enforce it the way pnpm/npm would have.
- **Revisit trigger:** if `oven-sh/bun#13543` (the underlying Bun-on-Windows stdio bug) is ever fixed upstream, ADR 0011's Windows branch — and the Windows-only Node.js requirement this decision documents — can both be removed.
