<script lang="ts">
	import Concept from '../entity_displays/Concept.svelte'
	import BoundaryEnd from '../entity_displays/BoundaryEnd.svelte'
	import BoundaryStart from '../entity_displays/BoundaryStart.svelte'
	import Punctuation from '../entity_displays/Punctuation.svelte'
	import EntityContextMenu from './EntityContextMenu.svelte'
	import InsertEntityContextMenu from './InsertEntityContextMenu.svelte'
	import { is_boundary_end, is_boundary_start } from '$lib/encoding/entity_filters'
	import { structure_entities } from '$lib/encoding/structured'
	import { view_settings, set_settings } from '$lib/settings/settings.svelte.js'

	type IndexRange = [number, number]

	interface Props {
		source_entities: PageSourceEntity[]
		selected_entity: PageSourceEntity|null
		on_entity_select: (entity: PageSourceEntity|null) => void
	}
	let { source_entities = $bindable(), selected_entity, on_entity_select }: Props = $props()

	let hover_range: IndexRange | null = $state(null)
	let select_range: IndexRange | null = $derived(
		!selected_entity ? null
			: is_boundary_start(selected_entity)
				? get_boundary_range(selected_entity.id)
				: [selected_entity.id, selected_entity.id],
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

	let entity_context_menu_data: EntityContextMenuData = $state({
		is_open: false,
		entity_id: -1,
		x: 0,
		y: 0,
	})

	function open_entity_context_menu(event: UIEvent, entity_id: number) {
		event.stopPropagation()
		event.preventDefault()
		entity_context_menu_data = {
			is_open: true,
			entity_id,
			...get_menu_location(event),
		}
	}

	function close_entity_context_menu(recalculate: boolean, id_to_select?: number) {
		entity_context_menu_data.is_open = false
		close_context_menu(recalculate, id_to_select)
	}

	let insert_context_menu_data: EntityContextMenuData = $state({
		is_open: false,
		entity_id: -1,
		x: 0,
		y: 0,
	})

	function open_insert_context_menu(event: UIEvent, entity_id: number) {
		event.stopPropagation()
		event.preventDefault()
		insert_context_menu_data = {
			is_open: true,
			entity_id,
			...get_menu_location(event),
		}
	}

	function close_insert_context_menu(recalculate: boolean, id_to_select?: number) {
		insert_context_menu_data.is_open = false
		insert_context_menu_data.entity_id = -1
		close_context_menu(recalculate, id_to_select)
	}

	function insert_button_in_range(i: number, range: IndexRange|null) {
		return !!range?.length && (i > range[0] && i <= range[range.length - 1])
	}

	function close_context_menu(recalculate: boolean, id_to_select?: number) {
		if (recalculate) {
			structure_entities(source_entities)
			if (id_to_select) {
				entity_focus(id_to_select)
			} else if (id_to_select === -1) {
				on_entity_select(null)
			}
		}
	}

	function get_menu_location(event: UIEvent): { x: number, y: number } {
		if (event instanceof MouseEvent) {
			return {
				x: event.clientX,
				y: event.clientY,
			}
		}

		const element_rect = (event.target as HTMLElement).getBoundingClientRect()
		return {
			x: element_rect.left,
			y: element_rect.bottom,
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

	let dragged_entity = $state<number | null>(null)
	let previous_popup_setting = $state(false)

	function drag_entity(i: number) {
		dragged_entity = i

		// temporarily hide any hover popup so that the ghost drag item doesn't include it
		previous_popup_setting = view_settings.show_hover_popups
		set_settings({ show_hover_popups: false })
	}

	function paste_entity(i: number) {
		if (dragged_entity === null) {
			return
		}

		const range_length = get_range_length(dragged_entity)
		const insert_pos = get_insert_position(i, dragged_entity, range_length)
		const entities = source_entities.splice(dragged_entity, range_length)
		source_entities.splice(insert_pos, 0, ...entities)

		structure_entities(source_entities)
		entity_focus(insert_pos)

		dragged_entity = null
		set_settings({ show_hover_popups: previous_popup_setting })

		function get_range_length(i: number) {
			if (is_boundary_start(source_entities[i])) {
				const last_child_index = source_entities.findLastIndex(entity => entity.parent_id === i)
				return last_child_index - i + 1
			} else {
				return 1
			}
		}

		function get_insert_position(drop_index: number, drag_index: number, range_length: number) {
			if (drop_index < drag_index) {
				return drop_index
			} else if (drop_index < (drag_index + range_length)) {
				return drag_index
			} else {
				return drop_index - range_length
			}
		}
	}
</script>

{#snippet insert_button(i: number)}
	{@const opacity_classes = insert_context_menu_data.entity_id === i ? 'opacity-100' : 'opacity-0 focus:opacity-100 hover:opacity-100'}
	<button
		onclick={e => open_insert_context_menu(e, i)}
		onkeydown={e => e.key === 'Enter' && open_insert_context_menu(e, i)}
		ondragover={e => e.preventDefault()}
		ondrop={() => paste_entity(i)}
		aria-label="Insert Constituent"
		class="btn btn-xs btn-primary mt-4 h-12 w-4 text-lg {opacity_classes} transition-opacity duration-150"
	>
		+
	</button>
{/snippet}

<div class="inline-flex flex-wrap py-3">
	{#each source_entities as entity}
		{@const i = entity.id}
		{@const Component = component_filters.find(([filter]) => filter(entity))?.[1]}

		<div class="{insert_button_in_range(i, hover_range) || insert_button_in_range(i, select_range) ? entity_highlights[i] : ''}">
			{@render insert_button(i)}
		</div>

		<div role="button" tabindex="0"
			draggable="true"
			onclick={() => entity_focus(i)}
			onkeydown={e => e.key === 'Enter' && entity_focus(i)}
			onmouseenter={() => entity_mouseover(i)}
			onmouseleave={entity_mouseout}
			oncontextmenu={e => open_entity_context_menu(e, i)}
			ondragstart={() => drag_entity(i)}
			ondragover={e => e.preventDefault()}
			ondrop={() => paste_entity(i)}
			class="id-{i} cursor-pointer content-center h-20 {entity_highlights[i]}"
		>
			<Component source_entity={entity} />
		</div>
	{/each}

	<div>
		{@render insert_button(source_entities.length)}
	</div>

	{#if insert_context_menu_data.is_open}
		<InsertEntityContextMenu
				bind:source_entities
				data={insert_context_menu_data}
				onclose={close_insert_context_menu} />
	{/if}

	{#if entity_context_menu_data.is_open}
		<EntityContextMenu
				bind:source_entities
				data={entity_context_menu_data}
				onclose={close_entity_context_menu} />
	{/if}
</div>