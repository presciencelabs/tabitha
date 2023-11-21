<script>
	import {SemanticCategorization, TBD, ThetaGrid, UsageInfoForAdjective, UsageInfoForAdverb} from '.'

	/** @type {Concept} */
	export let concept

	/**
	 * @type {Record<Concept['part_of_speech'], ConstructorOfATypedSvelteComponent>}
	 */
	const lookup = {
		Adjective: UsageInfoForAdjective,
		Adposition: UsageInfoForAdverb,
		Adverb: UsageInfoForAdverb,
		Noun: SemanticCategorization,
		Verb: ThetaGrid,
	}

	$: categories = concept.categories
	$: component = lookup[concept.part_of_speech] || TBD
</script>

<svelte:component this={component} {categories} />
