<script>
	import { PUBLIC_ONTOLOGY_API_HOST } from '$env/static/public'
	import { concept_with_sense } from '$lib/parser/token'

	/** @type {Token} */
	export let token
	export let classes = ''
	
	const lookup_term = token.lookup_results.length === 1 && token.lookup_results[0].concept !== null
		? concept_with_sense(token.lookup_results[0].concept)
		: token.lookup_results[0].stem

</script>

<a class="link link-hover not-prose {classes}" href={`${PUBLIC_ONTOLOGY_API_HOST}/?q=${lookup_term}`} target="_blank">
	{token.token}
</a>