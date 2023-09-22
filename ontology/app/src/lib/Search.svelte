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

<form>
	<input type="search" name="search" placeholder="Search" bind:this={input} />
</form>

<style>
	form {
		padding-inline-start: calc(var(--spacing) * 2);
		width: 100%;

		display: flex;
		align-items: center;
	}

	form > input {
		margin-bottom: 0;
	}
</style>
