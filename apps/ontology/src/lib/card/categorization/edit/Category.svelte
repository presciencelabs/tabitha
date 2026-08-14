<script>
	import AdjectiveCategorization from './AdjectiveCategorization.svelte'
	import SemanticCategorization from './SemanticCategorization.svelte'
	import ThetaGrid from './ThetaGrid.svelte'
	import UsageInfo from './UsageInfo.svelte'

	/** @type {{ part_of_speech: string, categories: string[] }}*/
	let { part_of_speech, categories = $bindable() } = $props()

	/**
	 * @type {Record<Concept['part_of_speech'], typeof SemanticCategorization>}
	 */
	const lookup = {
		Adjective: AdjectiveCategorization,
		Adposition: UsageInfo,
		Adverb: UsageInfo,
		Conjunction: UsageInfo,
		Noun: SemanticCategorization,
		Verb: ThetaGrid,
	}

	let Component = $derived(lookup[part_of_speech])
</script>

{#if Component}
	<Component bind:categories={categories} {part_of_speech} />
{/if}
