<script>
	import { CONCEPT_FILTERS } from './filters'

	/** @type {Concept} */
	export let concept

	$: occurrences = concept.occurrences
</script>

{#if CONCEPT_FILTERS.IS_OR_WILL_BE_IN_ONTOLOGY(concept)}
	<span class="badge badge-success badge-md tooltip tooltip-left font-mono" data-tip="Occurrences">
		{occurrences}
	</span>
{/if}
