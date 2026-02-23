<script>
	import { is_boundary_start } from '$lib/encoding/entity_filters'
	import Punctuation from '$lib/entity_displays/Punctuation.svelte'

	/** @type {PageSourceEntity} */
	export let selected_entity
</script>

<div class="entity-{selected_entity.boundary_category}">
	{#if is_boundary_start(selected_entity)}
		{@const is_main_clause = selected_entity.value === '{'}
		<div class="inline-flex items-center pe-2">
			<Punctuation source_entity={{ ...selected_entity, value: '[' }} classes={is_main_clause ? 'text-7xl' : ''} />
			<span class="font-semibold -ms-1">{selected_entity.category_abbr}</span>
			<span class="mx-2 tracking-widest">...</span>
			<Punctuation source_entity={{ ...selected_entity, value: ']' }} classes={is_main_clause ? 'text-7xl' : ''} />
		</div>
	{:else if selected_entity.concept !== null}
		<div class="badge badge-lg rounded-full border-base-content badge-outline mx-1 py-5 text-md entity-{selected_entity.category_abbr}">
			<span class="pe-2 py-4">
				{selected_entity.category_abbr}
				{#if selected_entity.noun_list_index}
					<sub class="-bottom-1.5 -left-1 italic">{selected_entity.noun_list_index}</sub>
				{/if}
			</span>

			<div class="py-4">
				{#if selected_entity.pairing_concept === null}
					<span>{selected_entity.concept.stem}-{selected_entity.concept.sense}</span>
				{:else}
					<div class="join">
						<span>{selected_entity.concept.stem}-{selected_entity.concept.sense}</span>
						<span class="px-1">{selected_entity.pairing_type}</span>
						<span>{selected_entity.pairing_concept.stem}-{selected_entity.pairing_concept.sense}</span>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>