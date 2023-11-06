<script>
	/** @type {Concept['categories']} */
	export let categories
</script>

<figure class="font-mono text-sm overflow-x-auto mt-0">
	{#each categories as category}
		<span class="p-2 border-4 border-double whitespace-nowrap">
			{category}
		</span>
	{/each}
</figure>

<style>
	/* had to override daisy's `.card figure` definition so I could get the items to left-align */
	figure {
		display: flex;
		justify-content: flex-start;
	}
</style>