# 0008: CI change scoping

## Status

Accepted

## Context

`.github/workflows/ci.yml` ran every job — production build, typecheck, ESLint, unit test coverage, and the full Playwright E2E suite across all 5 apps — on every push and pull request, regardless of what changed. A docs-only PR (e.g. updating architecture diagrams) triggered the same expensive pipeline as a change touching every app. The heavy cost sits almost entirely in Stage 2 (`production_build`, `code_quality`, `unit_tests`, `e2e_tests`); Stage 1's static audits (`check:secrets`, `check:philosophies`, `check:cloudflare`, `check:storage`, `check:badges`, `check:md`) are already fast at full-repo scope and weren't worth gating.

The obvious first choice was Turborepo's own `turbo run <task> --affected` (shipped in the installed 2.10.11), which filters to packages affected by the diff against `main` using turbo's real dependency graph. It was rejected after empirical testing: run from a linked git worktree — the setup this repo's contributor workflow requires for every session — it reported packages as affected that a verified `git diff --name-only main...HEAD` showed were untouched. Turbo's debug output confirmed the mechanism: `Worktree detection: ... is_linked=true`, and it shares the primary checkout's `.turbo/cache`. This matches [vercel/turborepo#5217](https://github.com/vercel/turborepo/issues/5217), which traces the root cause to turbo hardcoding the git index path as `<repo_root>/.git/index` — a path that doesn't exist in a linked worktree, where `.git` is a file pointing elsewhere, not a directory. Since every contributor session works from a linked worktree, this isn't an edge case here; it's the common case, and it can misfire in the direction of *under*-testing a change turbo silently doesn't hash correctly, not just over-running.

## Decision

A new script, `scripts/ci/plan.ts`, computes the CI scope itself from a plain `git diff --name-only <base>...HEAD`, reusing this repo's own established base-ref resolution and changed-workspace-package detection (`resolve_diff_base`, `get_changed_workspace_packages`, both in `scripts/audits/check_missing_bin_deps.ts`) rather than turbo's git-diff engine. It classifies the change and decides which of the four heavy jobs run:

- **Docs-only** (every changed file is `*.md`) — skip `production_build`, `code_quality`, `unit_tests`, and `e2e_tests` entirely. Stage 1's audits still run.
- **Force-full** (any changed file is under `.github/workflows/`, `.github/actions/`, or is the root `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, or `turbo.json`) — run everything, unscoped. Workflow/action changes validate the pipeline itself; the rest are inputs a per-package filter can't reason about (a lockfile bump can change what every package actually resolves to).
- **Unrecognized root file** (doesn't map to any known workspace package and isn't docs-only) — fail safe and run everything, rather than silently under-testing an unmodeled case.
- **Scoped** (anything else) — `production_build` and `code_quality` run via `turbo run build|check|check:lint --filter="<pkg>..."` for each directly-changed workspace package, where `<pkg>...` is turbo's *static* package-graph filter (walks `package.json` dependency edges to include dependents) — not the git-diff-based `--affected`/`...[ref]` selectors, so it isn't exposed to the worktree bug above at all. `unit_tests` and `e2e_tests` run in full, unscoped, in this case — see Consequences.

The same script runs identically in CI (`bun scripts/ci/plan.ts`, writing `$GITHUB_OUTPUT` booleans that gate each job's `if:`) and locally (`pnpm ci` runs the scoped plan directly; `pnpm ci:plan` just prints it) — one source of truth for what a given change needs, not two implementations that can drift apart. `pnpm build`/`pnpm check`/`pnpm test:e2e` etc. are untouched and still mean "run everything," so a contributor can always force a full local run through the existing commands.

## Alternatives considered

**`turbo run <task> --affected`.** Rejected — unreliable from a linked worktree (see Context), which is this repo's standard contributor setup, not a fringe case. Revisit once vercel/turborepo#5217 is fixed upstream; `scripts/ci/plan.ts`'s hand-rolled diff and package-name resolution may no longer be needed at all, or could at least delegate the git-diff step to `--affected` again.

**Scoping `unit_tests` per package too**, since `turbo.json` already declares a per-package `test:unit` task. Rejected for now — the actual `test:coverage` script (`scripts/ci/report_coverage.ts`) isn't turbo-orchestrated; it's a custom aggregator with its own hardcoded package list and `GITHUB_STEP_SUMMARY`/regex-parsing logic. Teaching it to accept a filtered subset is a reasonable follow-up, but a separate, riskier change than this one. Coverage reporting is also not the dominant cost in the pipeline (Playwright E2E is), so the payoff is smaller than for build/typecheck.

**Scoping `e2e_tests` per app**, using the same turbo filter as build/quality. Rejected — each app's Playwright config only boots its own dev server (`packages/vite-config/playwright.js`), but apps call each other over REST at runtime (e.g. Editor → Ontology/Sources/Targets/Copilot, per the `CONTRIBUTING.md` architecture diagram). That relationship isn't a `package.json` dependency edge, so neither turbo's graph nor this script's own package-graph walk can see it — a change to Ontology's API could break Editor's E2E suite with no dependency edge connecting them. Given that blind spot, E2E stays binary: full suite on any non-docs change, skipped only when the change is genuinely docs-only.

## Consequences

- A docs-only PR (the case that prompted this) now skips the four expensive jobs entirely instead of running them at full, unscoped cost.
- A change confined to one or a few packages scopes `production_build`/`code_quality` to just those packages and their dependents, via turbo's static graph — real savings on top of turbo's own per-package caching, and without depending on turbo's worktree-broken git-diff engine.
- `unit_tests` and `e2e_tests` get the coarser binary treatment (full run or skip) rather than per-package scoping — see Alternatives above for why, and each is a legitimate follow-up if their cost becomes a bigger pain point than it is today.
- **Revisit trigger:** once vercel/turborepo#5217 is fixed, re-evaluate whether `scripts/ci/plan.ts` can shrink to a thin wrapper around `turbo --affected`, or be removed in favor of it outright.
- **Revisit trigger:** if `test:e2e` ever gains real cross-app dependency modeling (e.g. each app's Playwright suite explicitly declaring which other apps' APIs it calls), per-app E2E scoping becomes safe to reconsider.
- A new workspace package is picked up automatically (`get_changed_workspace_packages` discovers packages by scanning `apps/*`, `packages/*`, `tools/*`, plus `scripts/`, at run time — no list to keep in sync).
