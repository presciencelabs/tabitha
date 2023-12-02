<script>
	import {DetailedCard, Level, Occurrences} from '$lib'

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

<table class="md:table-normal table table-xs sm:table-sm lg:table-lg">
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
		{#each concepts as concept (concept.id)}
			<tr class="hover hover:cursor-pointer" on:click={() => open(concept)}>
				<td>
					{concept.roots}
				</td>
				<td>
					{concept.sense}
				</td>
				<td>
					{concept.part_of_speech}
				</td>
				<td>
					{concept.gloss}
				</td>
				<td>
					<Level level={concept.level} />
				</td>
				<td class="text-center">
					<Occurrences occurrences={concept.occurrences} />
				</td>
			</tr>
		{/each}
	</tbody>
</table>

{#if selected_concept}
	<DetailedCard concept={selected_concept} on:close={close} />
{/if}
