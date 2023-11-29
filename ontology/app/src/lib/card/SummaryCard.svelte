<script>
	import Icon from '@iconify/svelte'
	import Header from './_Header.svelte'
	import Meaning from './_Meaning.svelte'
	import Category from './categorization/_Category.svelte'
	import {DetailedCard} from '$lib'

	/** @type {Concept} */
	export let concept

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
