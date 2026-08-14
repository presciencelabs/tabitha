<script lang="ts">
	import { Level, Occurrences, ConceptKey } from '$lib'
	import PendingChange from '$lib/PendingChange.svelte'

	let { concept }: { concept: Concept } = $props()

	let pending_change = $derived(concept.pending_changes.find(change => change.data.level))
</script>

<ConceptKey {concept} />

<aside class="flex flex-col items-center gap-1 self-start">
	<div class="flex flex-row items-center gap-1">
		<Level level={concept.level} />
		{#if pending_change}
			<PendingChange>
				<Level level={pending_change.data.level!.value} />
			</PendingChange>
		{/if}
	</div>

	<Occurrences {concept} />
</aside>
