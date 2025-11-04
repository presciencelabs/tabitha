<script>
	import { PUBLIC_ONTOLOGY_API_HOST } from '$env/static/public'

	/** @type {SourceConcept} */
	export let data
	const concept = `${data.stem}-${data.sense}`
</script>

<span class="text-sm tracking-tight">
	<a target="_blank" class="link-hover not-prose" href="{PUBLIC_ONTOLOGY_API_HOST}/?q={concept}">
		{concept}
	</a>
</span>
