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
		display: flex;
		gap: calc(var(--pico-spacing) * 2);

		padding-block-end: 0; /* there was a little too much bottom padding when combined with main's top padding */
	}

	footer {
		display: flex;
		justify-content: flex-end;
	}
</style>