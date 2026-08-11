<script>
	import LookupWord from './LookupWord.svelte'
	import Added from './Added.svelte'
	import SingleToken from './SingleToken.svelte'
	import Clause from './Clause.svelte'
	import { TOKEN_TYPE } from '$lib/token'

	/** @type {{ tokens: SimpleToken[] }}*/
	let { tokens } = $props()

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
	{@const Component = component_map.get(token.type)}
	<Component {token} />
{/each}
