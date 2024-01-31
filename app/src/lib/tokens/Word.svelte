<script>
	import { check_ontology } from "$lib/lookups"
	import Loading from "./Loading.svelte"
	import NotFound from "./NotFound.svelte"
	import Result from "./Result.svelte"

	/** @type {Token} */
	export let token
</script>

{#await check_ontology(token)}
	<Loading {token} />
{:then result}
	<Result {token} {result} />
{:catch}
	<NotFound {token} />
{/await}