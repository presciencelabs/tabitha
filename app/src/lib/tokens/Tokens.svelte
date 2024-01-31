<script>
	import Error from './Error.svelte'
	import FunctionWord from './FunctionWord.svelte'
	import Note from './Note.svelte'
	import Pairing from './Pairing.svelte'
	import Punctuation from './Punctuation.svelte'
	import Word from './Word.svelte'
	import {TOKEN_TYPE} from '$lib/parser/token'

	/** @type {Token[]} */
	export let tokens

	const component_map = new Map([
		[TOKEN_TYPE.ERROR, Error],
		[TOKEN_TYPE.FUNCTION_WORD, FunctionWord],
		[TOKEN_TYPE.NOTE, Note],
		[TOKEN_TYPE.PAIRING, Pairing],
		[TOKEN_TYPE.PUNCTUATION, Punctuation],
		[TOKEN_TYPE.LOOKUP_WORD, Word],
	])
</script>

{#each tokens as token}
	{@const component = component_map.get(token.type)}
	<svelte:component this={component} {token} />
{/each}
