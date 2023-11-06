<script>
	import ThetaGrid from './ThetaGrid.svelte'

	/** @type {Concept} */
	export let concept

	/**
	 * @type {Record<Concept['part_of_speech'], string>}
	 */
	const names = {
		'Noun': 'Usage',
		'Verb': 'Theta Grid',
	}

	$: part_of_speech = concept.part_of_speech
	$: categories = concept.categories
</script>

<header class="pb-2 italic">
	{names[concept.part_of_speech] ?? 'Semantic categorization'}
</header>

{#if part_of_speech === 'Verb' }
	<ThetaGrid {categories} />
{:else}
	<pre data-tip="TBD: still needs to be decoded" class="indicator whitespace-normal inline tooltip tooltip-right">
		{categories.length ? categories : '–'}
		<span class="indicator-item badge badge-xs badge-warning" />
	</pre>
{/if}

