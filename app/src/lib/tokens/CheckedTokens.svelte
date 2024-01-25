<script>
	import Error from './Error.svelte'
	import FunctionWord from './FunctionWord.svelte'
	import Loading from './Loading.svelte'
	import Result from './Result.svelte'
	import Note from './Note.svelte'
	import NotFound from './NotFound.svelte'
	import Pairing from './Pairing.svelte'
	import Punctuation from './Punctuation.svelte'
	import {check_ontology} from '$lib/lookups'
	import {function_words, REGEXES} from '$lib'

	/** @type {CheckedToken[]} */
	export let checked_tokens
</script>

{#each checked_tokens as checked_token}
	{@const {message, token} = checked_token}
	{@const has_error = !!message}
	{@const is_punctuation = REGEXES.IS_PUNCTUATION.test(token)}
	{@const is_special_notation = REGEXES.IS_NOTES_NOTATION.test(token) || REGEXES.IS_CLAUSE_NOTATION.test(token)}
	{@const is_pairing = REGEXES.IS_PAIRING.test(token)}
	{@const is_function_word = function_words.includes(token)}

	{#if has_error}
		<Error {checked_token} />
	{:else if is_punctuation}
		<Punctuation {checked_token} />
	{:else if is_special_notation}
		<Note {checked_token} />
	{:else if is_function_word}
		<FunctionWord {checked_token} />
	{:else if is_pairing}
		<Pairing {checked_token} />
	{:else}
		{#await check_ontology(checked_token)}
			<Loading {checked_token} />
		{:then result}
			<Result {result} />
		{:catch}
			<NotFound {checked_token} />
		{/await}
	{/if}
{/each}
