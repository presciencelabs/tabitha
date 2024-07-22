<script>
    import { LOOKUP_FILTERS } from '$lib/lookup_filters'
	import NotFound from './NotFound.svelte'
	import Result from './Result.svelte'

	/** @type {SimpleToken} */
	export let token
	export let classes = ''
</script>

{#if token.lookup_results.some(LOOKUP_FILTERS.IS_OR_WILL_BE_IN_ONTOLOGY)}
	<Result {token} {classes} />
{:else}
	<NotFound {token} {classes} />
{/if}