import { SvelteKitPWA } from '@vite-pwa/sveltekit'
import { create_app_vite_config } from '@tabitha/vite-config'
import { PORTS } from '@tabitha/vite-config/ports'

export default create_app_vite_config({
	port: PORTS.sources.port,
	plugins: [
		SvelteKitPWA({
			registerType: 'prompt',
			scope: '/',
			base: '/',
			manifest: {
				name: 'TaBiThA Sources',
				short_name: 'Sources',
				description: 'Source text analysis and semantic encoding explorer',
				theme_color: '#d02031',
				background_color: '#ffffff',
				display: 'standalone',
				start_url: '/',
				icons: [
					{ src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
					{ src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
					{ src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
				],
			},
			// suppressWarnings avoids workbox-build's "glob patterns don't match any files" noise --
			// dev mode has no built client/prerendered output to precache, so an empty match is
			// expected here, not a real problem (vite-pwa/sveltekit#80).
			devOptions: {
				enabled: true,
				type: 'module',
				suppressWarnings: true,
			},
			workbox: {
				// Opt out of @vite-pwa/sveltekit's default SPA-shell navigation fallback:
				// sources is server-rendered per route, not a static app shell, so there's
				// no meaningful precached "/" to fall back to. The key must be *present*
				// (even as undefined) or the plugin silently injects one, which intercepts
				// every navigation before any other route gets a chance to run.
				navigateFallback: undefined,
				runtimeCaching: [
					{
						// /analyze is sources' own GET API route (semantic analysis of Phase 1
						// text), called via client-side fetch from the edit page.
						urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname === '/analyze',
						method: 'GET',
						handler: 'NetworkFirst',
						options: {
							cacheName: 'sources-analyze-api',
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
