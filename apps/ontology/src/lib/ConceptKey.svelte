<script lang="ts">
	import type { ConceptKey } from '$lib/types'

	type Props = {
		concept: ConceptKey
	}

	let { concept }: Props = $props()
</script>

<h2 class="relative whitespace-nowrap pb-6">
	{concept.stem}
	<sup class="-top-4 font-mono text-sm text-neutral-500">{concept.sense}</sup>
	<sub class="-bottom-4 -left-4 font-light italic text-neutral-500">{concept.part_of_speech}</sub>
</h2>
