<script>
	import Icon from '@iconify/svelte'
	import {Header, Meaning} from '.'
	import Category from './Category.svelte'
	import Details from '$lib/Details.svelte'

	/** @type {Concept} */
	export let concept

	/** @type {HTMLDialogElement} */
	let dialog
	const expand = () => dialog.showModal()

	$: examples = concept.examples
	$: exhaustive_examples = concept.exhaustive_examples
</script>

<article class="card card-bordered shadow-lg dark:shadow-neutral-700 grow">
	<main class="card-body">
		<section class="prose card-title max-w-none justify-between">
			<Header {concept} />
		</section>

		<section class="prose flex-grow">
			<Meaning {concept} />
		</section>

		{#if concept.part_of_speech === 'Verb'}
			<section class="prose mt-4 max-w-none">
				<Category {concept} />
			</section>
		{/if}

		<section class="card-actions mt-4 justify-end">
			<button on:click={expand} class="btn btn-primary btn-sm">
				EXPAND <Icon icon="gg:maximize-alt" class="h-4 w-4" />
			</button>
		</section>
	</main>
</article>

<!-- https://daisyui.com/components/modal -->
<dialog bind:this={dialog} class="modal">
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
							Examples ({examples.length})
						</span>

						{#each examples as { sentence, reference, semantic_representation }}
							<blockquote class="mb-0">
								<span>
									{sentence}
								</span>
								<cite data-tip="Source: {reference.source}" class="tooltip tooltip-info tooltip-right text-xs block text-start w-fit">
									({reference.book} {reference.chapter}:{reference.verse})
								</cite>

								<footer class="mt-4 flex justify-around bg-base-100">
									{#each semantic_representation as {part_of_speech, role, word}}
										<span class="flex flex-col items-center py-2">
											<span class="not-italic tracking-widest text-base-content mb-1">
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

				<section class="prose mt-4 max-w-none">
					<Details colors="bg-base-200">
						<span slot="summary">
							Exhaustive examples ({exhaustive_examples.length})
						</span>

						{#each exhaustive_examples as { reference, unknown_encoding }}
							<div class="py-2">
								<span data-tip="Source: {reference.source}" class="tooltip tooltip-info tooltip-right text-sm">
									{reference.book}
									{reference.chapter}:{reference.verse}
								</span>

								<code class="indicator">
									{unknown_encoding}
									<span data-tip="TBD: still needs to be decoded" class="indicator-item badge badge-xs badge-warning tooltip tooltip-top" />
								</code>
							</div>
						{:else}
							–
						{/each}
					</Details>
				</section>
			</main>
		</article>
	</section>

	<form method="dialog" class="modal-backdrop">
		<button>Close</button>
	</form>
</dialog>
