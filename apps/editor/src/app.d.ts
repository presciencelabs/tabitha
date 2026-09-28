/// <reference types="vite-plugin-pwa/client" />

import type { UsageEnv } from '@tabitha/usage'

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}

		interface Platform {
			env: UsageEnv
		}
	}
}

export { }

