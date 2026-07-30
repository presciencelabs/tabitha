import type { GoogleGenAI } from '@google/genai/node'

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Platform {
			env: Env;
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties
		}

		// interface Error {}
		interface Locals {
			ai: GoogleGenAI
		}
		// interface PageData {}
		// interface PageState {}
	}
}

export {};
