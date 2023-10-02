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
	<form role="search">
		<input type="search" name="query" placeholder="Search" bind:this={input} />
		<input type="submit" value="Search" />	
	</form>

	<progress class:busy={$navigating} />
</search>

<style>
	/* chose visibility here to keep results from jumping up and down */
	progress {
		visibility: hidden;
	}
	progress.busy {
		visibility: visible;
	}
</style>
