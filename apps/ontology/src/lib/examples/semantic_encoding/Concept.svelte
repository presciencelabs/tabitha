<script lang="ts">
	import type { ConceptKey } from '@tabitha/types'

	type Props = {
		data: ConceptKey
		selected_concept: ConceptKey
	}

	let { data, selected_concept }: Props = $props()

	let matches_selected_concept = $derived(
		data.stem === selected_concept.stem
		&& data.sense === selected_concept.sense
		&& data.part_of_speech === selected_concept.part_of_speech,
	)
</script>

<span class:font-bold={matches_selected_concept} class="text-sm tracking-tight">
	{data.stem}-{data.sense}
</span>
