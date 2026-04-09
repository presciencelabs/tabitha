<script>
	import { Navigation, SourceEntities } from '$lib'
	import Settings from '$lib/settings/Settings.svelte'
	import Sidebar from '$lib/sidebar/Sidebar.svelte'
	import Icon from '@iconify/svelte'

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

{#if source.status !== 'Ready to Translate' && source.parsed_semantic_encoding.length > 0}
	{@const time_note = source.status === 'Final Review in Progress' ? 'almost' : 'not yet'}
	<div role="alert" class="alert alert-warning">
		<Icon icon="mdi:alert-outline" class="h-6 w-6" />
		<span>Source data for this verse is still being reviewed, and is {time_note} ready for translation.</span>
	</div>
{:else if source.status === 'Not Started'}
	<div class="flex justify-center prose max-w-full">
		<p>No source data yet for this verse.</p>
	</div>
{:else if source.status !== 'Ready to Translate'}
	<div class="flex justify-center prose max-w-full">
		<p>Source data for this verse is currently being developed.</p>
	</div>
{/if}

{#if source.parsed_semantic_encoding.length > 0}
	<div class="flex h-screen">
		<div class="transition-all duration-300 flex-[1_1_auto]" style="margin-right: {sidebar_open ? '24rem' : '0'};">
			<SourceEntities source_entities={source.parsed_semantic_encoding} {selected_entity} {handle_entity_selected} />
		</div>
		{#if sidebar_open}
			<Sidebar {selected_entity} is_open={sidebar_open} {close_sidebar} noun_list={source.noun_list} />
		{/if}
	</div>
{/if}
