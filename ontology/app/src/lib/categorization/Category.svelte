<script>
	import {TBD, ThetaGrid, UsageInfo} from '.'

	/** @type {Concept} */
	export let concept

	/**
	 * @type {Record<Concept['part_of_speech'], ConstructorOfATypedSvelteComponent>}
	 */
	const lookup = {
		Adjective: UsageInfo,
		Verb: ThetaGrid,
	}

	$: categories = concept.categories
	$: component = lookup[concept.part_of_speech] || TBD
</script>

<svelte:component this={component} {categories} />
