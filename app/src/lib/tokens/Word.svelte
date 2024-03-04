<script>
	import {TOKEN_TYPE, token_has_concept} from '$lib/parser/token'
	import Error from './Error.svelte'
	import NotFound from './NotFound.svelte'
	import Result from './Result.svelte'

	/** @type {Token} */
	export let token
	export let classes = ''
</script>

{#if token.type === TOKEN_TYPE.ERROR || token.message.length > 0}
	<Error {token} {classes} />
{:else if token_has_concept(token)}
	<Result {token} {classes} />
{:else}
	<NotFound {token} {classes} />
{/if}