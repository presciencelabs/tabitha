<script lang="ts">
	import Features from './Features.svelte'
	import Concept from './Concept.svelte'
	import type { ConceptKey, SourceEntity } from '@tabitha/types'

	type Props = {
		source_entity: SourceEntity
		selected_concept?: ConceptKey
	}

	let {
		source_entity,
		selected_concept = {
			stem: '',
			sense: '',
			part_of_speech: 'Noun',
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
