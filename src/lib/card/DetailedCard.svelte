<script>
	import Icon from '@iconify/svelte'
	import { Details, Examples, Meaning } from '$lib'
	import Header from './Header.svelte'
	import SimplificationHints from './SimplificationHints.svelte'
	import { Category } from './categorization'
	import { onMount } from 'svelte'

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

				<section class="prose max-w-none">
					<Meaning {concept} />
				</section>

				<section class="prose mt-4 max-w-none">
					<Category {concept} />
				</section>

				{#if concept.status === 'in ontology'}
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
									<cite data-tip="Source: {reference.type}" class="tooltip tooltip-right tooltip-info block w-fit text-start text-xs">
										({reference.id_primary}
										{reference.id_secondary}:{reference.id_tertiary})
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
				{/if}

				{#if concept.how_to_hints.length > 0 || ['2', '3'].includes(concept.level)}
					<section class="prose mt-4 max-w-none">
						<h3 class="mb-0">Suggestions for how to handle</h3>
						<SimplificationHints {concept} />
					</section>
				{/if}

				{#if concept.status === 'in ontology'}
					<section class="prose mt-4 max-w-none">
						<h3>Examples</h3>
						<Examples {concept} />
					</section>
				{/if}
			</main>
		</article>
	</section>

	<form method="dialog" class="modal-backdrop">
		<button>Close</button>
	</form>
</dialog>
