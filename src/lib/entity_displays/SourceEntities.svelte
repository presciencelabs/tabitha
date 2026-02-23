<script>
	import Concept from './Concept.svelte'
	import BoundaryEnd from './BoundaryEnd.svelte'
	import BoundaryStart from './BoundaryStart.svelte'
	import Punctuation from './Punctuation.svelte'
	import { is_boundary_end, is_boundary_start } from '$lib/encoding/entity_filters'

	/** @type {PageSourceEntity[]} */
	export let source_entities

	/** @type {PageSourceEntity|null} */
	export let selected_entity

	/** @type {(entity: PageSourceEntity) => void}*/
	export let handle_entity_selected

	/** @type {HTMLElement[]} */
	let entity_divs = []

	/** @type {[number, number]|null} */
	$: hover_range = null
	$: select_range = !selected_entity ? null
		: is_boundary_start(selected_entity)
			? get_boundary_range(selected_entity.id)
			: [selected_entity.id, selected_entity.id]

	$: entity_highlights = source_entities.map((_, i) => {
		if (hover_range && i >= hover_range[0] && i <= hover_range[1]) {
			return 'bg-base-300'
		}
		if (select_range && i >= select_range[0] && i <= select_range[1]) {
			return 'bg-neutral-content'
		}
		return ''
	})

	/** @type {[(entity: PageSourceEntity) => boolean, typeof Concept][]}*/
	const component_filters = [
		[is_boundary_start, BoundaryStart],
		[is_boundary_end, BoundaryEnd],
		[({ concept }) => !!concept, Concept],
		[() => true, Punctuation],
	]

	/**
	 * @param {number} i
	 */
	function entity_mouseover(i) {
		hover_range = get_boundary_range(i)
	}

	function entity_mouseout() {
		hover_range = null
	}

	/**
	 * @param {number} i
	 */
	function entity_focus(i) {
		const entity = source_entities[i]
		if (is_boundary_end(entity)) {
			// select the boundary start instead
			handle_entity_selected(source_entities[entity.parent_id])
		} else {
			handle_entity_selected(entity)
		}
	}

	/**
	 * @param {number} i
	 * @returns {[number, number]}
	 */
	function get_boundary_range(i) {
		const entity = source_entities[i]
		if (is_boundary_start(entity)) {
			const last_id = source_entities.findLastIndex(e => e.parent_id === i)
			return [i, last_id]

		} else if (is_boundary_end(entity)) {
			return [entity.parent_id, entity.id]

		} else if (entity.parent_id >= 0) {
			const last_id = source_entities.findLastIndex(e => e.parent_id === entity.parent_id)
			return [entity.parent_id, last_id]

		} else {
			return [i, i]
		}
	}
</script>

<div class="inline-flex flex-wrap py-3">
	{#each source_entities as entity}
		{@const i = entity.id}
		{@const component = component_filters.find(([filter]) => filter(entity))?.[1]}
		<div bind:this={entity_divs[i]} role="button" tabindex="0" class="cursor-default content-center h-20 {entity_highlights[i]}"
				on:mouseenter={() => entity_mouseover(i)}
				on:focus={() => entity_focus(i)}
				on:mouseleave={entity_mouseout}
				on:blur={() => {}} >
			<svelte:component this={component} source_entity={entity} />
		</div>
	{/each}
</div>