<script>
	import {PUBLIC_ONTOLOGY_API_HOST} from '$env/static/public'
	import TokenDisplay from './TokenDisplay.svelte'

	/** @type {Token} */
	export let token
	export let classes = ''

	// TODO: more work needed to handle multiple matches with possibly different levels, e.g., son
	const concept = token.lookup_results[0]
	const tooltip = token.lookup_results.map(display_concept).join('; ')

	const lookup_term = token.lookup_results.length === 1 ? display_concept(token.lookup_results[0]) : token.lookup_results[0].stem

	/**
	 * @param {OntologyResult} concept
	 */
	function display_concept(concept) {
		return `${concept.stem}-${concept.sense}`
	}
</script>

<div class='tooltip' data-tip={tooltip}>
	<TokenDisplay classes="{classes} L{concept.level}">
		<a class="link link-hover not-prose L{concept.level}-text" href={`${PUBLIC_ONTOLOGY_API_HOST}/?q=${lookup_term}`} target="_blank">
			{token.token}
		</a>
	</TokenDisplay>
</div>
