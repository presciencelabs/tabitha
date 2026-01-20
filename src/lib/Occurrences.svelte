<script>
	/** @type {Concept} */
	export let concept

	$: occurrences = concept.occurrences
</script>

{#if ['in ontology', 'approved'].includes(concept.status)}
	<span class="badge badge-success badge-md tooltip tooltip-left font-mono" data-tip="Occurrences">
		{occurrences}
	</span>
{/if}
