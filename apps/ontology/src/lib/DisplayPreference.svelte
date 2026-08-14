<script>
	import Icon from '@iconify/svelte' // https://iconify.design/
	import { createEventDispatcher, onMount } from 'svelte'

	const dispatcher = createEventDispatcher()

	/** @type {'grid'|'table'} */
	let display_preference = 'grid'

	onMount(() => dispatch(display_preference))

	$: dispatch(display_preference)

	/** @param {'grid'|'table'} preference */
	function dispatch(preference) {
		dispatcher('preference', preference)
	}
</script>

<div class="join">
	<button class="btn join-item" class:btn-accent={display_preference === 'grid'} on:click={() => display_preference = 'grid'} title="Grid View">
		<Icon icon="mdi:view-grid" class="h-5 w-5" />
	</button>

	<button class="btn join-item" class:btn-accent={display_preference === 'table'} on:click={() => display_preference = 'table'} title="Table View">
		<Icon icon="uiw:table" class="h-5 w-5" />
	</button>
</div>
