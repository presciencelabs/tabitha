<script>
	/** @type {PageSourceEntity} */
	export let data

	/** @type {NounListEntry[]} */
	export let noun_list
</script>

<table class="table table-sm table-zebra">
	<tbody>
		{#each noun_list as noun_list_entry}
			{@const is_selected = data.features[0].value === noun_list_entry.index}
			<tr>
				<td class="{is_selected ? 'font-bold' : ''}">{noun_list_entry.index}</td>
				<td class="{is_selected ? 'font-bold' : ''}">{noun_list_entry.noun}</td>
			</tr>
		{/each}
	</tbody>
</table>
