<script>
	import PopupTable from './PopupTable.svelte'
	import TokenDisplay from './TokenDisplay.svelte'

	/** @type {Token} */
	export let token
	export let classes = ''

	const how_to_entries = token.lookup_results.flatMap(result => result.how_to)
	const has_structure = how_to_entries.some(result => result.structure)
	const has_pairing = how_to_entries.some(result => result.pairing)
	const has_explication = how_to_entries.some(result => result.explication)
</script>

{#if how_to_entries.length}
	<PopupTable entries={how_to_entries}>
		<TokenDisplay {classes} slot="button_content">
			{token.token}
		</TokenDisplay>

		<tr slot="header_row">
			<th></th>
			<th></th>
			{#if has_structure}<th class="text-info-content">Structure</th>{/if}
			{#if has_pairing}<th class="text-info-content">Pairing</th>{/if}
			{#if has_explication}<th class="text-info-content">Explication</th>{/if}
		</tr>

		<tr slot="entry_row" let:entry>
			<th class="whitespace-nowrap">{entry.term}</th>
			<td class="whitespace-nowrap">{entry.part_of_speech}</td>
			{#if has_structure}<td class="whitespace-nowrap">{entry.structure}</td>{/if}
			{#if has_pairing}<td>{entry.pairing}</td>{/if}
			{#if has_explication}<td>{entry.explication}</td>{/if}
		</tr>
	</PopupTable>
{:else}
<TokenDisplay {classes}>
	{token.token}
</TokenDisplay>
{/if}