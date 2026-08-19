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
	<TokenDisplay classes="!px-2 {classes}">{token.token}</TokenDisplay>
{:else}
	<span class={classes}>
		{token.token}
	</span>
{/if}
