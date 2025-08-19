<script>
	import Icon from '@iconify/svelte'
	import Header from './Header.svelte'
	import Meaning from './Meaning.svelte'
	import SimplificationHints from './SimplificationHints.svelte'
	import { Category } from './categorization'
	import { DetailedCard } from '$lib'

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

		<section class="prose flex-grow">
			<Meaning {concept} />
		</section>

		{#if concept.part_of_speech === 'Verb'}
			<section class="prose mt-4 max-w-none">
				<Category {concept} />
			</section>
		{/if}
		
		{#if show_how_to && (concept.how_to_hints.length > 0 || ['2', '3'].includes(concept.level))}
			<section class="prose mt-4 max-w-none">
				<h3 class="mb-0">Suggestions for how to handle</h3>
				<SimplificationHints {concept} />
			</section>
		{/if}

		<section class="card-actions mt-4 justify-end">
			<button on:click={expand} class="btn btn-primary btn-sm">
				EXPAND <Icon icon="gg:maximize-alt" class="h-4 w-4" />
			</button>
		</section>
	</main>
</article>

{#if expanded}
	<DetailedCard {concept} on:close={close} />
{/if}
