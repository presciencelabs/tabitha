<script>
	import TokenDisplay from './TokenDisplay.svelte'

	/** @type {Token} */
	export let token
	export let classes = ''

	// TODO: more work needed to handle multiple matches with possibly different levels, e.g., son
	const concept = token.concept || token.lookup_results[0]
</script>

<TokenDisplay classes="{classes} L{concept.level}">
	{token.token}
</TokenDisplay>
