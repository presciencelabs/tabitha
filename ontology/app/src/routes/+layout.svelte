<script>
	import '$lib/app.css'
	import Brand from '$lib/Brand.svelte'
	import Search from '$lib/Search.svelte'

</script>

<header class="container">
	<Brand />

	<Search autofocus />
</header>

<main class="container">
	<slot></slot>
</main>

<footer class="container">
	<a href="https://btn.social" target="_blank" data-tooltip="Not implemented yet">Administer</a>
</footer>

<style>
	header {
		display: grid;

		/* there was a little too much vertical padding */
		padding-block-start: calc(var(--pico-block-spacing-vertical) * 0.5);
		padding-block-end: 0;
	}

	footer {
		display: flex;
		justify-content: flex-end;
	}
</style>