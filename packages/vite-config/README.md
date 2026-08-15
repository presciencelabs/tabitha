# @tabitha/vite-config

Shared Vite and Playwright configuration helpers for Tabitha SvelteKit applications.

---

## Usage

### Vite Configuration (`vite.config.js`)

```js
import { create_app_vite_config } from '@tabitha/vite-config'

export default create_app_vite_config({ port: 8790 })
```

### Playwright E2E Configuration (`playwright.config.js`)

```js
import { create_app_playwright_config } from '@tabitha/vite-config/playwright'

export default create_app_playwright_config({ port: 8790 })
```
