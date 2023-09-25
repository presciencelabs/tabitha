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
		gap: var(--spacing);
		align-items: center;
	}

	form > * {
		margin-bottom: 0; /* allows for vertical centering above */
	}

	button {
		width: auto; /* needed to override pico's 100% so the button was only as big as it's content */
	}
</style>
