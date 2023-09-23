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
	<a href="https://btn.social">Administer (TODO)</a>
</footer>

<style>
	header {
		display: flex;
	}

	footer {
		display: flex;
		justify-content: flex-end;
	}
</style>