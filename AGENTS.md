# TaBiThA Monorepo Constitution & Development Philosophies

Welcome to the **TaBiThA** engineering workspace. This document serves as the **Canonical Single Source of Truth (SSOT)** for both developers and AI pair programmers across all applications and shared packages in this monorepo.

---

## 🏛️ 14 Core Development Philosophies

All code written in this repository should adhere to the following 14 foundational philosophies:

### 1. Self-contained components

Parents manage layout, grid positioning, and context; components encapsulate their own behavior, internal state, and daisyUI styling.

```svelte
<!-- Page.svelte: Layout and structure -->
<div class="grid grid-cols-3 gap-4">
	<ConceptCard {concept} />
</div>

<!-- ConceptCard.svelte: Self-contained styling & local state -->
<script lang="ts">
	let { concept }: { concept: Concept } = $props()
	let is_expanded = $state(false)
</script>

<article class="card bg-base-100 shadow-sm border border-base-200">
	<div class="card-body">
		<h2 class="card-title">{concept.label}</h2>
		<button
			type="button"
			onclick={() => (is_expanded = !is_expanded)}
			class="btn btn-sm btn-ghost"
		>
			{is_expanded ? 'Show Less' : 'Show More'}
		</button>
	</div>
</article>
```

---

### 2. Normalized data

Keep data normalized as close to the source as possible with deterministic, side-effect-free transformations.

```typescript
// Normalized entities by unique ID
interface EntityState {
	by_id: Record<string, Word>
	all_ids: string[]
}

// Deterministic, pure updater
const normalize_words = (raw_words: Word[]): EntityState => ({
	by_id: Object.fromEntries(raw_words.map(w => [w.id, w])),
	all_ids: raw_words.map(w => w.id)
})
```

---

### 3. Tabs for indentation

Use literal `tab` characters for indentation across all TypeScript, JavaScript, CSS, JSON, and Svelte files. (Individual developers configure visual display width in their own editors).

```typescript
export const get_entity_id = (entity: SourceEntity): string => {
	const sanitized_id = entity.id.trim().toLowerCase()
	return sanitized_id
}
```

---

### 4. Code over comments

Self-documenting code with descriptive naming is preferred over excessive commenting. Write code that makes intent instantly clear.

```typescript
// ❌ Avoid: Vague names patched with comments
// Check if word is valid and not expired
const check = (w: Word) => w.s === 'active' && w.exp > Date.now()

// ✅ Preferred: Intention revealed directly by naming
const is_word_active_and_unexpired = (word: Word): boolean => {
	const is_active = word.status === 'active'
	const is_not_expired = word.expires_at > Date.now()
	return is_active && is_not_expired
}
```

---

### 5. Classes at the end of elements

In Svelte templates, place `class="..."` after functional attributes, event handlers, and data bindings to prioritize behavioral readability first.

```svelte
<!-- ❌ Avoid -->
<button class="btn btn-primary btn-sm" type="submit" disabled={is_loading} onclick={handle_save}>
	Save
</button>

<!-- ✅ Preferred -->
<button
	type="submit"
	disabled={is_loading}
	onclick={handle_save}
	class="btn btn-primary btn-sm"
>
	Save
</button>
```

---

### 6. Guard clauses over nested logic

Favor early returns and guard clauses to keep control flow flat, scannable, and avoid deep nesting pyramids.

```typescript
// ❌ Avoid nested pyramid
const process_concept = (concept: Concept | null) => {
	if (concept) {
		if (concept.is_verified) {
			return concept.label.toUpperCase()
		}
	}
	return null
}

// ✅ Flat flow with guard clauses
const process_concept = (concept: Concept | null): string | null => {
	if (!concept) return null
	if (!concept.is_verified) return null

	return concept.label.toUpperCase()
}
```

---

### 7. Strict domain typing

Model linguistic entities (`Concept`, `SourceEntity`, `Word`, `Clause`) with explicit TypeScript types and discriminating unions. Avoid `any` or `as any`.

```typescript
interface BaseEntity {
	readonly id: string
	readonly created_at: number
}

export type LinguisticEntity =
	| ({ readonly kind: 'concept'; readonly label: string } & BaseEntity)
	| ({ readonly kind: 'word'; readonly lemma: string; readonly pos: string } & BaseEntity)
	| ({ readonly kind: 'source_entity'; readonly source_uri: string } & BaseEntity)

export const resolve_display_label = (entity: LinguisticEntity): string => {
	switch (entity.kind) {
		case 'concept':
			return entity.label
		case 'word':
			return `${entity.lemma} (${entity.pos})`
		case 'source_entity':
			return entity.source_uri
	}
}
```

---

### 8. Semantic HTML & daisyUI 5

Leverage native HTML elements (`<dialog>`, `<article>`, `<nav>`, `<aside>`) styled via daisyUI 5 component classes (`modal`, `card`, `btn`, `badge`).

```svelte
<dialog open class="modal modal-bottom sm:modal-middle">
	<div class="modal-box">
		<h3 class="font-bold text-lg">Confirm Action</h3>
		<p class="py-4">Are you sure you want to delete this entity?</p>
		<div class="modal-action">
			<form method="dialog" class="flex gap-2">
				<button value="cancel" class="btn btn-ghost">Cancel</button>
				<button value="confirm" class="btn btn-error">Confirm</button>
			</form>
		</div>
	</div>
</dialog>
```

---

### 9. Limit use of `if`

Consider lookup tables, object maps, pattern matching, or polymorphism before resorting to long chains of `if`/`else` statements.

```typescript
// ❌ Avoid long if/else chains
const get_badge_class = (status: string) => {
	if (status === 'active') return 'badge-success'
	if (status === 'pending') return 'badge-warning'
	if (status === 'archived') return 'badge-neutral'
	return 'badge-ghost'
}

// ✅ Preferred: Object map / dictionary lookup
const STATUS_BADGE_MAP: Record<string, string> = {
	active: 'badge-success',
	pending: 'badge-warning',
	archived: 'badge-neutral',
} as const

const get_badge_class = (status: string): string =>
	STATUS_BADGE_MAP[status] ?? 'badge-ghost'
```

---

### 10. `snake_case` for functions, variables, and files

Use `snake_case` for all function, method, variable, file, and directory names. Reserve `PascalCase` strictly for Svelte component names and TypeScript types/interfaces.

```typescript
// Types/Interfaces in PascalCase
interface ConceptPayload {
	concept_id: string
	root_term: string
}

// Variables and functions in snake_case
const default_payload: ConceptPayload = {
	concept_id: 'c_101',
	root_term: 'lexicon',
}

export const fetch_concept_data = async (payload: ConceptPayload): Promise<Concept> => {
	const response_data = await fetch(`/api/concepts/${payload.concept_id}`)
	return response_data.json()
}
```

---

### 11. Pure functions

Functions should be pure and free of side effects wherever practical. Receive one argument (destructuring an options object if multiple inputs are needed) and return one value.

```typescript
interface FormatWordOptions {
	readonly word: Word
	readonly prefix?: string
}

// Pure: depends only on input, single options argument, no external state mutation
export const format_word_label = ({
	word,
	prefix = '',
}: FormatWordOptions): string => {
	const cleaned_lemma = word.lemma.trim().toLowerCase()
	return prefix ? `${prefix}:${cleaned_lemma}` : cleaned_lemma
}
```

---

### 12. YAGNI & Minimal Surface Area

**You Aren't Gonna Need It**: Solve today's concrete requirement thoroughly and cleanly. Do not introduce speculative parameters, unused API routes, dead configuration options, or premature abstraction layers.

- **The Rule of Three for Shared Packages**: Implement features locally inside their consuming app (`apps/editor`, `apps/ontology`, etc.). Do not extract code into `packages/*` until at least 3 distinct consumers require identical functionality.
- **Lean Cloudflare Worker Bundles**: Every unused export, speculative handler, or oversized dependency adds cold-start latency and bundle size to edge workers. Keep endpoints minimal and focused.
- **Pragmatic AI Prompts**: Keep AI prompts in `apps/copilot` tailored directly to active tasks rather than building complex generic prompt framework abstractions.
- **Don't restate a dependency's own default**: If a wrapper's parameter default just re-declares what the underlying library already defaults to, and no caller ever overrides it, drop the parameter and let the library's default apply on its own. Confirm no call site overrides it before removing.

```typescript
// ❌ Avoid: Speculative over-generalized configuration flags
interface FetchConceptOptions {
	include_hypothetical_future_relations?: boolean
	experimental_caching_layer_v2?: boolean
	custom_unsupported_encoder?: (input: string) => unknown
}

// ✅ Preferred: Concrete, minimal surface area solving the active requirement
interface FetchConceptOptions {
	readonly concept_id: string
	readonly include_glosses?: boolean
}
```

```javascript
// ❌ Avoid: default merely restates Vite's own built-in default for server.host,
// and no app in the workspace ever overrides it
export function create_app_vite_config({ port, host = 'localhost', ...rest }) {
	return defineConfig({ server: { host, port, strictPort: true } })
}

// ✅ Preferred: omit it and let Vite's own default apply
export function create_app_vite_config({ port, ...rest }) {
	return defineConfig({ server: { port, strictPort: true } })
}
```

---

### 13. Scope `prose` to content; escape with `not-prose`

`@tailwindcss/typography`'s `prose` class exists to give raw, long-form content (descriptions, glosses, definitions, markdown-rendered text) sensible heading/paragraph/list rhythm without hand-tuning every element. It is **not** a general-purpose styling utility. Apply it only to an element that wraps genuine textual content — never to a layout wrapper, a card title row, or anything carrying flex/grid utilities or daisyUI structural classes (`card-title`, `card-actions`, `btn`, `navbar`, `modal-action`), since `prose`'s descendant selectors will override daisyUI component and layout styling on anything nested inside it. When a `prose` block must contain a daisyUI component or interactive element, add `not-prose` to that nested element to opt it back out.

```svelte
<!-- ❌ Avoid: "prose" applied to a layout/component region, not content -->
<section class="prose card-title max-w-none justify-between">
	<Header {concept} />
</section>

<!-- ✅ Preferred: layout on the wrapper, "prose" scoped to the text block only -->
<div class="card-title flex justify-between">
	<Header {concept} />
</div>

<section class="prose max-w-none">
	<Meaning {concept} />
</section>

<!-- ✅ A daisyUI component nested inside real content escapes via not-prose -->
<section class="prose max-w-none">
	<p>{concept.definition}</p>
	<button class="btn btn-sm not-prose">Show more</button>
</section>
```

---

### 14. SvelteKit data-loading boundaries

Keep `.svelte` component scripts limited to presentation and event wiring. Data fetching, response shaping, derived properties the UI needs, and permission-dependent display decisions belong in the appropriate `load` function or a `$lib` data-layer module, never written inline in the component:

- **`+page.svelte` / `+layout.svelte`** — display only. Read already-shaped `data`, wire up events. No `fetch()` written directly in the component script — this holds regardless of what triggers the call (page load, a click, a keystroke) or where the request goes (our own backend or a third-party API); wrap it in a `$lib` data-layer function the component calls instead. No response parsing, no deriving new properties from raw data, in the component either. The only valid exception is Philosophy #12's YAGNI: a genuinely disposable, single-use, one-line call that will never be touched again, where a wrapper module would be pure ceremony — not a case-by-case judgment call for anything that might be reused or grow.
- **`+page.ts` / `+layout.ts` (universal load)** — shapes data for the UI and may hold display-adjacent business logic. This is also the only place allowed to depend on browser-only context (e.g. `navigator.language`, `Intl.DateTimeFormat().resolvedOptions().timeZone`), since a universal load reruns once on the client right after SSR.
- **`+page.server.ts` / `+layout.server.ts`** — a narrow role: server-only session/auth checks and assembling the data a page needs by calling server modules. Not the home for reusable business logic.
- **`+server.ts` endpoints and `$lib/server/**` modules** — canonical, call-site-independent business logic and data access. A decision like "can this user approve this change?" is computed once here and reused by both an endpoint's authorization check and the value it returns — never re-derived separately in a loader or a component.

```svelte
<!-- ❌ Avoid: fetch, response parsing, and a derived permission decision inline in the component -->
<script lang="ts">
	async function approve(change) {
		const res = await fetch(`/protected/changes/${change.id}/approve`, { method: 'POST' })
		const result = await res.json()
		if (res.ok) { /* ... */ }
	}
	function can_approve(change) {
		return !!change.suggested_by && !change.approved_by && data.can_add
	}
</script>

<!-- ✅ Preferred: the component only reads already-shaped data and calls a data-layer function -->
<script lang="ts">
	import { approve_change } from '$lib/changes'

	async function approve(change) {
		changes = changes.map(c => c.id === change.id ? await approve_change(change.id) : c)
	}
</script>

{#if change.can_approve}
	<button onclick={() => approve(change)}>Approve</button>
{/if}
```

---

## 🧭 Monorepo Architecture & Package Boundaries

1. **Applications (`apps/*`)**:
   - `editor` (:8790) — Translation workbench, clause parser, and rule processing.
   - `ontology` (:5173) — Core linguistic knowledge base, concepts, and D1 SQLite.
   - `sources` (:8789) — Hebrew/Greek source texts, semantic trees, and verse encodings.
   - `targets` (:8788) — Target language lexicon, inflection engine, and forms.
   - `copilot` (:8793) — AI translation guidance and Gemini SDK integration.

2. **Shared Packages (`packages/*`)**:
   - `@tabitha/types` — Universal TypeScript interfaces. Must remain free of runtime dependencies.
     - **Boundary rule**: a type belongs here if it crosses an app boundary — either it is actually imported by 2+ apps, or it is the shape of data one app sends to or receives from another app's API (even with a single consumer today). API/DB contract types get this lower two-party bar because duplicating them risks silent runtime drift, not just repeated code, so the Rule of Three (§12) does not apply to them.
     - Everything else — route params, UI-only view models, internal helper shapes — stays local to the app, defined in an explicit module (e.g. `$lib/types.ts`) that `import type`s from `@tabitha/types` where needed.
     - Do not declare domain types as ambient globals (`declare global { type X = ... }`) outside of SvelteKit's own generated `app.d.ts`. Ambient types hide where a type comes from and make accidental duplicates easy to introduce.
   - `@tabitha/ui` — Reusable Svelte 5 components styled with daisyUI 5.
   - `@tabitha/api-client` — Typed HTTP client for inter-service communication.
   - `@tabitha/vite-config` — Shared Vite, SvelteKit, Vitest, and Playwright configurations.
   - `@tabitha/eslint-config` — ESLint flat configurations.
   - `@tabitha/tsconfig` — Base TypeScript compiler configurations.

3. **Dependency Direction**:
   - `apps/*` ➔ `packages/*` (Allowed)
   - `packages/*` ➔ `apps/*` (STRICTLY PROHIBITED)
   - Within a single app, `src/routes/**` ➔ `src/lib/**` (Allowed)
   - Within a single app, `src/lib/**` ➔ `src/routes/**` (STRICTLY PROHIBITED)
   - No circular dependencies between workspace packages.

### App-internal lib/routes boundary

`src/lib/**` is an app's shared, reusable layer; `src/routes/**` is page- and endpoint-specific and depends on lib, never the reverse. A type or helper needed by both a route and a `$lib` module belongs in `$lib` (e.g. `$lib/types.ts`) -- never defined inside a route and reached into from `$lib` via a relative import.

```typescript
// ❌ Avoid: a $lib module reaching into src/routes for a type
import type { AnalysisResult } from '../../routes/analyze/types'

// ✅ Preferred: the type lives in $lib; the route imports it from there too
import type { AnalysisResult } from '$lib/types'
```

---

## 🔐 Reserve Secret Storage for Genuinely Sensitive Values

Repo-wide convention: secret-style storage should hold only genuinely sensitive values. Secrets
are write-only -- nobody, not even repo/org admins, can ever read one back once set -- so
storing non-sensitive config there costs auditability for nothing. Two applications in this
monorepo:

- **GitHub Actions**: secrets (`secrets.NAME`) are for real credentials (API tokens, etc.).
  Everything else (account IDs, region names, feature flags) belongs in a repository
  **variable** instead (`vars.NAME`, managed via Settings → Secrets and variables → Actions →
  Variables, or `gh variable set`).
- **Local env files**: a workspace package's committed `.env` should declare every var it
  needs, holding whatever value is actually correct for production and preview -- both are
  built from `.env` alone, since `.env.local` is gitignored and never present outside a
  developer's own machine. That's a real value for most vars (an API host, a redirect URL), but
  it can just as validly be an intentionally blank/off value when that's genuinely what
  production wants too (a dev-only toggle that should stay disabled everywhere it's actually
  deployed). Genuinely sensitive values are the one case where blank in `.env` is mandatory
  regardless of what "correct for prod" would otherwise be -- the real value is never committed
  anywhere in the repo; it lives only in `.env.local` locally and in the deployment's own
  secret store remotely. `.env.local` itself is exclusively a local-dev override layer on top
  of `.env`, in whichever direction local dev needs -- filling in a secret or widening a
  permission the same way `.env` left blank, or forcing something to blank/off that `.env`
  populated for production. Both Vite (`apps/*`) and Bun (`tools/*`, `scripts/*`) natively load
  `.env` then `.env.local` on top of it, so either direction works with no extra tooling.

  This `.env`/`.env.local` split is a repo convention layered on top of SvelteKit's own env
  system, which is a separate, orthogonal 2×2: static (frozen into the bundle at build/dev-server
  start) vs. dynamic (read at request time), crossed with public (safe for client code) vs.
  private (server-only) -- see
  [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private),
  [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public),
  [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), and
  [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public). This monorepo mostly
  uses the two **static** modules, but a handful of server-only values consumed inside request
  handlers -- the Gemini and Aquifer API credentials in `apps/copilot/src/hooks.server.ts`,
  `apps/copilot/src/lib/server/brief/brief.ts`, and `apps/ontology/src/lib/server/semantic_search.ts`
  -- are read via `$env/dynamic/private` instead. Nothing yet needs `$env/dynamic/public`. Which
  of the two (public vs. private) to use is about client-bundle exposure only, and is unrelated to whether a
  given var happens to be blank or populated in `.env` -- a var can be public and blank (e.g.
  `PUBLIC_CORS_ALLOW_LOCALHOST`, whose correct production value genuinely is "off"), or private
  and populated (e.g. `OAUTH_REDIRECT_PROXY_URL`, non-sensitive but server-only, holding a real
  value in production).

  SvelteKit is moving toward a different, [explicit environment variables
  system](https://svelte.dev/docs/kit/environment-variables) (`$app/env/private` /
  `$app/env/public`, declared in a per-app `src/env.ts`) that will eventually replace `$env/*`
  entirely -- but as of this writing it's still an opt-in experimental flag
  (`kit.experimental.explicitEnvironmentVariables`) that only becomes the default in SvelteKit 3.
  Nothing in this monorepo has opted into it; every app still uses the four modules above. Revisit
  this section if/when that migration happens.

Either way, a developer should be able to tell at a glance -- from the checked-in file alone,
without needing to open a vault -- which values are actually sensitive. Every committed `.env`
follows the same two-tier skeleton, ordered from most open to most private:

```env
# ══════════════════════════════════════════════════════════════════════════
# OPEN CONFIG
# Real values, safe to commit. May be public (client-exposed) or private
# (server-only) -- see the $env/... tag on each line for which SvelteKit
# module to import it from. Cloudflare: belongs in wrangler.jsonc's `vars`
# block for real deployments, not a `wrangler secret`.
# ══════════════════════════════════════════════════════════════════════════

# $env/static/public -- <why this is safe to expose to the client>
PUBLIC_SOME_HOST=https://example.tabitha.bible

# ══════════════════════════════════════════════════════════════════════════
# SECRETS
# Left blank here; real values live only in .env.local (gitignored) or the
# deployment's own secret store. Still tagged with the SvelteKit module
# they're read through. Cloudflare: set via `wrangler secret put <NAME>`
# (or the dashboard), never in wrangler.jsonc `vars` --
# scripts/audits/check_cloudflare.ts enforces this.
# ══════════════════════════════════════════════════════════════════════════

# $env/static/private -- <where to obtain this credential>
SOME_SECRET=
```

`OPEN CONFIG` holds every var with a real, safe-to-commit value -- public or private, static or
dynamic, doesn't matter, since public/private is purely about client-bundle exposure (see above)
and has nothing to do with sensitivity. `SECRETS` holds everything left blank in `.env` and
filled only in `.env.local` or the deployment's own secret store. Each var gets a one-line
comment: for `OPEN CONFIG`, the `$env/...` module it's read through plus (when not obvious) why
that value is correct; for `SECRETS`, the module plus a link to where a developer obtains their
own credential. `tools/*` scripts (Bun, not SvelteKit) use the same two-tier shape but skip the
`$env/...` tags, since they read `process.env` directly rather than importing from `$env/*`. See
`apps/ontology/.env` for a populated real-world example spanning both tiers and three of the four
`$env` modules.

---

## ⚡ 1-Command Verification Gate

Before submitting any code changes, ensure the entire repository passes the standard verification gate:

```bash
cd tabitha && pnpm precommit
# Runs: pnpm check && pnpm test && pnpm build
```
