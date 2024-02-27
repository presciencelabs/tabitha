<script>
	import Icon from '@iconify/svelte'
	import {Details, Examples} from '$lib'
	import Header from './_Header.svelte'
	import Meaning from './_Meaning.svelte'
	import SimplificationHints from './_SimplificationHints.svelte'
	import Category from './categorization/_Category.svelte'
	import {onMount} from 'svelte'

	/** @type {Concept} */
	export let concept

	/** @type {HTMLDialogElement} */
	let dialog

	onMount(() => dialog.showModal())

	$: curated_examples = concept.curated_examples
</script>

<!-- https://daisyui.com/components/modal -->
<dialog bind:this={dialog} on:close class="modal">
	<section class="modal-box max-w-none">
		<form method="dialog">
			<button class="btn btn-circle btn-ghost btn-sm absolute right-2 top-2">
				<Icon icon="material-symbols:close" class="h-4 w-4" />
			</button>
		</form>

		<article class="card">
			<main class="card-body">
				<section class="prose card-title max-w-none justify-between">
					<Header {concept} />
				</section>

				<section class="prose flex-grow">
					<Meaning {concept} />
				</section>

				<section class="prose mt-4 max-w-none">
					<Category {concept} />
				</section>

				<section class="prose mt-4 max-w-none">
					<Details colors="bg-base-200">
						<span slot="summary">
							Curated examples ({curated_examples.length})
						</span>

						{#each curated_examples as { sentence, reference, encoding }}
							<blockquote class="mb-0">
								<span>
									{sentence}
								</span>
								<cite data-tip="Source: {reference.source}" class="tooltip tooltip-right tooltip-info block w-fit text-start text-xs">
									({reference.book}
									{reference.chapter}:{reference.verse})
								</cite>

								<footer class="mt-4 flex justify-around bg-base-100">
									{#each encoding as { part_of_speech, role, word }}
										<span class="flex flex-col items-center py-2">
											<span class="mb-1 not-italic tracking-widest text-base-content">
												{word}
											</span>
											<small class="font-mono text-xs text-base-content">
												{part_of_speech}
												{role ? `[${role}]` : ''}
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

				{#if Number(concept.level) > 1}
					<section class="prose mt-4 max-w-none">
						<h3>Simplification hints</h3>
						<SimplificationHints {concept} />
					</section>
				{/if}

				<section class="prose mt-4 max-w-none">
					<h3>Examples</h3>
					<Examples {concept} />
				</section>
			</main>
		</article>
	</section>

	<form method="dialog" class="modal-backdrop">
		<button>Close</button>
	</form>
</dialog>
