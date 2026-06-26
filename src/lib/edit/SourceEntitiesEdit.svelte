<script lang="ts">
	import Concept from '../entity_displays/Concept.svelte'
	import BoundaryEnd from '../entity_displays/BoundaryEnd.svelte'
	import BoundaryStart from '../entity_displays/BoundaryStart.svelte'
	import Punctuation from '../entity_displays/Punctuation.svelte'
	import { is_boundary_end, is_boundary_start } from '$lib/encoding/entity_filters'
	import EntityContextMenu from './EntityContextMenu.svelte'
	import { structure_entities } from '$lib/encoding/structured'

	type IndexRange = [number, number]

	interface Props {
		source_entities: PageSourceEntity[]
		selected_entity: PageSourceEntity|null
		on_entity_select: (entity: PageSourceEntity|null) => void
	}
	let { source_entities = $bindable(), selected_entity, on_entity_select }: Props = $props()

	// let entity_divs: HTMLElement[] = $state([])

	let hover_range: IndexRange | null = $state(null)
	let select_range: IndexRange | null = $derived(
		!selected_entity ? null
			: is_boundary_start(selected_entity)
				? get_boundary_range(selected_entity.id)
				: [selected_entity.id, selected_entity.id]
	)

	let entity_highlights: string[] = $derived(source_entities.map((_, i) => {
		if (hover_range && i >= hover_range[0] && i <= hover_range[1]) {
			return 'bg-base-300'
		}
		if (select_range && i >= select_range[0] && i <= select_range[1]) {
			return 'bg-neutral-content'
		}
		return ''
	}))

	const component_filters: [(entity: PageSourceEntity) => boolean, typeof Concept][] = [
		[is_boundary_start, BoundaryStart],
		[is_boundary_end, BoundaryEnd],
		[({ concept }) => !!concept, Concept],
		[() => true, Punctuation],
	]

	let entity_context_menu_open = $state(false)
	let entity_context_menu_data: EntityContextMenuData = $state({
		entity_id: -1,
		x: 0,
		y: 0,
	})

	function open_entity_context_menu(event: any, entity_id: number) {
		event.stopPropagation()
		event.preventDefault()
		entity_context_menu_data = {
			entity_id,
			x: event.clientX,
			y: event.clientY,
		}
		entity_context_menu_open = true
	}

	function close_entity_context_menu(recalculate: boolean, id_to_select?: number) {
		entity_context_menu_open = false
		if (recalculate) {
			structure_entities(source_entities)
			if (id_to_select) {
				entity_focus(id_to_select)
			} else if (id_to_select === -1) {
				on_entity_select(null)
			}
		}
	}

	function entity_mouseover(i: number) {
		hover_range = get_boundary_range(i)
	}

	function entity_mouseout() {
		hover_range = null
	}

	function entity_focus(i: number) {
		const entity = source_entities[i]
		if (is_boundary_end(entity)) {
			// select the boundary start instead
			on_entity_select(source_entities[entity.parent_id])
		} else {
			on_entity_select(entity)
		}
	}

	function get_boundary_range(i: number): IndexRange {
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
		{@const Component = component_filters.find(([filter]) => filter(entity))?.[1]}
		<div role="button" tabindex="0" class="id-{i} cursor-default content-center h-20 {entity_highlights[i]}"
				onmouseenter={() => entity_mouseover(i)}
				onfocus={() => entity_focus(i)}
				onmouseleave={entity_mouseout}
				onblur={() => {}}
				oncontextmenu={event => open_entity_context_menu(event, i)} >
			<Component source_entity={entity} />
		</div>
	{/each}

	{#if entity_context_menu_open}
		<EntityContextMenu
				bind:source_entities={source_entities}
				data={entity_context_menu_data}
				onclose={close_entity_context_menu} />
	{/if}
</div>