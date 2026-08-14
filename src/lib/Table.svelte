<script>
	import { DetailedCard, Level, Occurrences, Meaning } from '$lib'
	import PendingChange from '$lib/PendingChange.svelte'

	/** @type {Concept[]} */
	export let concepts

	/** @type {Concept | null} */
	let selected_concept = null

	/** @param {Concept} concept*/
	function open(concept) {
		selected_concept = concept
	}
	function close() {
		selected_concept = null
	}
</script>

<table class="table table-xs sm:table-sm md:table-md lg:table-lg">
	<thead class="border-b-4">
		<tr>
			<th>Stem</th>
			<th>Sense</th>
			<th>Part of speech</th>
			<th>Gloss</th>
			<th>Level</th>
			<th>Occurrences</th>
		</tr>
	</thead>

	<tbody>
		{#each concepts as concept (`${concept.stem}-${concept.sense}-${concept.part_of_speech}`)}
			{@const pending_level_change = concept.pending_changes.find(change => change.data.level)}
			<tr class="hover cursor-pointer" on:click={() => open(concept)}>
				<td>
					{concept.stem}
				</td>
				<td>
					{concept.sense}
				</td>
				<td>
					{concept.part_of_speech}
				</td>
				<td>
					<Meaning {concept} compact />
				</td>
				<td>
					<Level level={concept.level} />
					{#if pending_level_change}
						<PendingChange>
							<Level level={pending_level_change.data.level?.value || ''} />
						</PendingChange>
					{/if}
				</td>
				<td class="text-center">
					<Occurrences {concept} />
				</td>
			</tr>
		{/each}
	</tbody>
</table>

{#if selected_concept}
	<DetailedCard concept={selected_concept} on:close={close} />
{/if}
