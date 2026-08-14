<script>
	import { PUBLIC_ONTOLOGY_API_HOST } from '$env/static/public'
	import { fetch_ontology_data_for_all_senses } from '$lib/data/api_lookups'
	import Icon from '@iconify/svelte'

	/** @type {{ data: SourceConcept }} */
	const { data } = $props()

	/**
	 * @param {SourceConcept} concept
	 * @returns {string} fully-qualified URL to the ontology API
	 */
	function get_ontology_url_for_link({ stem, part_of_speech }) {
		return `${PUBLIC_ONTOLOGY_API_HOST}/?q=${stem}&category=${part_of_speech}`
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
		{#await fetch_ontology_data_for_all_senses(data) then all_senses}
			{#each all_senses as sense_data}
				{@const { stem, sense, level, gloss } = sense_data}
				{@const is_selected = data.sense === sense}
				<tr class="group">
					<td class="{is_selected ? 'font-bold' : ''}">
						{stem}-{sense}
					</td>
					<td>{gloss}</td>
					<td><span class="badge badge-outline L{level} badge-xs font-mono me-1">L{level}</span></td>
				</tr>
			{/each}
		{/await}
	</tbody>
</table>
