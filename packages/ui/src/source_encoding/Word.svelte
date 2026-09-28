<script lang="ts">
	import Features from './Features.svelte'
	import Concept from './Concept.svelte'
	import type { ConceptKey, SourceEntity } from '@tabitha/types'

	type Props = {
		source_entity: SourceEntity
		ontology_base_url: string
		/** lowercased phrase words to highlight a matching concept against, if searching by phrase */
		highlight_terms?: Set<string>
		/** the concept to highlight a matching concept against */
		highlight_concept?: ConceptKey
	}

	let { source_entity, ontology_base_url, highlight_terms, highlight_concept }: Props = $props()

	let concept = $derived(source_entity.concept!)

	// Exact match only for highlight_terms: the concept stem is the dictionary form (e.g. "be"), not whatever's
	// actually inflected in the phrase (e.g. "was"), so this catches most nouns/adjectives and
	// already-base-form verbs, but misses conjugated ones. Still worth doing -- it draws the eye
	// to roughly the right place even when it can't underline every matching word.
	let matched = $derived(matches(concept) || matches(source_entity.pairing_concept))
	
	function matches(concept: ConceptKey | null) {
		return concept && (matches_terms(concept) || matches_concept(concept))
	}

	function matches_terms(concept: ConceptKey) {
		return highlight_terms?.has(concept.stem.toLowerCase())
	}

	function matches_concept({ stem, sense, part_of_speech }: ConceptKey) {
		return highlight_concept && stem === highlight_concept.stem && sense === highlight_concept.sense && part_of_speech === highlight_concept.part_of_speech
	}
</script>

<span class="inline-flex px-1 tracking-normal rounded-sm" class:bg-warning={matched} class:text-warning-content={matched}>
	<Features {source_entity}>
		<Concept data={concept} {ontology_base_url} />
		{#if source_entity.pairing_concept}
			{@const separator = source_entity.pairing_type === 'dynamic-literal' ? '|' : '/'}
			{separator}<Concept data={source_entity.pairing_concept} {ontology_base_url} />
		{/if}
	</Features>
</span>
