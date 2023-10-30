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
		<section class="card-title prose max-w-none">
			<h2 class="whitespace-nowrap">{concept.roots}</h2>
			<sub class="italic text-neutral-500">{concept.part_of_speech}</sub>
		</section>

		<section class="prose flex-grow">
			<p>
				{concept.gloss}
			</p>
		</section>

		<section class="mt-8">
			<!-- https://daisyui.com/components/stat -->
			<dl class="stats w-full bg-base-200">
				<div class="stat place-items-center">
					<dd class="stat-value">L{concept.level}</dd>
					<dt class="stat-desc">level</dt>
				</div>
				<div class="stat place-items-center">
					<dd class="stat-value">{concept.occurrences}</dd>
					<dt class="stat-desc">occurrences</dt>
				</div>
			</dl>
		</section>

		{#if concept.part_of_speech === 'Verb'}
			<section class="mt-4 prose max-w-none">
				<Details colors="bg-base-200">
					<span slot="summary">
						Theta grid
					</span>

					<ThetaGrid {categories} />
				</Details>
			</section>
		{/if}

		<section class="mt-4 prose max-w-none">
			<Details colors="bg-base-200">
				<span slot="summary">
					Examples ({examples.length})
				</span>

				{#each examples as { sentence, references, semantic_representation }}
					<blockquote>
						{sentence}
					</blockquote>
					<pre class="text-xs">{references} {semantic_representation}</pre>
				{:else}
					–
				{/each}
			</Details>
		</section>

		<section class="mt-4 prose max-w-none">
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

	<footer class="prose grid place-items-end me-4 mb-2">
		<small>{concept.id}</small>
	</footer>
</article>
