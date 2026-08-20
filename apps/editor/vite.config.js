import { SvelteKitPWA } from '@vite-pwa/sveltekit'
import { create_app_vite_config } from '@tabitha/vite-config'

export default create_app_vite_config({
	port: 8790,
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
				// editor is server-rendered per route, not a static app shell, so there's
				// no meaningful precached "/" to fall back to. The key must be *present*
				// (even as undefined) or the plugin silently injects one, which intercepts
				// every navigation before any other route gets a chance to run.
				navigateFallback: undefined,
				runtimeCaching: [
					{
						// /check is editor's own GET API route (grammar/rule checking),
						// called via client-side fetch from the root page. /ai-assist/generate
						// is POST and is already excluded by `method: 'GET'` below.
						urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname === '/check',
						method: 'GET',
						handler: 'NetworkFirst',
						options: {
							cacheName: 'editor-check-api',
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
