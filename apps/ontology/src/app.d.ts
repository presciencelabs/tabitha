/// <reference types="svelte" />
/// <reference types="vite-plugin-pwa/client" />
import type { Auth, User } from '@auth/sveltekit'
import type { D1Database } from '@cloudflare/workers-types'

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			db_ontology: D1Database
			db_auth: D1Database
			auth: Auth
			user: User | undefined
		}
		// interface PageData {}

		interface Platform {
			env: Env
		}
	}
}
