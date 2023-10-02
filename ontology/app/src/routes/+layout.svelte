<script>
	import '$lib/app.css'
	import Brand from '$lib/Brand.svelte'
	import Search from '$lib/Search.svelte'

</script>

<header class="container">
	<Brand />
</header>

<main class="container">
	<section>
		<Search autofocus />
	</section>
	
	<section>
		<slot></slot>
	</section>
</main>

<footer class="container">
	<a href="https://btn.social" target="_blank" data-tooltip="Not implemented yet">Administer</a>
</footer>

<style>
	header, main {
		/* there was a little too much vertical padding */
		padding-block-start: calc(var(--pico-block-spacing-vertical) * 0.25);
		padding-block-end: 0;
	}

	footer {
		display: flex;
		justify-content: flex-end;
	}
</style>