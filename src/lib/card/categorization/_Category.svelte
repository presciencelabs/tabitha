<script>
	import SemanticCategorization from './_SemanticCategorization.svelte'
	import TBD from './_TBD.svelte'
	import ThetaGrid from './_ThetaGrid.svelte'
	import UsageInfoForAdjective from './_UsageInfoForAdjective.svelte'
	import UsageInfoForParticles from './_UsageInfoForParticles.svelte'

	/** @type {Concept} */
	export let concept

	/**
	 * @type {Record<Concept['part_of_speech'], ConstructorOfATypedSvelteComponent>}
	 */
	const lookup = {
		Adjective: UsageInfoForAdjective,
		Adposition: UsageInfoForParticles,
		Adverb: UsageInfoForParticles,
		Conjunction: UsageInfoForParticles,
		Noun: SemanticCategorization,
		Verb: ThetaGrid,
	}

	$: categories = concept.categories
	$: component = lookup[concept.part_of_speech] || TBD
</script>

<svelte:component this={component} {categories} />
