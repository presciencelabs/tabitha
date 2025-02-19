<script>
	import Concept from './Concept.svelte'
	import BoundaryEnd from './BoundaryEnd.svelte'
	import BoundaryStart from './BoundaryStart.svelte'
	import Punctuation from './Punctuation.svelte'

	/** @type {SourceEntity[]} */
	export let source_entities

	const main_clauses = source_entities.reduce(clause_reducer, [])

	/**
	 * @param {SourceEntity[][]} clauses
	 * @param {SourceEntity} source_entity
	 */
	function clause_reducer(clauses, source_entity) {
		if (['{', '|'].includes(source_entity.value)) {
			clauses.push([])
		}
		clauses.at(-1)?.push(source_entity)
		return clauses
	}

	/** @type {[(entity: SourceEntity) => boolean, typeof Concept][]}*/
	const component_filters = [
		[({ value }) => ['{', '[', '('].includes(value), BoundaryStart],
		[({ value }) => ['}', ']', ')'].includes(value), BoundaryEnd],
		[({ concept }) => !!concept, Concept],
		[() => true, Punctuation],
	]
</script>

{#each main_clauses as main_clause}
	<div class="py-4">
		{#each main_clause as source_entity}
			{@const component = component_filters.find(([filter]) => filter(source_entity))?.[1]}
			<svelte:component this={component} {source_entity} />
		{/each}
	</div>
{/each}
