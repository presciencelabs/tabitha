<script lang="ts" generics="T">
	export let entries: T[]
	export let classes: string = ''
</script>

<table class="table table-xs {classes}">
	<thead>
		<slot name="header_row" />
	</thead>
	<tbody>
		{#each entries as entry}
			<slot name="entry_row" {entry} />
		{/each}
	</tbody>
</table>