<script>
	/** @type {import('./$types').PageData} */
	export let data;

$: matches = data.matches
</script>

{#if matches.length}
	<pre>{JSON.stringify(data, null, 3)}</pre>
{:else}
	<h1>Welcome to TaBiThA's Ontology application</h1>
{/if}
