<script>
	import Details from './Details.svelte'
	import ThetaGrid from './ThetaGrid.svelte'

	/** @type {Concept} */
	export let concept

	$: categories = concept.categories
	$: examples = concept.examples
	$: exhaustive_examples = concept.exhaustive_examples
</script>

<article class="card card-bordered shadow-lg dark:shadow-neutral-700">
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
				<ThetaGrid {categories} />
			</section>
		{/if}

		<section class="prose mt-4 max-w-none">
			<Details colors="bg-base-200">
				<span slot="summary">
					Examples ({examples.length})
				</span>

				{#each examples as {sentence, reference, semantic_representation}}
					<blockquote class="mb-0">
						<span>
							{sentence}

							<cite data-tip="Source: {reference.source}" class="tooltip text-sm">
								({reference.book} {reference.chapter}:{reference.verse})
							</cite>
						</span>

						<footer class="flex justify-around bg-neutral mt-4">
							{#each semantic_representation as {part_of_speech, role, word}}
								<span class="flex flex-col items-center py-2">
									<span class="not-italic tracking-widest text-neutral-400">
										{word}
									</span>
									<small class="text-xs text-neutral-500 font-mono">
										{part_of_speech} {role ? `[${role}]` : ''}
									</small>
								</span>
							{/each}
						</footer>
					</blockquote>
				{:else}
					–
				{/each}
			</Details>
		</section>

		<section class="prose mt-4 max-w-none">
			<Details colors="bg-base-200">
				<span slot="summary">
					Exhaustive examples ({exhaustive_examples.length})
				</span>

				{#each exhaustive_examples as example}
					<pre>{example}</pre>
				{:else}
					–
				{/each}
			</Details>
		</section>
	</main>

	<footer class="prose mb-2 me-4 grid place-items-end">
		<small>{concept.id}</small>
	</footer>
</article>
