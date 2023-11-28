<script>
	/** @type {Concept['categories']} */
	export let categories
</script>

<figure class="mt-0 overflow-x-auto font-mono text-sm">
	{#each categories as category}
		<span class="whitespace-nowrap border-4 border-double p-2">
			{category}
		</span>
	{:else}
		No theta grid information available.
	{/each}
</figure>

<style>
	/* had to override daisy's `.card figure` definition so I could get the items to left-align */
	figure {
		display: flex;
		justify-content: flex-start;
	}
</style>
