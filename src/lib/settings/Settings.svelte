<script>
	import Icon from '@iconify/svelte'
	import { onMount } from 'svelte'
	import { view_settings, set_settings } from './settings.svelte.js'

	onMount(() => {
		const setting_json = localStorage.getItem('source_view_settings')
		if (setting_json) {
			set_settings(JSON.parse(setting_json))
		}
	})

	function store_settings() {
		const setting_json = JSON.stringify(view_settings)
		localStorage.setItem('source_view_settings', setting_json)

		console.info('view settings saved: ', setting_json)
	}
</script>

<details class="dropdown">
	<summary class="btn px-3">
		<Icon icon="material-symbols:settings" class="h-6 w-6" />
	</summary>
	<div class="menu dropdown-content bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
		<label>
			<input type="checkbox" bind:checked={view_settings.show_hover_popups} onchange={store_settings} />
			Show hover popups
		</label>
	</div>
</details>