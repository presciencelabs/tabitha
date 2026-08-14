<script lang="ts">
	import { levels } from './lookups'

	interface Props {
		level: string
		tooltip_dir?: string
	}

	let { level, tooltip_dir = 'tooltip-left' }: Props = $props()

	const other_level_info: Record<string, [string, string]> = {
		'N/A': ['Not in the ontology', 'badge-error'],
		FW: ['Function Word', 'badge-neutral'],
	}

	let [description, level_class] = $derived(
		levels.has(level)
			? [levels.get(level) || '', `L${level}`]
			: other_level_info[level] || ['', 'badge-neutral'],
	)
	let level_display = $derived(Number(level) >= 0 ? `L${level}` : level)
</script>

<span class="badge {level_class} badge-lg tooltip {tooltip_dir} font-mono" data-tip={description}>
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