<script>
	import Token from './Token.svelte'

	/** @type {LookupResult<OntologyResult>} */
	export let result

	export let classes = ''

	// TODO: more work needed to handle multiple matches with possibly different levels, e.g., son
	const match = result.matches[0]
</script>

<Token classes="{classes} L{match?.level}">
	{result.term}
</Token>
