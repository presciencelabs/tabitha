<script>
	import { display_context_arguments } from './examples'
	import SourceData from './SourceData.svelte'
	import TargetData from './TargetData.svelte'

	/** @type {Concept} */
	export let concept

	$: bible_examples = concept.examples.filter(example => example.reference.source === 'Bible')

	/** @type {number[]} */
	let retrieval_queue = []

	/**
	 * @param {Event & {currentTarget: HTMLDetailsElement}} event
	 * @param {number} id
	 */
	function handle_queue({currentTarget: details}, id) {
		if (details.open) {
			retrieval_queue = [...retrieval_queue, id]
		} else {
			retrieval_queue = retrieval_queue.filter(queued_id => queued_id !== id)
		}
	}
</script>

<article class="bg-base-200 p-4 flex flex-col gap-4 prose max-w-none">
	<h3>Bible</h3>

	{#each bible_examples as {reference, context_arguments}, i}
		{@const { book, chapter, verse } = reference}
		<details on:toggle={event => handle_queue(event, i)} class="collapse collapse-arrow bg-base-100">
			<summary class="collapse-title border border-base-200">
				{book} {chapter}:{verse} (<span class="italic">{display_context_arguments(concept, context_arguments)}</span>)
			</summary>

			<section class="collapse-content">
				{#if retrieval_queue.includes(i)}
					<SourceData {reference} />

					<h4>
						Generated English text
					</h4>
					<p>
						<TargetData {reference} />
					</p>
				{/if}
			</section>
		</details>
	{/each}
</article>
