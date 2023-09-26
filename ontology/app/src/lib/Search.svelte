<script>
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
	<form>
		<input type="search" name="query" placeholder="Search" bind:this={input} />
		<button>Search</button>
	</form>
</search>

<style>
	search {
		width: 100%;
	}

	form {
		display: flex;
		align-items: flex-start; /* keeps the button from stretching vertically */
		gap: var(--pico-spacing);
	}
</style>
