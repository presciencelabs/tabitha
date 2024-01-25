<script>
	import Token from './Token.svelte'
	/** @type {CheckedToken} */
	export let checked_token

	export let classes = ''
</script>

<Token {classes}>
	{checked_token.token}
</Token>
