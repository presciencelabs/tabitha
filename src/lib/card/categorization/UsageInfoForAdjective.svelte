<script lang="ts">
	interface Props {
		categories: string[]
	}

	let { categories }: Props = $props()

	let semantic_category = $derived(categories[0] || '')
	let usages = $derived(categories.slice(1))
	let always_usages = $derived(usages.filter(usage => usage.startsWith('always')))
	let sometimes_usages = $derived(usages.filter(usage => usage.startsWith('sometimes')))
	let grouped_usages = $derived([...always_usages, ...sometimes_usages])
</script>

<fieldset class="prose rounded-lg border p-4">
	<legend class="rounded-lg bg-base-200 px-2 text-lg font-bold tracking-widest">
		{semantic_category || 'None'}
	</legend>

	{#if grouped_usages.length}
		<dl class="mt-0">
			{#if always_usages.length}
				<dt class="mt-0 italic">Always...</dt>

				{#each always_usages as usage}
					<dd>{usage.replace('always ', '')}</dd>
				{/each}
			{/if}

			{#if sometimes_usages.length}
				<dt class="mt-0 italic">Sometimes...</dt>

				{#each sometimes_usages as usage}
					<dd>{usage.replace('sometimes ', '')}</dd>
				{/each}
			{/if}
		</dl>
	{:else}
		<p class="mt-0 italic">No usage information available.</p>
	{/if}
</fieldset>
