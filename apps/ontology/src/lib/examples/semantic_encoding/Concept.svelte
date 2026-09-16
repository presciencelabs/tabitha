<script lang="ts">
	import type { ConceptKey } from '@tabitha/types'
	import { do_concepts_match } from '$lib/concepts'

	type Props = {
		data: ConceptKey
		selected_concept: ConceptKey
	}

	let { data, selected_concept }: Props = $props()

	let matches_selected_concept = $derived(do_concepts_match({ a: data, b: selected_concept }))
</script>

<span class:font-bold={matches_selected_concept} class="text-sm tracking-tight">
	{data.stem}-{data.sense}
</span>
