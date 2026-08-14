<script>
	/** @type {SourceConcept} */
	export let data
	
	/** @type {SourceConcept}*/
	export let selected_concept

	function matches_selected_concept() {
		return data.stem === selected_concept.stem
			&& data.sense === selected_concept.sense
			&& data.part_of_speech === selected_concept.part_of_speech
	}
</script>

<span class:font-bold={matches_selected_concept()} class="text-sm tracking-tight">
	{data.stem}-{data.sense}
</span>
