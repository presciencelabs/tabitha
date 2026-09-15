<script lang="ts">
	import Features from './Features.svelte'
	import Concept from './Concept.svelte'
	import type { SourceEntity } from '@tabitha/types'

	type Props = {
		source_entity: SourceEntity
		/** lowercased phrase words to highlight a matching concept against, if searching by phrase */
		highlight_terms?: Set<string>
	}

	let { source_entity, highlight_terms }: Props = $props()

	let concept = $derived(source_entity.concept!)

	// Exact match only: the concept stem is the dictionary form (e.g. "be"), not whatever's
	// actually inflected in the phrase (e.g. "was"), so this catches most nouns/adjectives and
	// already-base-form verbs, but misses conjugated ones. Still worth doing -- it draws the eye
	// to roughly the right place even when it can't underline every matching word.
	let matched = $derived(highlight_terms?.has(concept.stem.toLowerCase()) ?? false)
</script>

<span class="inline-flex px-1 tracking-normal rounded-sm" class:bg-warning={matched} class:text-warning-content={matched}>
	<Features {source_entity}>
		<Concept data={concept} />
		{#if source_entity.pairing_concept}
			/<Concept data={source_entity.pairing_concept} />
		{/if}
	</Features>
</span>
