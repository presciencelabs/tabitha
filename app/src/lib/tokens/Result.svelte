<script>
	import TokenDisplay from './TokenDisplay.svelte'

	/** @type {Token} */
	export let token
	export let classes = ''

	// TODO: more work needed to handle multiple matches with possibly different levels, e.g., son
	const concept = token.concept || token.lookup_results[0]
	const tooltip = token.concept ? display_concept(token.concept) : token.lookup_results.map(display_concept).join('; ')

	/**
	 * @param {OntologyResult} concept
	 */
	function display_concept(concept) {
		return `${concept.stem}-${concept.sense}`
	}
</script>

<div class='tooltip' data-tip={tooltip}>
	<TokenDisplay classes="{classes} L{concept.level}">
		{token.token}
	</TokenDisplay>
</div>
