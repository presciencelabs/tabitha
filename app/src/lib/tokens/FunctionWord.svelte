<script>
	import TokenDisplay from './TokenDisplay.svelte'

	/** @type {Token} */
	export let token
	export let classes = ''
</script>

{#if classes.includes('join-item')}
	<TokenDisplay classes="!px-2 {classes}">{token.token}</TokenDisplay>
{:else}
	<span class="{classes}">
		{token.token}
	</span>
{/if}
