<script>
	import Icon from '@iconify/svelte'

	/** @type {Concept} */
	export let concept
</script>

{#if concept.status === 'not used'}
	<div role="alert" class="alert alert-error">
		<Icon icon="mdi:error-outline" class="h-6 w-6" />
		<span class="font-bold">{concept.gloss}</span>
	</div>
{:else if concept.status === 'suggested'}
	<div role="alert" class="alert alert-warning">
		<Icon icon="mdi:alert-outline" class="h-6 w-6" />
		<span class="font-bold">{concept.gloss}</span>
	</div>
{:else}
	{concept.gloss}
{/if}
