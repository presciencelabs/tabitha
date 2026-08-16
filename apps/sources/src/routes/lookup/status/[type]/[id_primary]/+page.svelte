<script lang="ts">
	import EncodingStatus from '$lib/EncodingStatus.svelte'

	let { data } = $props()

	let book_status = $derived(data.book_status)
	let chapter_statuses = $derived(data.chapter_statuses)

	let statuses_present = $derived(new Set(chapter_statuses.map(s => s.status)))

	let selected_status = $state('All')
	let filtered_chapters = $derived(selected_status === 'All' ? chapter_statuses : chapter_statuses.filter(s => s.status === selected_status))
</script>

<div class="prose mb-5">
	<h2>Encoding Status - {book_status.reference.id_primary}</h2>
	<div><EncodingStatus status={book_status.status} /></div>
</div>

<div>
	<div class="prose">
		<h3>Chapters</h3>
	</div>

	{#if statuses_present.size > 1}
		<div class="my-3">
			Status
			<select bind:value={selected_status} class="select">
				<option value="All" selected>All</option>
				{#each statuses_present as status}
					<option value={status}>{status}</option>
				{/each}
			</select>
		</div>
	{/if}

	<div class="flex flex-wrap py-3 gap-3">
		{#each filtered_chapters as { reference, status }}
			<div class="card flex-none w-45 bg-base-100 card-xs shadow-sm">
				<div class="card-body">
					<h2 class="card-title">{reference.id_secondary}</h2>
					<div><EncodingStatus {status} classes="badge-sm" /></div>
				</div>
			</div>
		{/each}
	</div>
</div>
