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
			env: Env
		}
	}
}
