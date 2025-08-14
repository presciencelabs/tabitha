<script>
	/** @type {Concept} */
	export let concept

	/**
	 * @param {Concept} concept
	 * @returns {Promise<SimplificationHint[]>}
	 */
	async function get_hints(concept) {
		const search_term = concept.status === 'absent' ? concept.stem : `${concept.stem}-${concept.sense}`
		const response = await fetch(`/simplification_hints?complex_term=${search_term}`)

		/** @type {SimplificationHint[]}*/
		const results = await response.json()

		return results.filter(result => result.part_of_speech === concept.part_of_speech)
	}
</script>

<table class="table ml-8">
	<thead>
		<tr>
			<th>Structure</th>
			<th>Pairing</th>
			<th>Explication</th>
		</tr>
	</thead>
	<tbody>
		{#await get_hints(concept)}
			<tr>
				<td colspan="2">
					<span class="loading loading-spinner text-warning"></span>
					looking for hints...
				</td>
			</tr>
		{:then hints}
			{#each hints as { structure, pairing, explication }}
				<tr>
					<td>{structure || '–'}</td>
					<td>{pairing || '–'}</td>
					<td>{explication || '–'}</td>
				</tr>
			{:else}
				<tr>
					<td colspan="2">No hints available at this time.</td>
				</tr>
			{/each}
		{/await}
	</tbody>
</table>
