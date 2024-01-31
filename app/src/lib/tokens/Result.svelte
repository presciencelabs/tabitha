<script>
	import TokenDisplay from './TokenDisplay.svelte'

	/** @type {Token} */
	export let token
	/** @type {LookupResult<OntologyResult>} */
	export let result

	export let classes = ''

	// TODO: more work needed to handle multiple matches with possibly different levels, e.g., son
	const match = result.matches[0]
</script>

<TokenDisplay classes="{classes} L{match?.level}">
	{token.token}
</TokenDisplay>
