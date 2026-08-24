<script lang="ts">
	import { updated } from '$app/state'
	import { onMount } from 'svelte'

	type Props = {
		// Lets an app with its own update mechanism (e.g. vite-plugin-pwa's needRefresh)
		// drive this toast instead of SvelteKit's version poll, so an app never shows both.
		needs_refresh?: boolean
		on_refresh?: () => void
	}

	let { needs_refresh, on_refresh }: Props = $props()

	let visible = $derived(needs_refresh ?? updated.current)

	function refresh() {
		if (on_refresh) {
			on_refresh()
		} else {
			window.location.reload()
		}
	}

	// Users often leave tabs open indefinitely, so re-check immediately when they come back
	// to the tab rather than waiting for the next background poll (see version.pollInterval).
	// No-op when needs_refresh is externally controlled, since there's nothing for SvelteKit to check.
	onMount(() => {
		function on_visibility_change() {
			if (needs_refresh === undefined && document.visibilityState === 'visible') updated.check()
		}

		document.addEventListener('visibilitychange', on_visibility_change)
		return () => document.removeEventListener('visibilitychange', on_visibility_change)
	})
</script>

{#if visible}
	<div class="toast toast-end toast-bottom z-50">
		<div class="alert alert-info shadow-lg">
			<span>A new version is available.</span>
			<button onclick={refresh} class="btn btn-sm btn-primary">
				Refresh
			</button>
		</div>
	</div>
{/if}
