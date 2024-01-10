<script>
	import Icon from '@iconify/svelte' // https://iconify.design/
	import {page} from '$app/stores'
	import {DisplayPreference, SummaryCard, Table} from '$lib'

	/** @type {import('./$types').PageData} */
	export let data

	/** @type {'grid'|'table'} */
	let display_preference = 'grid'

	$: searched = !!$page.url.search
	$: matches = data.matches
	$: found = !!matches.length
	$: icon = `material-symbols:${found ? 'check-circle' : 'warning'}-outline-rounded`

	/** @param {CustomEvent<'grid'|'table'>} preference_event */
	function set_preference({detail}) {
		display_preference = detail
	}
</script>

<header class="flex justify-between">
	<em class="badge badge-lg invisible gap-2" class:visible={searched} class:badge-success={found} class:badge-warning={!found}>
		<Icon {icon} />

		<strong>{matches.length}</strong> results
	</em>

	<DisplayPreference on:preference={set_preference} />
</header>

{#if display_preference === 'grid'}
	<section class="mt-8 flex flex-row flex-wrap gap-10">
		{#each matches as concept (concept.id)}
			<SummaryCard {concept} />
		{/each}
	</section>
{:else}
	<section class="prose mt-8 max-w-none overflow-x-auto">
		<Table concepts={matches} />
	</section>
{/if}

<style>
	/* overrode tailwind here to keep from having to use !visible (!important) due to tw's definition order of visible and invisible */
	.visible {
		visibility: visible;
	}
</style>
