<script>
	import { semantic_category } from '$lib/lookups'

	/** @type {{ part_of_speech: string, categories: string[] }} */
	const { part_of_speech, categories = $bindable() } = $props()
</script>

<fieldset class="fieldset border border-base-300 rounded-box p-4">
	<legend class="fieldset-legend font-semibold">Semantic category</legend>

	<select bind:value={categories[0]} name="categories[]" class="select">
		{#each Object.values(semantic_category[part_of_speech]) as category}
			<option value={category}>{category}</option>
		{/each}
	</select>
</fieldset>
