<script lang="ts">
	import type { SourceEntity } from '$lib/types'
	import Word from './Word.svelte'
	import BoundaryEnd from './BoundaryEnd.svelte'
	import BoundaryStart from './BoundaryStart.svelte'
	import { Punctuation } from '@tabitha/ui'

	let { source_entities }: { source_entities: SourceEntity[] } = $props()

	let main_clauses = $derived(source_entities.reduce(clause_reducer, [] as SourceEntity[][]))

	function clause_reducer(clauses: SourceEntity[][], entity: SourceEntity) {
		if (entity.value === '{') {
			clauses.push([])
		}

		const last_clause = clauses[clauses.length - 1]
		if (last_clause) {
			last_clause.push(entity)
		}

		return clauses
	}

	function get_component(entity: SourceEntity) {
		if (['{', '[', '('].includes(entity.value)) return BoundaryStart
		if (['}', ']', ')'].includes(entity.value)) return BoundaryEnd
		return entity.concept ? Word : Punctuation
	}
</script>

{#each main_clauses as main_clause}
	<div class="hover:bg-base-200">
		{#each main_clause as source_entity}
			{@const Component = get_component(source_entity)}
			{#if Component === Punctuation}
				<Punctuation {source_entity} size="sm" />
			{:else}
				<Component {source_entity} />
			{/if}
		{/each}
	</div>
{/each}
