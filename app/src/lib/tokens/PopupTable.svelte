<script lang="ts">
	type T = $$Generic
	export let entries: T[]
</script>

<div class="dropdown dropdown-hover dropdown-top">
	<div class="overflow-x-auto dropdown-content z-[1] menu shadow-xl bg-info text-info-content rounded-box w-96 max-h-80">
		<table class="table table-xs my-2">
			<thead>
				<slot name="header_row" />
			</thead>
			<tbody>
				{#each entries as entry}
					<slot name="entry_row" {entry} />
				{/each}
			</tbody>
		</table>
	</div>
	<div role="button">
		<slot name="button_content" />
	</div>
</div>