<script lang="ts">
	import type { CheckerToken } from '@tabitha/types'
	import Message from './Message.svelte'
	import TokenDisplay from './TokenDisplay.svelte'
	import Word from './Word.svelte'
	import Pairing from './Pairing.svelte'

	type Props = {
		token: CheckerToken
	}

	let { token }: Props = $props()

	let pronoun = $derived(token.pronoun!)	// the pronoun will always be non-null at this point
</script>

<!--This is assumed to already be within a div with the class 'join'-->
<Message token={pronoun} />
<TokenDisplay classes="!px-2 join-item">{pronoun.token}</TokenDisplay>

<TokenDisplay classes="!px-1.5 [font-family:cursive] join-item">(</TokenDisplay>

{#if token.pairing}
	<Pairing {token} />
{:else}
	<Message {token} />
	<Word {token} classes="join-item" />
{/if}

<TokenDisplay classes="!px-1.5 [font-family:cursive] join-item">)</TokenDisplay>
