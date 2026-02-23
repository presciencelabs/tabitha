<script>
	import { PUBLIC_ONTOLOGY_API_HOST } from '$env/static/public'
	import { onMount } from 'svelte'
	import HoverPopup from './HoverPopup.svelte'

	/** @type {SourceConcept} */
	export let data

	onMount(async () => {
		const { stem, sense, part_of_speech } = data
		const response = await fetch(`${PUBLIC_ONTOLOGY_API_HOST}/search?q=${stem}-${sense}&category=${part_of_speech}`)

		const DEFAULT_DATA = {
			...data,
			level: '',
			gloss: '',
			categories: [],
		}

		if (!response.ok) {
			data.ontology_data = DEFAULT_DATA
		}

		/** @type {OntologyResult[]} */
		const results = await response.json()
		
		// Use the result that exactly matches the original stem (eg. "lot" vs "Lot")
		const result = results.find(result => result.stem === stem) ?? DEFAULT_DATA
		// TODO find a better way to do this
		data.ontology_data = result
	})
</script>

<HoverPopup>
	{#snippet button_content()}
		{#if data.sense === 'A'}
			{data.stem}
		{:else}
			{data.stem}-{data.sense}
		{/if}
	{/snippet}
	{#snippet dropdown_content()}
		<div class="text-base-content">
			{#if data.ontology_data}
				{@const { level, gloss } = data.ontology_data}
				<p>
					<span class="badge badge-outline L{level} badge-sm font-mono me-1">L{level}</span>
					<span>{gloss}</span>
				</p>
			{:else}
				<span>Loading Ontology data...</span>
			{/if}
		</div>
	{/snippet}
</HoverPopup>
