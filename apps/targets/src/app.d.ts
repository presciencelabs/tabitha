/// <reference types="vite-plugin-pwa/client" />

import type { D1Database } from '@cloudflare/workers-types'
import type { TargetProject } from '@tabitha/types/target'

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			// Set for every route under [project=valid_project]; left unset for routes outside it
			// (currently only the project-list root route, which doesn't read locals.db).
			db: D1Database
		}
		// interface PageData {}

		interface Platform {
			// Cloudflare-specific -- one D1 binding per target-language project, named to match
			// TARGET_PROJECTS (see wrangler.jsonc and @tabitha/types/target)
			env: {
				[K in TargetProject as `DB_Targets_${K}`]: D1Database
			}
		}
	}
}

export {}
