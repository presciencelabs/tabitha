<script lang="ts" generics="T">
	export let entries: T[]
</script>

<table class="table table-xs not-prose">
	<thead>
		<slot name="header_row" />
	</thead>
	<tbody>
		{#each entries as entry}
			<slot name="entry_row" {entry} />
		{/each}
	</tbody>
</table>
