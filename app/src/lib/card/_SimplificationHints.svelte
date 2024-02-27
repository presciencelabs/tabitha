<script>
	/** @type {Concept} */
	export let concept

	/**
	 * @param {Concept} concept
	 * @returns {Promise<SimplificationHint[]>}
	 */
	async function get_hints(concept) {
		const response = await fetch(`/simplification_hints?complex_term=${concept.stem}-${concept.sense}`)

		return await response.json()
	}
</script>

<table class="table ml-8">
	<thead>
		<tr>
			<th>Pairing</th>
			<th>Explication</th>
		</tr>
	</thead>
	<tbody>
		{#await get_hints(concept)}
			<tr>
				<td colspan="2">
					<span class="loading loading-spinner text-warning"></span>
					looking for simplification hints...
				</td>
			</tr>
		{:then hints}
			{#each hints as {pairing, explication}}
				<tr>
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
