/// <reference types="vite-plugin-pwa/client" />

import type { D1Database } from '@cloudflare/workers-types'
import type { UsageEnv } from '@tabitha/usage'

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			db: D1Database
		}
		// interface PageData {}

		interface Platform {
			// Cloudflare-specific
			env: UsageEnv & {
				DB_Sources: D1Database // see wrangler.jsonc to match this name
			}
		}
	}
}

export {}
