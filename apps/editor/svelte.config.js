import { create_app_svelte_config } from '@tabitha/vite-config/svelte'

export default create_app_svelte_config({
	kit: {
		// @vite-pwa/sveltekit handles its own registration; avoid SvelteKit also
		// trying to register the old src/service-worker.js it's replacing.
		serviceWorker: { register: false },
	},
})
