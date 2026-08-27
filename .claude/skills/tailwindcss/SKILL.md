---
name: tailwindcss
description: Tailwind CSS v4 & daisyUI 5 styling skill. MANDATORY for writing, reviewing, or refactoring CSS, Tailwind utilities, theme tokens, and daisyUI components. TRIGGER when editing CSS files, HTML markup, Svelte templates, or styling configurations.
metadata:
  version: 4.x
---

# Tailwind CSS v4 & daisyUI 5 Best Practices

Guidelines for styling Svelte 5 applications using Tailwind CSS v4 and daisyUI 5 in the TaBiThA monorepo.

---

## 1. Tailwind CSS v4 Architecture (CSS-First)

Tailwind CSS v4 replaces JavaScript config files (`tailwind.config.js`) with CSS-first configuration and `@tailwindcss/vite`:

- **Main CSS Entry (`src/app.css`)**:
  ```css
  @import "tailwindcss";
  @plugin "daisyui";
  @plugin "@tailwindcss/typography";

  @theme {
  	--font-sans: 'Inter', system-ui, sans-serif;
  	--color-brand-primary: oklch(0.65 0.24 260);
  }
  ```
- **NO `tailwind.config.js`**: Never create or look for a JS configuration file. All theme extensions and plugins belong in CSS.

---

## 2. daisyUI 5 Component Usage

- **Semantic HTML + daisyUI Classes**:
  Always use semantic HTML elements styled with daisyUI classes:
  - Buttons: `<button class="btn btn-primary btn-sm">`
  - Cards: `<article class="card bg-base-100 shadow-sm border border-base-200">`
  - Modals: `<dialog class="modal"><div class="modal-box">...</div></dialog>`
  - Badges: `<span class="badge badge-neutral">`
  - Dropdowns: `<div class="dropdown"><ul class="dropdown-content menu">...</ul></div>`
- **Color Palettes**: Use semantic theme colors (`bg-base-100`, `bg-base-200`, `text-base-content`, `btn-primary`, `badge-success`) rather than hardcoded hex colors.

---

## 3. Element Attribute Ordering Convention

Place `class="..."` at the **end** of element attributes to prioritize accessibility, events, and functional props:

```svelte
<!-- ✅ Preferred -->
<button
	type="submit"
	disabled={is_submitting}
	onclick={handle_submit}
	class="btn btn-primary btn-sm"
>
	Save Changes
</button>

<!-- ❌ Avoid putting classes first before event handlers -->
<button class="btn btn-primary btn-sm" onclick={handle_submit}>
	Save Changes
</button>
```

---

## 4. Responsive & Dynamic Layouts

- Prefer Tailwind Flex/Grid layouts:
  ```svelte
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  	{#each items as item (item.id)}
  		<ItemCard {item} />
  	{/each}
  </div>
  ```
- Use daisyUI responsive modifiers: `modal-bottom sm:modal-middle`, `drawer lg:drawer-open`.
