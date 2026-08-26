# 0009: Vite+ evaluation

## Status

Accepted

## Context

Evaluated 2026-08-26. "Vite+" is a distinct product from VoidZero (now part of Cloudflare) — a `vp` CLI (`vite-plus` on npm, v0.3.0 at evaluation time) that bundles Vite, Vitest, Oxlint, Oxfmt, Rolldown, and tsdown behind one entry point, including its own workspace task runner (`vp run`) aimed at replacing tools like Turborepo. It's separate from plain Vite — this repo was already on Vite 8.2.0 (Rolldown-powered) across every app before this evaluation started, so any win here would have to come from `vp`'s orchestration/tooling layer, not the bundler itself.

Baseline, this repo, 5 apps, measured via `pnpm turbo run build --force` / `pnpm turbo run check:lint --force`:

- Cold build: **11.0s** (turbo-reported), warm/cached: **47ms**.
- Cold lint (`eslint .` across 13 packages): **9.8s** (turbo-reported).

## Decision

Not adopting Vite+ (`vp`) or its component tools (Oxlint, Oxfmt) at this time. `turbo.json`, root scripts, and CI are untouched.

Tested in an isolated worktree, `vite-plus` installed as a local devDependency (no global installer):

- `vp build` run standalone inside a single app (`apps/copilot`) works, but only delegates to that app's existing `vite.config.js`/Vite 8 — no speed difference from `vite build` today, since the bundler win is already in hand.
- `vp run -r build` — the actual Turborepo-replacement feature, and the only feature that could plausibly beat the existing setup — fails immediately on this repo: it resolves each SvelteKit package's Vite config from the workspace root instead of the package's own directory (`src/app.html does not exist`, evaluated against the repo root, not `apps/copilot/`). Reproducible; no matching issue found in `voidzero-dev/vite-plus`'s open issues.
- `vp check` (Oxlint + Oxfmt bundled) ran in 1.8s on `apps/copilot` vs. 4.3s for the current `eslint .` there — but this isn't apples-to-apples (see Alternatives below), and the repo has no Prettier setup at all today, so Oxfmt wouldn't be replacing anything — it would be introducing enforced formatting for the first time, a materially bigger and more visible change than a speed-up.

## Alternatives considered

**Oxlint standalone, as an ESLint replacement, independent of `vite-plus`.** Rejected for now. The shared config (`packages/eslint-config/index.js`) depends on two things Oxlint doesn't yet cover:

- Two custom local rules (`local/plain-interface-to-type`, `local/pure-type-top-level`) that enforce this repo's TypeScript declaration-style convention. Oxlint's JS-plugin API — the mechanism that would let it run custom rules like these — only reached alpha in March 2026.
- `.svelte` file linting. Oxlint has no native Svelte support (framework support is flagged "coming later in 2026" as of this evaluation, still unshipped). The only path today is a third-party community package, `oxvelte` — unofficial, unproven long-term maintenance.

A full swap today means trading one mature, fully-covered tool for an alpha plugin API plus an unofficial third-party linter. The measured payoff is also modest: full-repo lint is already 9.8s cold and near-instant warm via Turborepo's cache, so the ceiling is single-digit seconds off CI, not a transformative gain.

**Oxfmt as a Prettier replacement.** Not applicable — there's no Prettier (or any enforced formatter) in this repo today, so this isn't a speed-up candidate at all, just a new enforcement policy that would need its own discussion.

**Full `vp run -r` monorepo trial**, replacing `turbo.json` outright. Blocked — see Decision. Couldn't get past the workspace-root config-resolution bug to evaluate caching behavior, filtering, or CI integration at all.

## Consequences

- No dependency, config, or script changes from this evaluation — `vite-plus` was installed only in a throwaway worktree that was torn down afterward.
- Confirms Rolldown's build-speed win is already fully realized via plain Vite 8; there's no additional bundler-level speed-up on the table right now.
- **Revisit trigger:** `vp run`'s workspace-root config-resolution bug gets fixed upstream (no tracking issue filed by us; check `voidzero-dev/vite-plus` for the fix landing, or re-test on a newer release).
- **Revisit trigger:** Oxlint's JS-plugin API leaves alpha and/or Oxlint ships native Svelte support — either closes the specific gaps that blocked a standalone Oxlint swap.
