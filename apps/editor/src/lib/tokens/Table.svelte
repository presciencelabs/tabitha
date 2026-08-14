<script lang="ts" generics="T">
	import type { Snippet } from 'svelte'

	let { entries, header_row, entry_row }: { entries: T[], header_row?: Snippet, entry_row: Snippet<[T]> } = $props()
</script>

<table class="table table-xs not-prose">
	{#if header_row}
		<thead>
			{@render header_row()}
		</thead>
	{/if}
	<tbody>
		{#each entries as entry}
			{@render entry_row(entry)}
		{/each}
	</tbody>
</table>
