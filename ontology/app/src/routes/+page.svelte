<script>
	import {page} from '$app/stores'
	import {Card} from '$lib/card'
	import Icon from '@iconify/svelte' // https://iconify.design/

	/** @type {import('./$types').PageData} */
	export let data

	$: searched = !!$page.url.search
	$: matches = data.matches
	$: found = !!matches.length
	$: icon = `material-symbols:${found ? 'check-circle' : 'warning'}-outline-rounded`
</script>

<header>
	<em class="badge badge-lg invisible gap-2" class:visible={searched} class:badge-success={found} class:badge-warning={!found}>
		<Icon {icon} />

		<strong>{matches.length}</strong> results
	</em>
</header>

<!-- https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Grids#as_many_columns_as_will_fit -->
<section class="mt-8 flex flex-row flex-wrap gap-10">
	{#each matches as concept (concept.id)}
		<Card {concept} />
	{/each}
</section>

<style>
	/* overrode tailwind here to keep from having to use !visible (!important) due to tw's definition order of visible and invisible */
	.visible {
		visibility: visible;
	}
</style>
