<script lang="ts">
	import Features from './Features.svelte'
	import Concept from './Concept.svelte'

	export let source_entity: SourceEntity

	const concept = source_entity.concept!	// will always be non-null at this point
</script>

<span class="inline-flex px-1 tracking-normal">
	<Features {source_entity}>
		{#if source_entity.pairing_concept === null}
			<Concept data={concept} />
		{:else}
			<Concept data={concept} />/<Concept data={source_entity.pairing_concept} />
		{/if}
	</Features>
</span>
