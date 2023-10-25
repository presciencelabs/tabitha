import type { D1Database } from '@cloudflare/workers-types'

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}

		interface Platform {
			// Cloudflare-specific
			env: {
				DB: D1Database; // see wrangler.toml to match this name
			}
			// context: {
			// 	waitUntil(promise: Promise<any>): void;
			// };
			// caches: CacheStorage & { default: Cache };
		}
	}
}

export {}
