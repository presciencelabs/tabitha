<script lang="ts">
	interface Props {
		usages: string[]
	}

	let { usages }: Props = $props()

	let always_usages = $derived(usages.filter(usage => usage.startsWith('always')))
	let sometimes_usages = $derived(usages.filter(usage => usage.startsWith('sometimes')))
	let has_usages = $derived(always_usages.length > 0 || sometimes_usages.length > 0)
</script>

{#if has_usages}
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
