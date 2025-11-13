<script>
	import { fade } from 'svelte/transition'
	import Icon from '@iconify/svelte'
	import { SourceData } from '$lib'
	import { bible_books } from '$lib/lookups'
	import { PUBLIC_ONTOLOGY_API_HOST } from '$env/static/public'

	/** @type {import('./$types').PageData} */
	export let data

	/** @type {ReturnTo|undefined}*/
	const return_to = data.return_to

	$: matches = data.results
	$: found = !!matches.length
	$: icon = `material-symbols:${found ? 'check-circle' : 'warning'}-outline-rounded`

	$: search_term = data.search_term
	$: searched = !!search_term.length
	$: SEARCH_TERM_REGEX = new RegExp(`(${search_term.toLowerCase().replaceAll(/[%#*]/g, '.*?')})`, 'gi')

	const FADE_CHARACTERISTICS = {
		delay: 100,
		duration: 700,
	}

	/** @type { boolean[] } */
	let collapse_states = []

	/**
	 * @param {number} id
	 */
	function toggle_collapse(id) {
		collapse_states[id] = !collapse_states[id]
	}

	/** @type {Record<string, string>}*/
	$: selected_filters = {}

	$: filters = derive_filters(matches)

	$: filtered_results = apply_filters(matches, selected_filters)

	/**
	 * @param {SearchTextResult[]} results
	 */
	function derive_filters(results) {
		/** @type { FilterMap } */
		const filters = new Map()
		
		const book_names_found_in_examples = [...new Set(results.sort(by_book_order).map(result => result.reference.id_primary))]
		filters.set('Book', ['Any', ...book_names_found_in_examples])

		const audiences_found_in_examples = [...new Set(results.flatMap(result => result.texts.map(t => t.audience)))].sort()
		if (audiences_found_in_examples.length > 1) {
			filters.set('Audience', ['Any', ...audiences_found_in_examples])
		} else {
			filters.set('Audience', audiences_found_in_examples)
		}

		for (const [name, options] of filters) {
			selected_filters[name] = options[0]
		}

		return filters
	}

	/**
	 * @param {SearchTextResult[]} results
	 * @param {Record<string, string>} filters
	 */
	function apply_filters(results, filters) {
		const filtered_results = results.filter(is_a_match)
		collapse_states = filtered_results.map(_ => false)
		return filtered_results

		/** @param { SearchTextResult } result */
		function is_a_match(result) {
			return Object.entries(filters).every(satisfies_filter)

			/** @param { [string, string] } filter */
			function satisfies_filter([name, option]) {
				if (option === 'Any') {
					return true
				}
				if (name === 'Book' && result.reference.id_primary === option) {
					return true
				}
				if (name === 'Audience' && result.texts.some(t => t.audience === option)) {
					return true
				}
				return false
			}
		}
	}

	/**
	 * @param { SearchTextResult } result_1
	 * @param { SearchTextResult } result_2
	 * @returns { number }
	 */
	function by_book_order({ reference: { id_primary: book_name_1 } }, { reference: { id_primary: book_name_2 } }) {
		const books_in_order = Object.values(bible_books)
		const index_1 = books_in_order.indexOf(book_name_1)
		const index_2 = books_in_order.indexOf(book_name_2)
		return index_1 - index_2
	}
</script>

<header class="flex justify-between">
	<em class="badge badge-lg invisible gap-2" class:visible={searched} class:badge-success={found} class:badge-warning={!found}>
		<Icon {icon} />

		<strong>{matches.length}</strong> results
	</em>
</header>

<section class="join join-vertical invisible pt-2 w-full" class:visible={searched}>
	<form class="join gap-4 bg-info text-info-content px-4 pb-4 overflow-x-auto join-item">
		{#if return_to?.app === 'ontology'}
			<!--Eventually return_to may support other values as well-->
			<div class="mt-6">
				<a class="btn" href="{PUBLIC_ONTOLOGY_API_HOST}{return_to.q ? `?q=${return_to.q}&scope=stems` : '/'}">
					<Icon icon="mdi:arrow-left-thin" class="h-6 w-6" />
					Return to Ontology
				</a>
			</div>

			<div class="divider divider-horizontal pt-4 mx-0"></div>
		{/if}

		{#each filters as [name, options]}
			<label class="join-item flex flex-col">
				<span class="text-info-content label py-1">{name}</span>

				<select bind:value={selected_filters[name]} class="select text-base-content">
					{#each options as option}
						<option value={option}>{option}</option>
					{/each}
				</select>
			</label>
		{/each}
	</form>
	
	{#if filtered_results.length > 0 && filtered_results.length < matches.length}
		<aside transition:fade={FADE_CHARACTERISTICS} class="alert alert-info join-item">
			<span>
				Matched
				<span class="font-mono">{filtered_results.length}</span>
				{filtered_results.length === 1 ? 'result' : 'results'}
			</span>
		</aside>
	{/if}
</section>

<section class="prose mt-2 max-w-none overflow-x-auto invisible" class:visible={searched}>
	{#each filtered_results.sort(by_book_order) as result, i}
		{@const { id_primary, id_secondary, id_tertiary } = result.reference}
		{@const filtered_audiences = result.texts.filter(t => selected_filters['Audience'] === 'Any' ? true : selected_filters['Audience'] === t.audience)}

		<details transition:fade={FADE_CHARACTERISTICS} open={collapse_states[i]} class="collapse collapse-arrow bg-base-100 overflow-visible">
			<summary on:click|preventDefault={_ => toggle_collapse(i)} class="collapse-title border border-base-200 hover:bg-base-200">
				<section class="flex">
					<span class="min-w-1/8 w-1/8 flex-shrink-0 whitespace-nowrap font-semibold">
						{id_primary} {id_secondary}:{id_tertiary}
					</span>

					<aside class="not-prose">
						{#each filtered_audiences as { text, audience }}
							<p class="mb-1">
								<span class="font-semibold">({audience})</span>
								{#each text.split(SEARCH_TERM_REGEX) as t, i}
									<!--When splitting on the search term, every other item is the search term-->
									{#if i % 2 === 0}
										{t}
									{:else}
										<span class="font-semibold italic">{t}</span>
									{/if}
								{/each}
							</p>
						{/each}
					</aside>
				</section>
			</summary>

			<section class="collapse-content flex">
				{#if collapse_states[i]}
					<div class="min-w-1/8 w-1/8"><!--Empty just to fill the same space as the verse reference--></div>
					<div class="w-7/8">
						<SourceData reference={result.reference} />
					</div>
				{/if}
			</section>
		</details>
	{/each}
</section>

<style>
	/* overrode tailwind here to keep from having to use !visible (!important) due to tw's definition order of visible and invisible */
	.visible {
		visibility: visible;
	}

	/* this corrects a problem where the features popup was getting hidden behind the next details element below it */
	details[open] {
		z-index: 999;
	}
</style>