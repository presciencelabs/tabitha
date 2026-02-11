<script>
	import { SourceEntities } from '$lib'
	import Navigation from '$lib/Navigation.svelte'
	import Settings from '$lib/settings/Settings.svelte'
	import Sidebar from '$lib/sidebar/Sidebar.svelte'

	/** @type {PageData} */
	export let data
	const { source, nav_data } = data

	/** @type {PageSourceEntity|null}*/
	$: selected_entity = null
	$: sidebar_open = false

	/**
	 * @param {PageSourceEntity} entity
	 */
	function handle_entity_selected(entity) {
		selected_entity = entity
		sidebar_open = true
	}

	function close_sidebar() {
		selected_entity = null
		sidebar_open = false
	}
</script>

<div class="grid justify-items-stretch grid-cols-3 pb-5">
	<div class="justify-self-start">
		<Settings />
	</div>
	<div class="justify-self-center">
		<Navigation {nav_data} />
	</div>
</div>

{#if source.parsed_semantic_encoding.length > 0}
	<div class="flex h-screen">
		<div class="transition-all duration-300 flex-[1_1_auto]" style="margin-right: {sidebar_open ? '24rem' : '0'};">
			<SourceEntities source_entities={source.parsed_semantic_encoding} {selected_entity} {handle_entity_selected} />
		</div>
		{#if sidebar_open}
			<Sidebar {selected_entity} is_open={sidebar_open} {close_sidebar} noun_list={source.noun_list} />
		{/if}
	</div>
{:else}
	<div class="flex justify-center prose max-w-full">
		<p>No source data yet for this verse.</p>
	</div>
{/if}
