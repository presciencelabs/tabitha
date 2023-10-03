<script>
	import '$lib/app.css'
	import Brand from '$lib/Brand.svelte'
	import Search from '$lib/Search.svelte'

</script>

<header>
	<Brand />
</header>

<main>
	<section>
		<Search autofocus />
	</section>

	<section>
		<slot></slot>
	</section>
</main>

<footer>
	<a href="https://btn.social" target="_blank" data-tooltip="Not implemented yet">Administer</a>
</footer>

<style>
</style>