<script>
	/** @type {LookupResult<OntologyResult>} */
	export let result

	export let classes = ''

	// TODO: more work needed to handle multiple matches with possibly different levels, e.g., son
	const match = result.matches[0]
	const level_color = `L${match?.level}`
</script>

<span class="badge badge-lg badge-outline px-4 py-5 text-lg tracking-widest {level_color} {classes}">
	{result.term}
</span>

<style>
	/* TODO: second copy of these, time to DRY them out.  Also used in Ontology app.

		level colors in TBTA are as follows:
		0 => blue
		1 => creme
		2 => magenta
		3 => green
		4 => brown
	*/
	.L0 {
		color: whitesmoke;
		background-color: #0b66ff;
		border-color: whitesmoke;
	}
	.L1 {
		color: darkblue;
		background-color: #fcffc5;
		filter: saturate(200%);
		border-color: darkblue;
	}
	.L2 {
		color: yellow;
		background-color: #fb00ff;
		border-color: yellow;
	}
	.L3 {
		color: whitesmoke;
		background-color: #0f7000;
		border-color: whitesmoke;
	}
	.L4 {
		color: whitesmoke;
		background-color: #6b2f30;
		border-color: whitesmoke;
	}

</style>