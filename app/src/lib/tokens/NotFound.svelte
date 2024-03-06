<script>
	import TokenDisplay from './TokenDisplay.svelte'

	/** @type {Token} */
	export let token
	export let classes = ''
</script>

<TokenDisplay {classes}>
	{token.token}
</TokenDisplay>
