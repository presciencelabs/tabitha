<script>
	import TokenDisplay from './TokenDisplay.svelte'

	/** @type {SimpleToken} */
	export let token
	export let classes = ''
</script>

{#if classes.includes('join-item')}
	<TokenDisplay {classes}>{token.token}</TokenDisplay>
{:else}
	<span class="pb-3 text-6xl font-thin {classes}">
		{token.token}
	</span>
{/if}
