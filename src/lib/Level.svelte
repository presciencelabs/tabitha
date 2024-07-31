<script>
	/** @type {Concept['level']} */
	export let level

	const level_descriptions = [
		'Semantic Primitive',
		'Semantic Molecule',
		'Complex with an Insertion Rule',
		'Complex without an Insertion Rule',
		'Inexplicable',
	]

	$: description = level_descriptions[parseInt(level)] || ''
</script>

<span class={`badge L${level} badge-lg tooltip tooltip-left font-mono`} data-tip={description}>
	L{level}
</span>

<style>
/*
	level colors in TBTA are as follows:
		0 => blue
		1 => creme
		2 => magenta
		3 => green
		4 => brown
*/

	.L0 {
		color: whitesmoke;
		background-color: #0B66FF;
		border-color: whitesmoke;
	}
	.L1 {
		color: darkblue;
		background-color: #FCFFC5;
		filter: saturate(200%);
		border-color: darkblue;
	}
	.L2 {
		color: yellow;
		background-color: #FB00FF;
		border-color: yellow;
	}
	.L3 {
		color: whitesmoke;
		background-color: #0F7000;
		border-color: whitesmoke;
	}
	.L4 {
		color: whitesmoke;
		background-color: #6B2F30;
		border-color: whitesmoke;
	}
</style>