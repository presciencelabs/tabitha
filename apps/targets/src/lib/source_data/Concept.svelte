<script lang="ts">
	import { PUBLIC_ONTOLOGY_API_HOST } from '$env/static/public'
	import type { SourceConcept } from '$lib/types'

	let { data }: { data: SourceConcept } = $props()
	let concept = $derived(`${data.stem}-${data.sense}`)
</script>

<span class="text-sm tracking-tight">
	<a target="_blank" class="link-hover not-prose" href="{PUBLIC_ONTOLOGY_API_HOST}/?q={concept}">
		{concept}
	</a>
</span>
