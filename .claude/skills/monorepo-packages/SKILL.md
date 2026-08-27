---
name: monorepo-packages
description: Monorepo package architecture, shared workspace libraries, and coding standards skill. TRIGGER when creating or modifying shared packages (@tabitha/types, @tabitha/ui, @tabitha/api-client, @tabitha/tsconfig, @tabitha/eslint-config) or reviewing monorepo conventions.
metadata:
  version: 1.x
---

# Monorepo Packages & Development Conventions

Guidelines for architecting shared packages and adhering to coding standards across the TaBiThA monorepo.

---

## 1. Shared Workspace Packages (`packages/*`)

| Package | Purpose & Guidelines |
| --- | --- |
| **`@tabitha/types`** | Central repository for all universal TypeScript interfaces (linguistic concepts, clauses, token representations, and API payloads). Keep free of runtime dependencies. |
| **`@tabitha/ui`** | Reusable Svelte 5 components styled with daisyUI 5. Export components from `src/index.ts`. |
| **`@tabitha/api-client`** | Typed HTTP client for inter-service communication across the 5 Cloudflare Worker applications. |
| **`@tabitha/vite-config`** | Centralized Vite, SvelteKit, Vitest, and Playwright configuration generators. |
| **`@tabitha/eslint-config`** | Standardized ESLint 9 flat configuration. |
| **`@tabitha/tsconfig`** | Base TypeScript compiler configurations (`base.json`, `svelte.json`). |

---

## 2. Package Boundaries & Dependency Flow

- **Dependency Direction**: `apps/*` may depend on `packages/*`. Packages must **never** import from `apps/*`.
- **Zero Circular Dependencies**: Shared packages must maintain clean, acyclic dependency hierarchies.
- **Runtime Dependency Discipline**: `@tabitha/types` must remain 100% free of runtime dependencies.

---

## 3. YAGNI & The Rule of Three for Shared Packages

Before extracting code into `packages/*`, apply the **Rule of Three** (Philosophy #12):

1. **First Use**: Implement directly inside the specific app (`apps/editor`, `apps/ontology`, etc.).
2. **Second Use**: Duplicate or keep localized if requirements diverge between the two callers.
3. **Third Use**: When 3 distinct applications or packages require identical behavior, extract into `@tabitha/ui`, `@tabitha/api-client`, or `@tabitha/types`.

> For universal code conventions, naming rules, and the complete 12 Development Philosophies, see [AGENTS.md](../../../AGENTS.md).

---

## 4. Pre-Commit Verification Gate

Before submitting code, verify all packages pass the 1-command verification gate:

```bash
pnpm precommit
# Runs: pnpm check && pnpm test:unit && pnpm check:secrets && pnpm check:cloudflare && pnpm check:md && pnpm build
```

