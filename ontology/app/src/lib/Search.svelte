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
	<!--
		used role="search" ∵ https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/search#search_form_labels_and_accessibility.

		decided against daisy's "join" approach in favor of positioning so I could get a focus ring around the input AND button.  See https://github.com/saadeghi/daisyui/discussions/2400>
	-->
	<form role="search" class="relative">
		<div class="form-control">
			<input type="search" name="q" id="q" bind:value bind:this={input} class="input input-bordered input-primary input-lg" />

			<label for="q" class="label">
				<span class="label-text-alt"><kbd class="kbd">*</kbd> will return <em>all</em> concepts</span>
			</label>
		</div>

		<button class="btn btn-primary btn-lg rounded-s-none absolute right-0 top-0">Search</button>
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
