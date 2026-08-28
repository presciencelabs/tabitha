import { SvelteKitPWA } from '@vite-pwa/sveltekit'
import { create_app_vite_config } from '@tabitha/vite-config'
import { PORTS } from '@tabitha/vite-config/ports'

export default create_app_vite_config({
	port: PORTS.editor.port,
	plugins: [
		SvelteKitPWA({
			registerType: 'prompt',
			scope: '/',
			base: '/',
			manifest: {
				name: 'TaBiThA Editor',
				short_name: 'Editor',
				description: 'Grammar and rule checker, backtranslator, and AI assistant',
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
			devOptions: {
				enabled: true,
				type: 'module',
				suppressWarnings: true,
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
