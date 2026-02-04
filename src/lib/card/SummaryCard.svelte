<script>
	import Icon from '@iconify/svelte'
	import Header from './Header.svelte'
	import SimplificationHints from './SimplificationHints.svelte'
	import { Category } from './categorization'
	import { DetailedCard, Meaning } from '$lib'
	import { page } from '$app/state'
	import { CONCEPT_FILTERS } from '$lib/filters'

	/** @type {Concept} */
	export let concept

	/** @type {boolean} */
	export let show_how_to

	let expanded = false
	function expand() {
		expanded = true
	}
	function close() {
		expanded = false
	}
</script>

<article class="card card-bordered grow shadow-lg dark:shadow-neutral-700">
	<main class="card-body">
		<section class="prose card-title max-w-none justify-between">
			<Header {concept} />
		</section>

		<section class="prose max-w-none">
			<Meaning {concept} />
		</section>

		{#if concept.part_of_speech === 'Verb' && CONCEPT_FILTERS.IS_OR_WILL_BE_IN_ONTOLOGY(concept)}
			{@const { part_of_speech, categories } = concept}
			<section class="prose mt-4 max-w-none">
				<Category {part_of_speech} {categories} />
			</section>
		{/if}
		
		{#if show_how_to && (concept.how_to_hints.length > 0 || CONCEPT_FILTERS.IS_COMPLEX(concept))}
			<section class="prose mt-4 max-w-none">
				<h3 class="mb-0">Suggestions for how to handle</h3>
				<SimplificationHints {concept} />
			</section>
		{/if}

		<section class="card-actions mt-4 justify-end">
			{#if CONCEPT_FILTERS.IS_IN_ONTOLOGY(concept) && page.data.can_update}
				<a class="btn btn-sm" title="Edit" href="protected/concept/update?concept={concept.stem}-{concept.sense}-{concept.part_of_speech}">
					<Icon icon="mdi:edit-outline" class="h-5 w-5" />
				</a>
			{/if}
			<button on:click={expand} class="btn btn-primary btn-sm">
				EXPAND <Icon icon="gg:maximize-alt" class="h-4 w-4" />
			</button>
		</section>
	</main>
</article>

{#if expanded}
	<DetailedCard {concept} on:close={close} />
{/if}
