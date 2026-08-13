<script lang="ts">
	import { page } from '$app/state'
	import Icon from '@iconify/svelte'

	let { project }: { project: string } = $props()

	let value = $state(page.url.searchParams.get('q') ?? '')
	let return_to = $state(page.url.searchParams.get('return_to') ?? '')
</script>

<!-- https://developer.mozilla.org/en-US/docs/Web/HTML/Element/search -->
<search>
	<!--
		used role="search" ∵ https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/search#search_form_labels_and_accessibility.
	-->
	<form role="search" class="join w-full" action="/{project}/search">
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