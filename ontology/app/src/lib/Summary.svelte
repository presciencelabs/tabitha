<script>
	import {Category} from './categorization'

	/** @type {Concept} */
	export let concept
</script>

<article class="card card-normal card-bordered shadow-lg dark:shadow-neutral-700">
	<main class="card-body">
		<section class="prose card-title max-w-none justify-between">
			<h2 class="relative whitespace-nowrap pb-6">
				{concept.roots}
				<sup class="-top-4 font-mono text-sm text-neutral-500">{concept.sense}</sup>
				<sub class="-bottom-4 -left-4 font-light italic text-neutral-500">{concept.part_of_speech}</sub>
			</h2>

			<aside class="flex flex-col items-center gap-1 self-start">
				<span class="badge badge-primary badge-lg">
					L{concept.level}
				</span>

				<span class="badge badge-success badge-md tooltip tooltip-right font-mono" data-tip="Occurrences">
					{concept.occurrences}
				</span>
			</aside>
		</section>

		<section class="prose flex-grow">
			<p>
				{concept.gloss}
			</p>
		</section>

		{#if concept.part_of_speech === 'Verb'}
			<section class="prose mt-4 max-w-none">
				<Category {concept} />
			</section>
		{/if}
	</main>

	<!-- I needed to apply some padding since the buttons for a card are intended to be inside the body but it doesn't make for the best semantic structure -->
	<footer class="card-actions justify-end me-4 mb-4">
		<button class="btn btn-sm btn-secondary">
			Details
		</button>
	</footer>
</article>
