<script>
	import SemanticCategorization from './SemanticCategorization.svelte'
	import TBD from './TBD.svelte'
	import ThetaGrid from './ThetaGrid.svelte'
	import UsageInfoForAdjective from './UsageInfoForAdjective.svelte'
	import UsageInfoForParticles from './UsageInfoForParticles.svelte'

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
