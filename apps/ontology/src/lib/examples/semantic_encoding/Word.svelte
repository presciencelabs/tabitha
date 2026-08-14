<script lang="ts">
	import Features from './Features.svelte'
	import Concept from './Concept.svelte'

	export let source_entity: SourceEntity

	export let selected_concept: SourceConcept = {
		stem: '',
		sense: '',
		part_of_speech: '',
	}

	const concept = source_entity.concept!	// will always be non-null at this point
</script>

<span class="inline-flex px-1 tracking-normal">
	<Features {source_entity}>
		{#if source_entity.pairing_concept === null}
			<Concept data={concept} {selected_concept} />
		{:else}
			<Concept data={concept} {selected_concept} />/<Concept data={source_entity.pairing_concept} {selected_concept} />
		{/if}
	</Features>
</span>
