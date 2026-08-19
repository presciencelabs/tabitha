---
name: typography
description: How to use Tailwind Typography (`prose`) alongside daisyUI in the TaBiThA monorepo — when `prose` belongs on an element, when to escape a nested component with `not-prose`, and the layout/spacing conflicts to avoid. Load before writing or reviewing Svelte markup that adds, removes, or reviews `prose`, `not-prose`, or wraps daisyUI components inside a content block.
---

# Typography in TaBiThA (prose + daisyUI)

This repo pairs `@tailwindcss/typography` with daisyUI 5 (see `AGENTS.md` Philosophy #8 and #13, and `packages/ui`). They're complementary, not competing: daisyUI styles components (`btn`, `card`, `badge`), `prose` styles raw long-form content (descriptions, glosses, definitions, markdown). Neither covers the other's job.

## The one rule

`prose` goes on an element **only if everything inside it is genuine textual content** — no daisyUI structural classes, no flex/grid layout utilities, no interactive components. If you're about to add `prose` next to `card-title`, `card-actions`, `justify-between`, `items-center`, `flex`, `grid-cols-*`, or similar, stop: `prose` is being asked to style a UI region, not content, and its descendant selectors will fight the daisyUI/layout styling on whatever's nested inside.

```svelte
<!-- ❌ prose on a layout/component region (real bug pattern found in this repo) -->
<section class="prose card-title max-w-none justify-between">
	<Header {concept} />
</section>

<!-- ✅ layout stays on the wrapper; prose only wraps text -->
<div class="card-title flex justify-between">
	<Header {concept} />
</div>

<section class="prose max-w-none">
	<Meaning {concept} />
</section>
```

## Escaping with `not-prose`

Sometimes a daisyUI component or interactive element genuinely belongs inside a content block (e.g. a "show more" button after a definition). Add `not-prose` directly to that nested element so it opts back out of `prose`'s descendant styling instead of fighting it with manual overrides:

```svelte
<section class="prose max-w-none">
	<p>{concept.definition}</p>
	<button class="btn btn-sm not-prose">Show more</button>
</section>
```

## Signs you're fighting `prose` instead of scoping it

- Repeatedly adding `max-w-none`, `mt-0`, `mb-0`, or similar resets to cancel `prose` defaults → the element is probably a small UI fragment, not a content block. Narrow the `prose` wrapper to just the text, or drop it.
- A `prose` block whose only fix for spacing is more utility classes piled on → check whether `not-prose` on the offending child is simpler.
- `prose` applied to a whole page or route layout → scope it down to the specific content island (e.g. the rendered markdown region), not the page shell.

## Automated check

`scripts/audits/check_philosophies.ts` (`pnpm check:philosophies`) flags `.svelte` files combining `prose`/`prose-*` with layout utilities or daisyUI structural classes in the same `class` attribute. It's a non-blocking CI observation, not a hard failure — treat findings as a prompt to re-scope, not necessarily a bug.
