<script>
	import { page } from '$app/stores'
	import Card from '$lib/Card.svelte'

	/** @type {import('./$types').PageData} */
	export let data

	$: searched = !! $page.url.search
	$: matches = data.matches
	$: found = !! matches.length
</script>

<!-- https://tailwindcss.com/docs/typography-plugin#overriding-max-width -->
<header>
	<em class="badge gap-2 invisible" class:!visible={searched} class:badge-success={found} class:badge-warning={!found}>
		{#if found}
			<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
		{:else}
			<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
		{/if}

		{matches.length} results
	</em>
</header>

<!-- https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Grids#as_many_columns_as_will_fit -->
<section class="grid grid-cols-[repeat(auto-fit,minmax(30ch,1fr))] gap-10 mt-8">
	{#each matches as concept}
		<Card {concept} />
	{/each}
</section>
