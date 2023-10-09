<script>
	import { goto } from '$app/navigation'
	import { navigating } from '$app/stores'
	import { onMount } from 'svelte'

	export let autofocus = false

	/** @type HTMLInputElement */
	let input

	/** @type string */
	let value

	onMount(autofocusIfRequested)

	$: value === '' && goto('/') // clears search results when the input is cleared

	function autofocusIfRequested() {
		autofocus && input?.focus()
	}
</script>

<!-- https://developer.mozilla.org/en-US/docs/Web/HTML/Element/search -->
<search>
	<!-- used role for this: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/search#search_form_labels_and_accessibility -->
	<form role="search" class="join w-full">
		<div class="form-control join-item w-full">
			<input type="search" name="q" id="q" bind:value bind:this={input} class="input input-lg input-bordered input-primary" />
			<label for="q" class="label">
				<span class="label-text-alt"><kbd class="kbd ">*</kbd> will return <em>all</em> concepts</span>
			</label>
		</div>

		<button class="btn btn-primary btn-lg join-item relative right-1">Search</button>
	</form>

	<!-- TODO: consider this block to be a place for possible actions like radio buttons, filters, etc. -->

	<!-- chose visibility here to keep results from jumping up and down -->
	<progress class:!visible={$navigating} class="progress progress-warning invisible" />
</search>
