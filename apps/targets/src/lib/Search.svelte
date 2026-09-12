<script lang="ts">
	import { page } from '$app/state'
	import Icon from '@iconify/svelte'
	import { MODE, type SearchMode } from '$lib/search/modes'

	const MODE_LABELS: Record<SearchMode, string> = {
		text: 'Target text',
		phrase: 'Scripture phrase',
	}

	let { project }: { project: string } = $props()

	let value = $state(page.url.searchParams.get('q') ?? '')
	let return_to = $state(page.url.searchParams.get('return_to') ?? '')

	// a hand-edited ?mode= that matches no option would leave the dropdown showing nothing
	let requested_mode = page.url.searchParams.get('mode') ?? ''
	let mode = $state(requested_mode in MODE_LABELS ? requested_mode : MODE.DEFAULT)
</script>

<!-- https://developer.mozilla.org/en-US/docs/Web/HTML/Element/search -->
<search>
	<!--
		used role="search" ∵ https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/search#search_form_labels_and_accessibility.
	-->
	<form role="search" class="join w-full" action="/{project}/search">
		<select
			name="mode"
			id="search_mode"
			aria-label="What to search"
			bind:value={mode}
			class="select select-bordered select-lg join-item w-auto shrink-0"
		>
			{#each Object.entries(MODE_LABELS) as [id, label]}
				<option value={id}>{label}</option>
			{/each}
		</select>

		<input type="search" name="q" id="text_search" bind:value class="input input-bordered input-primary input-lg w-full join-item" />

		<button type="submit" class="btn btn-primary btn-lg join-item">
			<span class="hidden sm:inline">Search</span>
			<Icon icon="material-symbols:search" class="h-6 w-6" />
		</button>

		{#if return_to}
			<input type="hidden" name="return_to" id="return_to" bind:value={return_to} />
		{/if}
	</form>
</search>
