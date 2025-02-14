<script>
	import { by_book_order, ExampleSummary, Filters, SourceData, TargetData } from '$lib/examples'
	import Icon from '@iconify/svelte'
	import { fade } from 'svelte/transition'

	/** @type { Concept } */
	export let concept

	const MAX_EXAMPLES_DISPLAYED = 50

	/** @type { Example[] } */
	let all_examples = []

	/** @type { Example[] } */
	let filtered_examples = []

	/** @param { Concept } concept */
	async function load_examples({ stem, sense, part_of_speech }) {
		const response = await fetch(`/examples?concept=${stem}-${sense}&part_of_speech=${part_of_speech}&source=Bible`)

		all_examples = await response.json()
	}

	const FADE_CHARACTERISTICS = {
		delay: 100,
		duration: 700,
	}

	/** @type { number[] } */
	let retrieval_queue = []

	/**
	 * @param { Event & { currentTarget: HTMLDetailsElement }} event
	 * @param { number } id
	 */
	function handle_queue({ currentTarget: details }, id) {
		if (details.open) {
			retrieval_queue = [...retrieval_queue, id]
		} else {
			retrieval_queue = retrieval_queue.filter(queued_id => queued_id !== id)
		}
	}
</script>

<article class="bg-base-200 p-4 flex flex-col gap-4 prose max-w-none">
	<h3>Bible</h3>

	{#await load_examples(concept)}
		<span class="loading loading-spinner text-warning"></span>
		loading the examples...
	{:then}
		<Filters {concept} examples={all_examples} on:data-filtered={({ detail }) => filtered_examples = detail} />

		{#each filtered_examples.sort(by_book_order).slice(0, MAX_EXAMPLES_DISPLAYED) as { reference, context }, i}
			<details on:toggle={event => handle_queue(event, i)} transition:fade={FADE_CHARACTERISTICS} class="collapse collapse-arrow bg-base-100">
				<summary class="collapse-title border border-base-200">
					<ExampleSummary {reference} {context} />
				</summary>

				<section class="collapse-content">
					{#if retrieval_queue.includes(i)}
						<TargetData {reference} />

						<SourceData {reference} />
					{/if}
				</section>
			</details>
		{:else}
			No matching examples.
		{/each}

		{#if filtered_examples.length > MAX_EXAMPLES_DISPLAYED}
			<section class="alert alert-warning">
				<Icon icon="ci:triangle-warning" class="h-7 w-7" />

				<span>
					Only showing the first
					<span class="font-mono">{MAX_EXAMPLES_DISPLAYED}</span>
					matching examples.
				</span>
			</section>
		{/if}
	{/await}
</article>
