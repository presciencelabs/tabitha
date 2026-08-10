<script>
	import Icon from '@iconify/svelte'

	/** @type {Concept} */
	export let concept

	/** @type {boolean} */
	export let compact = false
</script>

{#if concept.status === 'not used'}
	{#if compact}
		<span class="badge badge-error badge-soft gap-1 font-semibold">
			<Icon icon="mdi:error-outline" class="h-4 w-4" />
			{concept.gloss}
		</span>
	{:else}
		<div role="alert" class="alert alert-error alert-soft">
			<Icon icon="mdi:error-outline" class="h-6 w-6" />
			<span class="font-bold">{concept.gloss}</span>
		</div>
	{/if}
{:else if concept.status === 'suggested'}
	{#if compact}
		<span class="badge badge-warning badge-soft gap-1 font-semibold">
			<Icon icon="mdi:alert-outline" class="h-4 w-4" />
			{concept.gloss}
		</span>
	{:else}
		<div role="alert" class="alert alert-warning alert-soft">
			<Icon icon="mdi:alert-outline" class="h-6 w-6" />
			<span class="font-bold">{concept.gloss}</span>
		</div>
	{/if}
{:else}
	{concept.gloss}
{/if}
