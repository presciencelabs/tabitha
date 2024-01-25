<script>
	import Token from './Token.svelte'

	/** @type {CheckedToken} */
	export let checked_token
</script>

<Token classes="opacity-30">
	{checked_token.token}

	<!-- used absolute here to avoid any layout shift (centers the pulse as well) -->
	<span class="loading loading-ring loading-lg absolute" />
</Token>
