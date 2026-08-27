---
name: vite-config
description: Vite, SvelteKit, and build configuration skill for TaBiThA. TRIGGER when inspecting, creating, or modifying vite.config.js, svelte.config.js, or package build configurations across apps and packages.
metadata:
  version: 1.x
---

# Vite & SvelteKit Monorepo Configuration Best Practices

Guidelines for configuring applications using the centralized `@tabitha/vite-config` package.

---

## 1. Application `vite.config.js`

Every application in `apps/*` uses `create_app_vite_config` to eliminate boilerplate:

```javascript
import { create_app_vite_config } from '@tabitha/vite-config'

export default create_app_vite_config({
	port: 8790, // Dedicated application port
	// Optional plugin overrides or custom alias mappings
})
```

### Standard Dedicated Ports
- **Ontology**: `5173`
- **Targets**: `8788`
- **Sources**: `8789`
- **Editor**: `8790`
- **Copilot**: `8793`

`create_app_vite_config` automatically binds `host: 'localhost.tabitha.bible'`, enables `strictPort: true`, wires `@tailwindcss/vite`, registers `sveltekit()`, and embeds Vitest test configurations.

---

## 2. Application `svelte.config.js`

Every application uses `create_app_svelte_config` configured for Cloudflare Workers:

```javascript
import { create_app_svelte_config } from '@tabitha/vite-config/svelte'

export default create_app_svelte_config()
```

- Pre-configures `@sveltejs/adapter-cloudflare` and `vitePreprocess()`.

---

## 3. Playwright Configuration (`playwright.config.js`)

Applications with E2E tests use `create_app_playwright_config`:

```javascript
import { create_app_playwright_config } from '@tabitha/vite-config/playwright'

export default create_app_playwright_config({
	port: 8790,
	host: 'localhost.tabitha.bible',
})
```

- Manages the `webServer` lifecycle running `pnpm dev` with proper port checks.
