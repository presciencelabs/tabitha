<script>
	import TokenDisplay from './TokenDisplay.svelte'

	/** @type {SimpleToken} */
	export let token
	export let classes = ''
</script>

{#if classes.includes('join-item')}
	<TokenDisplay {classes}>{token.token}</TokenDisplay>
{:else}
	<span class="font-mono text-lg tracking-widest {classes}">
		{token.token}
	</span>
{/if}
