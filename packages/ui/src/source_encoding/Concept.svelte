<script lang="ts">
	import type { ConceptKey } from '@tabitha/types'

	let { data, ontology_base_url }: { data: ConceptKey, ontology_base_url: string } = $props()
	let concept = $derived(`${data.stem}-${data.sense}`)
</script>

<span class="text-sm tracking-tight">
	<a href="{ontology_base_url}/?q={concept}" target="_blank" class="link-hover not-prose">
		{concept}
	</a>
</span>
