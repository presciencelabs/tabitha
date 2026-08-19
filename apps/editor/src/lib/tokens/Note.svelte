<script lang="ts">
	import type { SimpleToken } from '@tabitha/types'
	import TokenDisplay from './TokenDisplay.svelte'

	type Props = {
		token: SimpleToken
		classes?: string
	}

	let { token, classes = '' }: Props = $props()
</script>

{#if classes.includes('join-item')}
	<TokenDisplay {classes}>{token.token}</TokenDisplay>
{:else}
	<span class="font-mono text-lg tracking-widest {classes}">
		{token.token}
	</span>
{/if}
