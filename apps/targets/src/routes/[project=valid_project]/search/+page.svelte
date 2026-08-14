<script lang="ts">
	import { build_filter_options, build_search_regex, by_book_order, filter_search_results, SearchFilterForm, SearchResultCard } from '$lib/search'
	import type { ReturnTo, SearchTextResult } from '$lib/types'
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	let return_to: ReturnTo | undefined = $derived(data.return_to)

	let matches: SearchTextResult[] = $derived(data.results ?? [])
	let found = $derived(matches.length > 0)
	let search_terms: string[] = $derived(data.search_terms || [])
	let searched = $derived(search_terms.length > 0)
	let search_regex = $derived(build_search_regex(search_terms))

	let selected_filters = $state<Record<string, string>>({})

	let filters = $derived(build_filter_options(matches))

	$effect(() => {
		for (const [name, options] of filters) {
			if (!(name in selected_filters) || !options.includes(selected_filters[name])) {
				selected_filters[name] = options[0]
			}
		}
	})

	let filtered_results = $derived(filter_search_results(matches, selected_filters))
	let sorted_results = $derived(filtered_results.slice().sort(by_book_order))

	let collapse_states = $state<boolean[]>([])

	$effect(() => {
		collapse_states = sorted_results.map(() => false)
	})
</script>

<SearchFilterForm
	{searched}
	{found}
	matches_count={matches.length}
	filtered_count={filtered_results.length}
	{return_to}
	{filters}
	bind:selected_filters
/>

{#if searched}
	<section class="prose mt-2 max-w-none overflow-x-auto text-pretty">
		{#each sorted_results as result, i (`${result.reference.id_primary}:${result.reference.id_secondary}:${result.reference.id_tertiary}`)}
			<SearchResultCard
				{result}
				{selected_filters}
				{search_regex}
				bind:open={collapse_states[i]}
			/>
		{/each}
	</section>
{/if}

<style>
	/* this corrects a problem where the features popup was getting hidden behind the next details element below it */
	:global(details[open]) {
		z-index: 999;
	}
</style>