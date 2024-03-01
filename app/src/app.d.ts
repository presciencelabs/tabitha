import type { D1Database } from '@cloudflare/workers-types'

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
			env: {
				DB_Sources: D1Database // see wrangler.toml to match this name
			}
		}
	}
}

export {}
