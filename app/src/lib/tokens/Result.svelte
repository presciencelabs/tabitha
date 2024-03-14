<script>
	import { concept_with_sense } from '$lib/parser/token'
	import LinkedLookup from './LinkedLookup.svelte'
	import TokenDisplay from './TokenDisplay.svelte'

	/** @type {Token} */
	export let token
	export let classes = ''

	// TODO: more work needed to handle multiple matches with possibly different levels, e.g., son
	/** @type {OntologyResult[]} */
	// @ts-ignore
	const concepts = token.lookup_results.map(result => result.concept).filter(concept => concept !== null)
	
	const concept = concepts[0]
	const tooltip = concepts.map(concept_with_sense).join('; ')
</script>

<div class='tooltip' data-tip={tooltip}>
	<TokenDisplay classes={`L${concept.level} ${classes}`}>
		<LinkedLookup {token} classes={`L${concept.level}-text`} />
	</TokenDisplay>
</div>
