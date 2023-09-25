<script>
	/** @type {import('./$types').PageData} */
	export let data;

	$: matches = data.matches
</script>

{#each matches as { id, stem }}
	<div>{id} {stem}</div>
{:else}
	<h1>Welcome to TaBiThA's Ontology application</h1>
{/each}