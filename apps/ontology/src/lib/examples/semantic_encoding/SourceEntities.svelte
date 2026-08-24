<script lang="ts">
	import type { Component } from 'svelte'
	import Word from './Word.svelte'
	import BoundaryEnd from './BoundaryEnd.svelte'
	import BoundaryStart from './BoundaryStart.svelte'
	import Punctuation from './Punctuation.svelte'
	import type { SourceConcept, SourceEntity } from '$lib/types'

	type Props = {
		source_entities: SourceEntity[]
		selected_concept: SourceConcept
	}

	let { source_entities, selected_concept }: Props = $props()

	let main_clauses = $derived(source_entities.reduce(clause_reducer, [] as SourceEntity[][]))

	function clause_reducer(clauses: SourceEntity[][], source_entity: SourceEntity) {
		if (source_entity.value === '{') {
			clauses.push([])
		}
		clauses.at(-1)?.push(source_entity)
		return clauses
	}

	type EntityComponent = Component<{
		source_entity: SourceEntity
		selected_concept?: SourceConcept
		classes?: string
	}>

	const component_filters: [(entity: SourceEntity) => boolean, EntityComponent][] = [
		[is_boundary_start, BoundaryStart],
		[is_boundary_end, BoundaryEnd],
		[({ concept }) => !!concept, Word],
		[() => true, Punctuation],
	]

	function get_component(entity: SourceEntity): EntityComponent {
		return component_filters.find(([filter]) => filter(entity))![1]
	}

	function is_boundary_start(entity: SourceEntity): boolean {
		return ['{', '[', '('].includes(entity.value)
	}

	function is_boundary_end(entity: SourceEntity): boolean {
		return ['}', ']', ')'].includes(entity.value)
	}

	function get_parent_category({ entities, index }: { entities: SourceEntity[], index: number }): string {
		let inner_level = 0
		for (let j = index - 1; j >= 0; j--) {
			const entity = entities[j]
			if (is_boundary_start(entity)) {
				if (inner_level === 0) {
					return entity.category_abbr
				} else {
					inner_level -= 1
				}
			} else if (is_boundary_end(entity)) {
				// skip over any phrases/clauses nested within this one
				inner_level += 1
			}
		}
		return ''
	}
</script>

{#each main_clauses as main_clause}
	<div class="hover:bg-base-200 flex flex-wrap items-center">
		{#each main_clause as source_entity, i}
			{@const Component = get_component(source_entity)}
			<span class="entity-{source_entity.category_abbr || get_parent_category({ entities: main_clause, index: i })}">
				<Component {source_entity} {selected_concept} />
			</span>
		{/each}
	</div>
{/each}
