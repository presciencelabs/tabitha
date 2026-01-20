<script>
	/** @type {Concept} */
	export let concept

	$: level = concept.level

	/** @type {Record<string, [string, string]>}*/
	const level_info = {
		'0': ['Semantic Primitive', 'L0'],
		'1': ['Semantic Molecule', 'L1'],
		'2': ['Complex - usually explicated', 'L2'],
		'3': ['Complex - usually in a complex alternate', 'L3'],
		'4': ['Inexplicable', 'L4'],
		'N/A': ['Not in the ontology', 'badge-error'],
		'FW': ['Function Word', 'badge-netural'],
	}

	$: [description, level_class] = level_info[level] || ['', 'badge-neutral']
	$: level_display = Number(level) >= 0 ? `L${level}` : level
</script>

<span class={`badge ${level_class} badge-lg tooltip tooltip-left font-mono`} data-tip={description}>
	{level_display}
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