<script>
	import Details from './Details.svelte'
	import Stat from './Stat.svelte'

	/** @type {Concept} */
	export let concept

	/** @type {import('./Stat.svelte').StatInput[]} */ //TODO: not sure how to do this typing...
	const stats = [
		{
			description: 'occurrences',
			value: concept.occurrences,
		},
		{
			description: 'categories',
			value: concept.categories || '–',
		},
	]

	$: examples = concept.examples
	$: exhaustive_examples = concept.exhaustive_examples
</script>

<article class="card card-bordered shadow-xl dark:shadow-neutral-700">
	<main class="card-body">
		<section class="card-title prose max-w-none">
			<h2 class="whitespace-nowrap">{concept.roots}</h2>
			<sub class="italic text-neutral-500">{concept.part_of_speech}</sub>
			<!-- moving last child to the end in a flex container:  https://medium.com/@iamryanyu/how-to-align-last-flex-item-to-right-73512e4e5912 -->
			<!-- https://tailwindcss.com/docs/margin#using-logical-properties -->

			<span class="ms-auto self-start">
				<mark class="badge badge-accent">L{concept.level}</mark>
			</span>

			<!-- https://daisyui.com/components/tooltip -->
		</section>

		<section class="prose">
			<p>
				{concept.gloss}
			</p>
		</section>

		<section class="mt-8">
			<Stat {stats} bg-color-class="bg-base-200" />
		</section>

		<section class="mt-4 prose">
			<Details bg-color-class="bg-base-200">
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

		<section class="mt-4 prose">
			<Details bg-color-class="bg-base-200">
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

		<footer class="card-actions prose mt-4 max-w-none justify-end">
			<small>{concept.id}</small>
		</footer>
	</main>
</article>
