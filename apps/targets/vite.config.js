import { SvelteKitPWA } from '@vite-pwa/sveltekit'
import { create_app_vite_config } from '@tabitha/vite-config'

export default create_app_vite_config({
	port: 8788,
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
