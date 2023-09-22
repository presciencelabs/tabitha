<script>
	import '@picocss/pico'
	import Search from '$lib/Search.svelte'

</script>

<header class="container">
	<hgroup>
		<h1>Ontology</h1>
		<h2>TaBiThA</h2>
	</hgroup>

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