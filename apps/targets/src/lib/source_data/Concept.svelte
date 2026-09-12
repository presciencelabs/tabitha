<script lang="ts">
	import { PUBLIC_ONTOLOGY_API_HOST } from '$env/static/public'
	import type { ConceptKey } from '@tabitha/types'

	let { data }: { data: ConceptKey } = $props()
	let concept = $derived(`${data.stem}-${data.sense}`)
</script>

<span class="text-sm tracking-tight">
	<a href="{PUBLIC_ONTOLOGY_API_HOST}/?q={concept}" target="_blank" class="link-hover not-prose">
		{concept}
	</a>
</span>
