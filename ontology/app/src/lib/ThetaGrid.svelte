<script>
	/** @type {Concept['categories']} */
	export let categories
</script>

<figure>
	{#each categories as category}
		<span class="p-4 border-double border-8 font-mono whitespace-nowrap">{category}</span>
	{/each}
</figure>
