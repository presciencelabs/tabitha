import { SvelteKitPWA } from '@vite-pwa/sveltekit'
import { create_app_vite_config } from '@tabitha/vite-config'
import { PORTS } from '@tabitha/vite-config/ports'

export default create_app_vite_config({
	port: PORTS.targets.port,
	plugins: [
		SvelteKitPWA({
			registerType: 'prompt',
			scope: '/',
			base: '/',
			manifest: {
				name: 'TaBiThA Targets',
				short_name: 'Targets',
				description: 'Target language generation search and forms',
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
			},
			workbox: {
				// Opt out of @vite-pwa/sveltekit's default SPA-shell navigation fallback:
				// targets is server-rendered per route, not a static app shell, so there's
				// no meaningful precached "/" to fall back to. The key must be *present*
				// (even as undefined) or the plugin silently injects one, which intercepts
				// every navigation before any other route gets a chance to run.
				navigateFallback: undefined,
				// No runtimeCaching rule here: targets' Explorer UI never makes client-side
				// fetch() calls to its own API (its data loading happens server-side), so
				// there's no code path that would exercise one - see
				// docs/decisions/0001-service-worker-strategy.md for the full story of why
				// this app only gets asset precaching for now.
			},
		}),
	],
})
