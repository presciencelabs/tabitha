<script lang="ts">
	import { is_boundary_start } from '$lib/encoding/entity_filters'
	import { entity_clipboard } from './clipboard.svelte'

	interface Props {
		source_entities: PageSourceEntity[]
		data: EntityContextMenuData
		onclose: (recalculate: boolean, id_to_select?: number) => void
	}
	let { source_entities = $bindable(), data, onclose }: Props = $props()

	let entity = $derived(source_entities[data.entity_id])

	function paste_before() {
		const new_entities = entity_clipboard.paste()
		if (new_entities !== null) {
			source_entities.splice(data.entity_id, 0, ...new_entities)
			onclose(true, data.entity_id)
		} else {
			onclose(false)
		}
	}

	function paste_after() {
		const new_entities = entity_clipboard.paste()
		if (new_entities !== null) {
			source_entities.splice(data.entity_id + 1, 0, ...new_entities)
			onclose(true, data.entity_id + 1)
		} else {
			onclose(false)
		}
	}

	function cut_entity() {
		const entity_range = source_entities.splice(data.entity_id, get_range_length())
		entity_clipboard.copy(entity_range)
		onclose(true)
	}

	function copy_entity() {
		const entity_range = source_entities.slice(data.entity_id, data.entity_id + get_range_length())
		entity_clipboard.copy(entity_range)
		onclose(false)
	}

	function delete_entity() {
		source_entities.splice(data.entity_id, get_range_length())
		onclose(true, data.entity_id - 1)
	}

	function get_range_length() {
		if (is_boundary_start(entity)) {
			const last_child_index = source_entities.findLastIndex(entity => entity.parent_id === data.entity_id)
			return last_child_index - data.entity_id + 1
		} else {
			return 1
		}
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="card shadow-lg bg-base-100 min-w-50" style="position: fixed; left: {data.x}px; top: {data.y}px; z-index: 60;"
		onclick={e => e.stopPropagation()}
		onmouseleave={() => onclose(false)}>
	<ul class="menu w-full">
		{#if entity_clipboard.has_value()}
			<li><button onclick={paste_before}>Paste before</button></li>
			<li><button onclick={paste_after}>Paste after</button></li>
		{/if}
		<li><button onclick={copy_entity}>Copy</button></li>
		<li><button onclick={cut_entity}>Move</button></li>
		<li><button onclick={delete_entity}>Delete</button></li>
	</ul>
</div>