<script lang="ts">
	import Features from './Features.svelte'
	import Concept from './Concept.svelte'
	import type { SourceConcept, SourceEntity } from '$lib/types'

	interface Props {
		source_entity: SourceEntity
		selected_concept?: SourceConcept
	}

	let {
		source_entity,
		selected_concept = {
			stem: '',
			sense: '',
			part_of_speech: '',
		},
	}: Props = $props()

	let concept = $derived(source_entity.concept!)
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
