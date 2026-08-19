<script lang="ts">
	import type { OntologyResult, SourceConcept } from '@tabitha/types'
	import { PUBLIC_ONTOLOGY_API_HOST } from '$env/static/public'
	import { fetch_ontology_data_for_all_senses } from '$lib/data/api_lookups'
	import Icon from '@iconify/svelte'

	const { data = $bindable() }: { data: SourceConcept } = $props()

	let all_senses = $state<OntologyResult[]>([])

	$effect(() => {
		fetch_ontology_data_for_all_senses(data).then(fetched_senses => {
			all_senses = fetched_senses
		})
	})

	function get_ontology_url_for_link({ stem, part_of_speech }: SourceConcept): string {
		return `${PUBLIC_ONTOLOGY_API_HOST}/?q=${stem}&category=${part_of_speech}`
	}

	function set_sense(sense: string) {
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
	<a href={get_ontology_url_for_link(data)} target="_blank" class="link link-accent text-xs flex items-end">
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
				<td>
					{#if !is_selected}
						<div class="invisible group-hover:visible transition-opacity opacity-0 group-hover:opacity-100">
							<button onclick={() => set_sense(sense)} class="btn btn-xs">
								Set
							</button>
						</div>
					{/if}
				</td>
			</tr>
		{/each}
	</tbody>
</table>
