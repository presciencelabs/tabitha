<script>
	/** @type {Concept} */
	export let concept
</script>

<article class="card card-bordered shadow-xl dark:shadow-neutral-700">
	<main class="card-body">
		<section class="card-title prose">
			<h2 class="whitespace-nowrap">{concept.roots}</h2>
			<sub class="italic text-neutral-500">{concept.part_of_speech}</sub>
			<!-- moving last child to the end in a flex container:  https://medium.com/@iamryanyu/how-to-align-last-flex-item-to-right-73512e4e5912 -->
			<!-- https://tailwindcss.com/docs/margin#using-logical-properties -->

			<span class="tooltip ms-auto self-start" data-tip="occurences">
				<mark class="badge badge-accent">{concept.occurrences || 0}</mark>
			</span>

			<!-- https://daisyui.com/components/tooltip -->
		</section>

		<p class="prose mt-8">
			{concept.gloss}
		</p>

		<!-- https://daisyui.com/components/stat -->
		<dl class="stats not-prose mt-8 bg-base-200">
			<div class="stat">
				<dd class="stat-value">L{concept.level}</dd>
				<dt class="stat-desc">level</dt>
			</div>
			<div class="stat">
				<dd class="stat-value">{concept.categories || '–'}</dd>
				<dt class="stat-desc">categories</dt>
			</div>
		</dl>

		<details class="collapse bg-base-200 collapse-arrow mt-4">
			<summary class="collapse-title">
				Examples ({concept.examples.length})
			</summary>

			<p class="collapse-content">
				{#each concept.examples as {sentence}}
					<div>{sentence}</div>
				{:else}
					–
				{/each}
			</p>
		</details>

		<details class="collapse bg-base-200 collapse-arrow mt-4">
			<summary class="collapse-title">
				Exhaustive examples (//TODO:)
			</summary>

			<p class="collapse-content">
				{concept.exhaustive_examples}
			</p>
		</details>

		<footer class="card-actions justify-end mt-4">
			<small>{concept.id}</small>
		</footer>
	</main>
</article>
