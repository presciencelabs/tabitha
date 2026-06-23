<script>
	import { is_boundary_start } from '$lib/encoding/entity_filters'
	import Punctuation from '$lib/entity_displays/Punctuation.svelte'

	/** @type {PageSourceEntity} */
	export let entity
</script>

<div class="entity-{entity.boundary_category}">
	{#if is_boundary_start(entity)}
		{@const is_main_clause = entity.value === '{'}
		<div class="inline-flex items-center pe-2">
			<Punctuation source_entity={{ ...entity, value: '[' }} classes={is_main_clause ? 'text-7xl' : ''} />
			<span class="font-semibold -ms-1">{entity.category_abbr}</span>
			<span class="mx-2 tracking-widest">...</span>
			<Punctuation source_entity={{ ...entity, value: ']' }} classes={is_main_clause ? 'text-7xl' : ''} />
		</div>
	{:else if entity.concept !== null}
		<div class="badge badge-lg rounded-full border-base-content badge-outline mx-1 py-5 text-md entity-{entity.category_abbr}">
			<span class="pe-2 py-4">
				{entity.category_abbr}
				{#if entity.noun_list_index}
					<sub class="-bottom-1.5 -left-1 italic">{entity.noun_list_index}</sub>
				{/if}
			</span>

			<div class="py-4">
				{#if entity.pairing_concept === null}
					<span>{entity.concept.stem}-{entity.concept.sense}</span>
				{:else}
					<div class="join">
						<span>{entity.concept.stem}-{entity.concept.sense}</span>
						<span class="px-1">{entity.pairing_type}</span>
						<span>{entity.pairing_concept.stem}-{entity.pairing_concept.sense}</span>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>