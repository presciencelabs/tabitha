import type { D1Database } from '@cloudflare/workers-types'

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			db_ontology: D1Database
			db_auth: D1Database
			user: User | undefined
		}
		// interface PageData {}

		interface Platform {
			// Cloudflare-specific
			env: {
				DB_Ontology: D1Database // see wrangler.toml to match this name

				DB_Auth: D1Database		// see wrangler.toml to match this name
				AUTH_SECRET: string
				GOOGLE_OAUTH_CLIENT_ID: string
				GOOGLE_OAUTH_CLIENT_SECRET: string
			}
		}
	}
}
