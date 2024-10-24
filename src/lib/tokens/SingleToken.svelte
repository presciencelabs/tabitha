<script>
	import FunctionWord from './FunctionWord.svelte'
	import Note from './Note.svelte'
	import Punctuation from './Punctuation.svelte'
	import Word from './Word.svelte'
	import Message from './Message.svelte'
	import { TOKEN_TYPE, token_has_message } from '$lib/token'

	/** @type {SimpleToken} */
	export let token

	/** @type {Map<TokenType, typeof Word>}*/
	const component_map = new Map([
		[TOKEN_TYPE.FUNCTION_WORD, FunctionWord],
		[TOKEN_TYPE.NOTE, Note],
		[TOKEN_TYPE.PUNCTUATION, Punctuation],
		[TOKEN_TYPE.LOOKUP_WORD, Word],
	])

	const component = component_map.get(token.type)
</script>

{#if token_has_message(token)}
	<div class="join">
		<Message {token} />
		<svelte:component this={component} {token} classes="join-item" />
	</div>
{:else}
	<svelte:component this={component} {token} />
{/if}