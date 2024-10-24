<script>
	import { token_has_message } from '$lib/token'
	import Message from './Message.svelte'
	import TokenDisplay from './TokenDisplay.svelte'

	/** @type {SimpleToken} */
	export let token
</script>

{#if token_has_message(token)}
	<Message {token}>
		<span class="text-lg tracking-widest">
			{token.token}
		</span>
	</Message>
{:else}
	<TokenDisplay>
		{token.token}
	</TokenDisplay>
{/if}
