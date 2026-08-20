import { create_app_svelte_config } from '@tabitha/vite-config/svelte'

export default create_app_svelte_config({
	kit: {
		// @vite-pwa/sveltekit handles its own registration; avoid SvelteKit also
		// trying to register a src/service-worker.js that doesn't exist.
		serviceWorker: { register: false },
	},
})
