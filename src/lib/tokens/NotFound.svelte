<script>
	import PopupMenu from './PopupMenu.svelte'
	import Table from './Table.svelte'
	import TokenDisplay from './TokenDisplay.svelte'

	/** @type {{ token: SimpleToken, classes?: string }} */
	let { token, classes = '' } = $props()

	/** @type {{lookup: SimpleLookupResult, how_to: HowToEntry}[]} */
	const how_to_entries = token.lookup_results.flatMap(lookup => lookup.how_to_entries.map(how_to => ({ lookup, how_to })))
	const has_structure = how_to_entries.some(entry => entry.how_to.structure)
	const has_pairing = how_to_entries.some(entry => entry.how_to.pairing)
	const has_explication = how_to_entries.some(entry => entry.how_to.explication)
</script>

{#if how_to_entries.length}
	<PopupMenu>
		{#snippet button_content()}
			<TokenDisplay {classes}>
				{token.token}
			</TokenDisplay>
		{/snippet}

		{#snippet popup_content()}
			<Table entries={how_to_entries}>
				{#snippet header_row()}
					<tr>
						<th></th>
						<th></th>
						{#if has_structure}<th class="text-info-content">Structure</th>{/if}
						{#if has_pairing}<th class="text-info-content">Pairing</th>{/if}
						{#if has_explication}<th class="text-info-content">Suggestion</th>{/if}
					</tr>
				{/snippet}

				{#snippet entry_row(entry)}
					<tr>
						<th class="whitespace-nowrap">{entry.lookup.stem}</th>
						<td class="whitespace-nowrap">{entry.lookup.part_of_speech}</td>
						{#if has_structure}<td class="whitespace-nowrap">{entry.how_to.structure}</td>{/if}
						{#if has_pairing}<td>{entry.how_to.pairing}</td>{/if}
						{#if has_explication}<td>{entry.how_to.explication}</td>{/if}
					</tr>
				{/snippet}
			</Table>
		{/snippet}
	</PopupMenu>
{:else}
	<TokenDisplay {classes}>
		{token.token}
	</TokenDisplay>
{/if}
