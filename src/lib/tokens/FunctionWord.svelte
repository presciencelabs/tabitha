<script>
	import TokenDisplay from './TokenDisplay.svelte'

	/** @type {{ token: SimpleToken, classes?: string }}*/
	let { token, classes = '' } = $props()
</script>

{#if classes.includes('join-item')}
	<TokenDisplay classes="!px-2 {classes}">{token.token}</TokenDisplay>
{:else}
	<span class="{classes}">
		{token.token}
	</span>
{/if}
