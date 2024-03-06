<script>
	import {token_has_concept} from '$lib/parser/token'
	import NotFound from './NotFound.svelte'
	import Result from './Result.svelte'

	/** @type {Token} */
	export let token
	export let classes = ''
</script>

{#if token_has_concept(token)}
	<Result {token} {classes} />
{:else}
	<NotFound {token} {classes} />
{/if}