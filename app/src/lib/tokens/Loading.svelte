<script>
	import TokenDisplay from './TokenDisplay.svelte'

	/** @type {Token} */
	export let token
</script>

<TokenDisplay classes="opacity-30">
	{token.token}

	<!-- used absolute here to avoid any layout shift (centers the pulse as well) -->
	<span class="loading loading-ring loading-lg absolute" />
</TokenDisplay>
