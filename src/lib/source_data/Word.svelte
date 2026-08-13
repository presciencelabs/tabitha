<script lang="ts">
	import Features from './Features.svelte'
	import Concept from './Concept.svelte'
	import type { SourceEntity } from '$lib/types'

	let { source_entity }: { source_entity: SourceEntity } = $props()

	let concept = $derived(source_entity.concept!)
</script>

<span class="inline-flex px-1 tracking-normal">
	<Features {source_entity}>
		<Concept data={concept} />
		{#if source_entity.pairing_concept}
			/<Concept data={source_entity.pairing_concept} />
		{/if}
	</Features>
</span>
