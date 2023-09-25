<script>
	import '@picocss/pico'
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
	<a href="https://btn.social">Administer</a>
</footer>

<style>
	header {
		display: flex;
		gap: calc(var(--spacing) * 2);
	}

	footer {
		display: flex;
		justify-content: flex-end;
	}
</style>