<script>
	
	/** @type {import('./$types').PageData} */
	export let data

	$: matches = data.matches
</script>

<section class="grid">
	{#each matches as { id, stem }}
		<article>
			<header>{stem}</header>
	
			id: {id}
		</article>
	{:else}
		<h1>Welcome to TaBiThA's Ontology application</h1>
	{/each}
</section>

<style>
	h1 {
		justify-self: center;
	}
</style>