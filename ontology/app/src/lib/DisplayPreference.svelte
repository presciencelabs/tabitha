<script>
	import Icon from '@iconify/svelte' // https://iconify.design/
	import {createEventDispatcher, onMount} from 'svelte'

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

<fieldset class="join gap-0 text-center">
	<label class="btn join-item" class:btn-accent={display_preference === 'grid'}>
		<Icon icon="mdi:view-grid" class="h-6 w-6" />
		<input type="radio" bind:group={display_preference} value="grid" class="hidden" />
	</label>

	<label class="btn join-item" class:btn-accent={display_preference === 'table'}>
		<Icon icon="uiw:table" class="h-6 w-6" />
		<input type="radio" bind:group={display_preference} value="table" class="hidden" />
	</label>
</fieldset>
