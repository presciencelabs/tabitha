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
		[({ value }) => ['{', '[', '('].includes(value), BoundaryStart],
		[({ value }) => ['}', ']', ')'].includes(value), BoundaryEnd],
		[({ concept }) => !!concept, Word],
		[() => true, Punctuation],
	]
</script>

{#each main_clauses as main_clause}
	<div class="hover:bg-base-200">
		{#each main_clause as source_entity}
			{@const component = component_filters.find(([filter]) => filter(source_entity))?.[1]}
			<svelte:component this={component} {source_entity} {selected_concept} />
		{/each}
	</div>
{/each}
