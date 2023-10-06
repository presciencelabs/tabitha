<script>
	import { navigating } from '$app/stores'
	import { onMount } from 'svelte'

	export let autofocus = false

	/** @type HTMLInputElement */
	let input

	onMount(autofocusIfRequested)

	function autofocusIfRequested() {
		autofocus && input?.focus()
	}
</script>

<!-- https://developer.mozilla.org/en-US/docs/Web/HTML/Element/search -->
<search>
	<!-- used role for this: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/search#search_form_labels_and_accessibility -->
	<form role="search">
		<input type="search" name="q" placeholder="Search" bind:this={input} class="input input-lg input-bordered input-primary w-full" />
		<!-- TODO: (UX) do we need a button as well? -->
	</form>

	<!-- TODO: consider this block to be a place for possible actions like radio buttons, filters, etc. -->

	<!-- chose visibility here to keep results from jumping up and down -->
	<progress class:!visible={$navigating} class="progress progress-warning invisible" />
</search>
