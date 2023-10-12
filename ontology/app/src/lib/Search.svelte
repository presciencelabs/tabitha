<script>
	import { navigating, page } from '$app/stores'
	import Icon from '@iconify/svelte'

	export let autofocus = false

	/** @type {string|null} */
	let value = new URLSearchParams($page.url.search).get('q')

	/** @param {HTMLInputElement} input */
	function check_focus(input) {
		autofocus && input.focus()
	}
</script>

<!-- https://developer.mozilla.org/en-US/docs/Web/HTML/Element/search -->
<search>
	<!--
		used role="search" ∵ https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/search#search_form_labels_and_accessibility.

		decided against daisy's "join" approach in favor of positioning so I could get a focus ring around the input AND button.  See https://github.com/saadeghi/daisyui/discussions/2400>
	-->
	<form role="search" class="relative">
		<div class="form-control">
			<input type="search" name="q" id="q" bind:value use:check_focus class="input input-bordered input-primary input-lg" />

			<label for="q" class="label">
				<span class="label-text-alt"><kbd class="kbd">*</kbd> will return <em>all</em> concepts</span>
			</label>
		</div>

		<button class="btn btn-primary btn-lg rounded-s-none absolute right-0 top-0">
			Search <Icon icon="material-symbols:search" class="h-6 w-6" />
		</button>
	</form>

	<!-- TODO: consider this block to be a place for possible actions like radio buttons, filters, etc. -->

	<!-- chose visibility here to keep results from jumping up and down -->
	<progress class="progress progress-warning invisible" class:visible={$navigating} />
</search>

<style>
	/* overrode tailwind here to keep from having to use !visible (!important) due to tw's definition order of visible and invisible */
	.visible {
		visibility: visible;
	}
</style>
