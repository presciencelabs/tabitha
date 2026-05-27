<script>
	import { status_list } from '$lib/data/lookups.js'

	const { data } = $props()

	const status_groups = data.status_groups
	let selected_status = $state('All')

	let filtered_status_groups = $derived(status_groups.map(({ group_name, statuses }) => ({
		group_name,
		statuses: selected_status === 'All' ? statuses : statuses.filter(s => s.status === selected_status)
	})))
</script>

<div class="prose">
	<h2>Encoding Status</h2>
</div>

<div class="my-3">
	Status
	<select class="select" bind:value={selected_status}>
		<option value="All" selected>All</option>
		{#each status_list.toReversed() as status}
			<option value={status}>{status}</option>
		{/each}
	</select>
</div>

<div class="flex py-3 gap-7">
	{#each filtered_status_groups as { group_name, statuses }}
		<div class="flex-auto">
			<table class="table table-zebra">
				<thead><tr><th>{group_name}</th></tr></thead>
				<tbody>
					{#each statuses as { reference: { id_primary }, status }}
						<tr>
							<th>{id_primary}</th>
							<td>{status}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/each}
</div>
