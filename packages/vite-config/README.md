# @tabitha/vite-config

Shared Vite, Playwright, and SvelteKit configuration helpers for Tabitha applications.

---

## ⚙️ Usage

### 1. Vite Configuration (`vite.config.js`)

```js
import { create_app_vite_config } from '@tabitha/vite-config'
import { PORTS } from '@tabitha/vite-config/ports'

export default create_app_vite_config({ port: PORTS.editor.port })
```

### 2. SvelteKit Configuration (`svelte.config.js`)

```js
import { create_app_svelte_config } from '@tabitha/vite-config/svelte'

export default create_app_svelte_config()
```

### 3. Playwright E2E Configuration (`playwright.config.js`)

```js
import { create_app_playwright_config } from '@tabitha/vite-config/playwright'

export default create_app_playwright_config({ port: 1337 })
```
