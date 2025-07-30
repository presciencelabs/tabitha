<script>
	import { PUBLIC_ONTOLOGY_API_HOST } from '$env/static/public'
	import TokenDisplay from './TokenDisplay.svelte'
	import PopupMenu from './PopupMenu.svelte'
	import Table from './Table.svelte'
	import Icon from '@iconify/svelte'
	import { LOOKUP_FILTERS } from '$lib/lookup_filters'

	/** @type {SimpleToken} */
	export let token
	export let classes = ''
</script>

<PopupMenu>
	<TokenDisplay slot="button_content" classes={`L${token.lookup_results[0].level} ${classes}`}>
		{token.token}
	</TokenDisplay>

	<Table slot="popup_content" entries={token.lookup_results}>
		<svelte:fragment slot="entry_row" let:entry>
			{@const show_hints = !LOOKUP_FILTERS.IS_OR_WILL_BE_IN_ONTOLOGY(entry) || LOOKUP_FILTERS.IS_LEVEL_COMPLEX(entry)}

			{#if LOOKUP_FILTERS.IS_OR_WILL_BE_IN_ONTOLOGY(entry)}
				{@const concept = `${entry.stem}-${entry.sense}`}
				<tr>
					<td class="whitespace-nowrap">
						<span>
							<a class="link not-prose {classes}" href={`${PUBLIC_ONTOLOGY_API_HOST}/?q=${concept}`} target="_blank">
								{concept}
							</a>
							{#if entry.case_frame.status === 'valid'}
								<Icon icon="mdi:check-bold" class="h-4 w-4 text-success" />
							{:else if entry.case_frame.status === 'invalid'}
								<Icon icon="mdi:close-thick" class="h-4 w-4 text-error" />
							{/if}
						</span>
					</td>
					<td class="whitespace-nowrap">{entry.part_of_speech}</td>
					<td class="whitespace-nowrap">
						<span class="badge badge-md L{entry.level} font-mono">L{entry.level}</span>
					</td>
					<td>{entry.gloss}</td>
				</tr>
			{:else}
				<tr>
					<td class="whitespace-nowrap">{entry.stem}</td>
					<td class="whitespace-nowrap">{entry.part_of_speech}</td>
					<td>N/A</td>
					<td>Not in Ontology.</td>
				</tr>
			{/if}

			{#if show_hints}
				{@const has_structure = entry.how_to_entries.some(how_to => how_to.structure)}
				{@const has_pairing = entry.how_to_entries.some(how_to => how_to.pairing)}
				{@const has_explication = entry.how_to_entries.some(how_to => how_to.explication)}
				{@const has_any_hint = has_structure || has_pairing || has_explication}

				<tr class="border-none">
					<td></td>
					<td colspan="3" class="pb-2" class:ps-0={has_any_hint}>
						{#if has_any_hint}
							<Table entries={entry.how_to_entries}>
								<tr slot="header_row">
									{#if has_structure}<th class="text-info-content">Structure</th>{/if}
									{#if has_pairing}<th class="text-info-content">Pairing</th>{/if}
									{#if has_explication}<th class="text-info-content">Explication</th>{/if}
								</tr>

								<tr slot="entry_row" let:entry>
									{#if has_structure}<td>{entry.structure}</td>{/if}
									{#if has_pairing}<td>{entry.pairing}</td>{/if}
									{#if has_explication}<td>{entry.explication}</td>{/if}
									{#if !(entry.structure || entry.pairing || entry.explication)}
										<td>No hints available at this time.</td>
									{/if}
								</tr>
							</Table>
						{:else}
							No hints available at this time.
						{/if}
					</td>
				</tr>
			{/if}
		</svelte:fragment>
	</Table>
</PopupMenu>
