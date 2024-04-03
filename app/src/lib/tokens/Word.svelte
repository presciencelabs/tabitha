<script>
	import NotFound from './NotFound.svelte'
	import Result from './Result.svelte'

	/** @type {SimpleToken} */
	export let token
	export let classes = ''

	/**
	 * @param {SimpleToken} token
	 */
	function token_has_ontology_result(token) {
		return token.lookup_results.some(result => result.level !== -1)
	}
</script>

{#if token_has_ontology_result(token)}
	<Result {token} {classes} />
{:else}
	<NotFound {token} {classes} />
{/if}