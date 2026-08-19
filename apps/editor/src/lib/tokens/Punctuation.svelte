<script lang="ts">
	import type { SimpleToken } from '@tabitha/types'
	import TokenDisplay from './TokenDisplay.svelte'

	interface Props {
		token: SimpleToken
		classes?: string
	}

	let { token, classes = '' }: Props = $props()
</script>

{#if classes.includes('join-item')}
	<TokenDisplay {classes}>{token.token}</TokenDisplay>
{:else}
	<span class="pb-3 text-6xl font-thin {classes}">
		{token.token}
	</span>
{/if}
