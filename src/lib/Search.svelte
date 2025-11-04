<script>
	import { page } from '$app/state'
	import Icon from '@iconify/svelte'

	/** @type {string} */
	export let project
	
	/** @type {string|null} */
	let value = new URLSearchParams(page.url.search).get('q')
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
	</form>
</search>