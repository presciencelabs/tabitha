<script>
	import { PUBLIC_ONTOLOGY_API_HOST } from '$env/static/public'
	import Icon from '@iconify/svelte'

	/** @type {{ data: SourceConcept, can_edit: boolean }} */
	const { data = $bindable(), can_edit=false } = $props()

	/** @type {OntologyResult[]} */
	let all_senses = $state([])

	$effect(() => {
		fetch_ontology_data_for_all_senses(data).then(fetched_senses => {
			all_senses = fetched_senses
		})
	})

	/**
	 * @param {SourceConcept} concept
	 * @returns {Promise<OntologyResult[]>}
	 */
	async function fetch_ontology_data_for_all_senses(concept) {
		const { stem, part_of_speech } = concept
		const response = await fetch(`${PUBLIC_ONTOLOGY_API_HOST}/search?q=${stem}&category=${part_of_speech}`)

		if (!response.ok) {
			return []
		}

		/** @type {OntologyResult[]} */
		const results = await response.json()
		
		// Use the result that exactly matches the original stem (eg. "lot" vs "Lot")
		return results.filter(result => result.stem === stem)
	}

	/**
	 * @param {SourceConcept} concept
	 * @returns {string} fully-qualified URL to the ontology API
	 */
	function get_ontology_url_for_link({ stem, part_of_speech }) {
		return `${PUBLIC_ONTOLOGY_API_HOST}/?q=${stem}&category=${part_of_speech}`
	}

	/**
	 * @param {string} sense
	 */
	function set_sense(sense) {
		const new_sense_data = all_senses.find(s => s.sense === sense)
		if (!new_sense_data) {
			console.error(`Could not find sense ${sense} in all_senses`, all_senses)
			return
		}
		data.sense = sense
		data.ontology_data = new_sense_data
	}
</script>

<div class="flex justify-end">
	<a class="link link-accent text-xs flex items-end" href={get_ontology_url_for_link(data)} target="_blank">
		Compare in Ontology
		<Icon icon="fe:link-external" class="h-4 w-4" />
	</a>
</div>

<table class="table table-sm table-zebra">
	<tbody>
		{#each all_senses as sense_data}
			{@const { stem, sense, level, gloss } = sense_data}
			{@const is_selected = data.sense === sense}
			<tr class="group">
				<td class="{is_selected ? 'font-bold' : ''}">
					{stem}-{sense}
				</td>
				<td>{gloss}</td>
				<td><span class="badge badge-outline L{level} badge-xs font-mono me-1">L{level}</span></td>
				{#if can_edit && !is_selected}
					<td>
						<div class="invisible group-hover:visible transition-opacity opacity-0 group-hover:opacity-100">
							<button class="btn btn-xs" onclick={() => set_sense(sense)}>
								Set
							</button>
						</div>
					</td>
				{/if}
			</tr>
		{/each}
	</tbody>
</table>
