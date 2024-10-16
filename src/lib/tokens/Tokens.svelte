<script>
	import LookupWord from './LookupWord.svelte'
	import Added from './Added.svelte'
	import SingleToken from './SingleToken.svelte'
	import Clause from './Clause.svelte'
	import { TOKEN_TYPE } from '$lib/parser/token'

	/** @type {SimpleToken[]} */
	export let tokens

	/** @type {Map<TokenType, typeof LookupWord>}*/
	const component_map = new Map([
		[TOKEN_TYPE.CLAUSE, Clause],
		[TOKEN_TYPE.FUNCTION_WORD, SingleToken],
		[TOKEN_TYPE.NOTE, SingleToken],
		[TOKEN_TYPE.PUNCTUATION, SingleToken],
		[TOKEN_TYPE.LOOKUP_WORD, LookupWord],
		[TOKEN_TYPE.ADDED, Added],
	])
</script>

{#each tokens as token}
	{@const component = component_map.get(token.type)}
	<svelte:component this={component} {token} />
{/each}
