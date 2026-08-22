# TaBiThA Monorepo Constitution & Development Philosophies

Welcome to the **TaBiThA** engineering workspace. This document serves as the **Canonical Single Source of Truth (SSOT)** for both developers and AI pair programmers across all applications and shared packages in this monorepo.

---

## 🏛️ 13 Core Development Philosophies

All code written in this repository should adhere to the following 13 foundational philosophies:

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
   - No circular dependencies between workspace packages.

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
  needs, but only ever hold real values for the non-sensitive ones -- secrets stay as empty
  stubs there, documenting that the key exists without exposing a value. The real secret
  values go in `.env.local`, which is gitignored and never committed. Both Vite (`apps/*`) and
  Bun (`tools/*`, `scripts/*`) natively load `.env` then `.env.local` on top of it, so a
  non-empty value in `.env.local` overrides the empty stub for the same key with no extra
  tooling required.

Either way, a developer should be able to tell at a glance -- from the checked-in file alone,
without needing to open a vault -- which values are actually sensitive.

---

## ⚡ 1-Command Verification Gate

Before submitting any code changes, ensure the entire repository passes the standard verification gate:

```bash
cd tabitha && pnpm precommit
# Runs: pnpm check && pnpm test && pnpm build
```
