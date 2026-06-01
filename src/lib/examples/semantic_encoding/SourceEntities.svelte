<script>
	import Word from './Word.svelte'
	import BoundaryEnd from './BoundaryEnd.svelte'
	import BoundaryStart from './BoundaryStart.svelte'
	import Punctuation from './Punctuation.svelte'

	/** @type {SourceEntity[]} */
	export let source_entities

	/** @type {SourceConcept}*/
	export let selected_concept

	const main_clauses = source_entities.reduce(clause_reducer, [])

	/**
	 * @param {SourceEntity[][]} clauses
	 * @param {SourceEntity} source_entity
	 */
	function clause_reducer(clauses, source_entity) {
		if (source_entity.value === '{') {
			clauses.push([])
		}
		clauses.at(-1)?.push(source_entity)
		return clauses
	}

	/** @type {[(entity: SourceEntity) => boolean, typeof Word][]}*/
	const component_filters = [
		[is_boundary_start, BoundaryStart],
		[is_boundary_end, BoundaryEnd],
		[({ concept }) => !!concept, Word],
		[() => true, Punctuation],
	]

	/**
	 * @param {SourceEntity[]} entities
	 * @param {number} index
	 */
	function get_parent_category(entities, index) {
		let inner_level = 0
		for (let j = index-1; j >= 0; j--) {
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

	/**
	 * @param {SourceEntity} entity
	 */
	function is_boundary_start(entity) {
		return ['{', '[', '('].includes(entity.value)
	}

	/**
	 * @param {SourceEntity} entity
	 */
	function is_boundary_end(entity) {
		return ['}', ']', ')'].includes(entity.value)
	}
</script>

{#each main_clauses as main_clause}
	<div class="hover:bg-base-200 flex flex-wrap items-center">
		{#each main_clause as source_entity, i}
			{@const component = component_filters.find(([filter]) => filter(source_entity))?.[1]}
			<span class="entity-{source_entity.category_abbr || get_parent_category(main_clause, i)}">
				<svelte:component this={component} {source_entity} {selected_concept} />
			</span>
		{/each}
	</div>
{/each}
