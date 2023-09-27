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
		<a href="/?query">Show me everything</a>
	{/each}
</section>

<style>
	a {
		justify-self: center;
	}

	section {
		/* overrode pico's grid system here to ensures there are never more than about 4 columns per row */
		grid-template-columns: repeat(auto-fit, minmax(20ch,1fr));
	}
</style>