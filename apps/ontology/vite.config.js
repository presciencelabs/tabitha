import { SvelteKitPWA } from '@vite-pwa/sveltekit'
import { create_app_vite_config } from '@tabitha/vite-config'

export default create_app_vite_config({
	port: 5173,
	plugins: [
		SvelteKitPWA({
			registerType: 'prompt',
			scope: '/',
			base: '/',
			// No manifest/icons yet, so skip installability for this pilot and scope it to caching.
			manifest: false,
			devOptions: {
				enabled: true,
				type: 'module',
			},
			workbox: {
				// Opt out of @vite-pwa/sveltekit's default SPA-shell navigation fallback:
				// ontology is server-rendered per route, not a static app shell, so there's
				// no meaningful precached "/" to fall back to. The key must be *present*
				// (even as undefined) or the plugin silently injects one, which intercepts
				// every navigation before any other route gets a chance to run.
				navigateFallback: undefined,
				runtimeCaching: [
					{
						// ontology has real Google OAuth (/auth/*, handled in hooks.server.ts)
						// and /protected/* routes serving per-user data - unlike editor/sources,
						// a denylist here would be one accidental omission away from caching
						// something authenticated. So this is a strict allowlist matching only
						// /examples (public linguistic examples, no auth required) by its exact
						// path - not "everything except known-bad paths". Any future client-side
						// fetch, protected or not, is excluded by default unless added here
						// deliberately. /protected/concept/create/next-sense (GET, session-scoped)
						// and /protected/sync-complex-terms, /protected/changes/apply-pending
						// (POST) are all intentionally left out.
						urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname === '/examples',
						method: 'GET',
						handler: 'NetworkFirst',
						options: {
							cacheName: 'ontology-examples-api',
							expiration: {
								maxEntries: 200,
								maxAgeSeconds: 60 * 60 * 24,
							},
						},
					},
				],
			},
		}),
	],
})
