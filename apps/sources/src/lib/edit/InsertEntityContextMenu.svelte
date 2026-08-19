<script lang="ts">
	import type { FeatureMap } from '@tabitha/types'
	import type { EntityContextMenuData } from '$lib/edit/types'
	import type { PageSourceEntity } from '$lib/types'
	import ConceptDialog from '$lib/ConceptDialog.svelte'
	import { entity_clipboard } from './clipboard.svelte'
	import { DEFAULTS } from './default_entities'
	import { page } from '$app/state'
	import { fill_in_features } from '$lib/encoding/features'

	interface Props {
		source_entities: PageSourceEntity[]
		data: EntityContextMenuData
		onclose: (recalculate: boolean, id_to_select?: number) => void
	}
	let { source_entities = $bindable(), data, onclose }: Props = $props()

	let submenu = $state<string | null>(null)

	let parent_category = $derived.by(() => {
		const entity = source_entities[data.entity_id]
		if (!entity || entity.parent_id === -1) {
			return null
		}
		return source_entities[entity.parent_id]?.category || null
	})

	function insert_entities(entities: PageSourceEntity[]) {
		const new_entities = entities.map(entity => ({
			...entity,
			...fill_in_features(entity, page.data.features as FeatureMap),
		}))
		
		source_entities.splice(data.entity_id, 0, ...new_entities)
		onclose(true, data.entity_id)
	}

	function insert_entity(entity: PageSourceEntity) {
		insert_entities([entity])
	}

	function insert_clause(clause: PageSourceEntity) {
		insert_entities([
			clause,
			...clause.value === '{' ? [DEFAULTS.PERIOD] : [],
			boundary_end(clause),
		])
	}

	function insert_phrase(phrase: PageSourceEntity, concept: PageSourceEntity) {
		insert_entities([
			phrase,
			...concept?.concept?.stem ? [concept] : [],
			boundary_end(phrase),
		])
	}

	function boundary_end(boundary_start: PageSourceEntity): PageSourceEntity {
		const end_map: Record<string, string> = {
			'{': '}',
			'[': ']',
			'(': ')',
		}
		return {
			...DEFAULTS.EMPTY,
			value: end_map[boundary_start.value] || ')',
			boundary_category: boundary_start.boundary_category,
		}
	}

	function paste_entities() {
		const new_entities = entity_clipboard.paste()
		if (new_entities !== null) {
			source_entities.splice(data.entity_id, 0, ...new_entities)
			onclose(true, data.entity_id)
		} else {
			onclose(false)
		}
	}
	
	let dialog_open = $state(false)
	let new_concept_entity = $state<PageSourceEntity | null>(null)
	let new_phrase_entity = $state<PageSourceEntity | null>(null)

	function open_concept_dialog(concept: PageSourceEntity, phrase?: PageSourceEntity) {
		new_concept_entity = concept
		new_phrase_entity = phrase || null
		dialog_open = true
	}
	function close_concept_dialog() {
		dialog_open = false

		if (new_phrase_entity && new_concept_entity) {
			insert_phrase(new_phrase_entity, new_concept_entity)
		} else if (new_concept_entity?.concept?.stem) {
			insert_entity(new_concept_entity)
		} else {
			onclose(false)
		}
	}

	type MenuItem = {
		label: string
		action: () => void
		condition: boolean
	}
	let menu_data: [string, MenuItem[]][] = $derived([
		['Clause', [
			{
				label: 'Main Clause',
				action: () => insert_clause(DEFAULTS.CLAUSE_MAIN),
				condition: !parent_category,
			},
			{
				label: 'Adverbial Clause',
				action: () => insert_clause(DEFAULTS.CLAUSE_ADVERBIAL),
				condition: parent_category === 'Clause',
			},
			{
				label: 'Patient (Object Complement)',
				action: () => insert_clause(DEFAULTS.CLAUSE_PATIENT),
				condition: parent_category === 'Clause',
			},
			{
				label: 'Agent (Subject Complement)',
				action: () => insert_clause(DEFAULTS.CLAUSE_AGENT),
				condition: parent_category === 'Clause',
			},
			{
				label: 'Closing Quotation Frame',
				action: () => insert_clause(DEFAULTS.CLAUSE_CLOSE_QUOTE),
				condition: parent_category === 'Clause',
			},
			{
				label: 'Relative Clause',
				action: () => insert_clause(DEFAULTS.CLAUSE_RELATIVE),
				condition: parent_category === 'Noun Phrase',
			},
			{
				label: 'Adjectival Complement',
				action: () => insert_clause(DEFAULTS.CLAUSE_ADJ_PATIENT),
				condition: parent_category === 'Adjective Phrase',
			},
		]],
		['Phrase', [
			{
				label: 'Noun Phrase',
				action: () => open_concept_dialog(DEFAULTS.NOUN, DEFAULTS.NOUN_PHRASE),
				condition: !!parent_category && parent_category !== 'Verb Phrase',
			},
			{
				label: 'Verb Phrase',
				action: () => open_concept_dialog(DEFAULTS.VERB, DEFAULTS.VERB_PHRASE),
				condition: parent_category === 'Clause',
			},
			{
				label: 'Adjective Phrase',
				action: () => open_concept_dialog(DEFAULTS.ADJECTIVE, DEFAULTS.ADJECTIVE_PHRASE_PREDICATIVE),
				condition: parent_category === 'Clause',
			},
			{
				label: 'Adjective Phrase',
				action: () => open_concept_dialog(DEFAULTS.ADJECTIVE, DEFAULTS.ADJECTIVE_PHRASE),
				condition: !!parent_category && parent_category !== 'Clause' && parent_category !== 'Verb Phrase',
			},
			{
				label: 'Adverb Phrase',
				action: () => open_concept_dialog(DEFAULTS.ADVERB, DEFAULTS.ADVERB_PHRASE),
				condition: !!parent_category && parent_category !== 'Verb Phrase',
			},
		]],
		['Concept', [
			{
				label: 'Noun',
				action: () => open_concept_dialog(DEFAULTS.NOUN),
				condition: parent_category === 'Noun Phrase',
			},
			{
				label: 'Verb',
				action: () => open_concept_dialog(DEFAULTS.VERB),
				condition: parent_category === 'Verb Phrase',
			},
			{
				label: 'Adjective',
				action: () => open_concept_dialog(DEFAULTS.ADJECTIVE),
				condition: parent_category === 'Adjective Phrase',
			},
			{
				label: 'Adverb',
				action: () => open_concept_dialog(DEFAULTS.ADVERB),
				condition: parent_category === 'Adverb Phrase',
			},
			{
				label: 'Adposition',
				action: () => open_concept_dialog(DEFAULTS.ADPOSITION),
				condition: !!parent_category,
			},
			{
				label: 'Conjunction',
				action: () => open_concept_dialog(DEFAULTS.CONJUNCTION),
				condition: !!parent_category,
			},
			{
				label: 'Particle',
				action: () => open_concept_dialog(DEFAULTS.PARTICLE),
				condition: !!parent_category,
			},
			{
				label: 'Phrasal',
				action: () => open_concept_dialog(DEFAULTS.PHRASAL),
				condition: !!parent_category,
			},
		]],
		['Other', [
			{
				label: 'paragraph',
				action: () => insert_entity(DEFAULTS.PARAGRAPH),
				condition: !parent_category,
			},
			{
				label: 'period',
				action: () => insert_entity(DEFAULTS.PERIOD),
				condition: parent_category === 'Clause',
			},
		]],
	])
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div onclick={e => e.stopPropagation()}
	onkeydown={e => e.stopPropagation()}
	onmouseleave={() => !dialog_open && onclose(false)}
	class="card shadow-lg bg-base-100 min-w-40" style="position: fixed; left: {data.x}px; top: {data.y}px; z-index: 60;"
>
	<ul class="menu w-full">
		{#if entity_clipboard.has_value()}
			<li>
				<button onclick={paste_entities} onmouseenter={() => submenu = null}>
					Paste
				</button>
			</li>
			<li></li>
		{/if}
		{#each menu_data as [menu_label, items]}
			{@const visible = items.some(item => item.condition)}
			{#if visible}
				<li>
					<div class="relative" onmouseenter={() => submenu = menu_label}>
						<button class="cursor-pointer">{menu_label}</button>
						{#if submenu === menu_label}
							<div class="card bg-base-100 min-w-50 ml-2 p-2 shadow absolute left-full top-0">
								<ul class="ml-0 pl-0 before:hidden">
									{#each items as { label, action, condition }}
										{#if condition}
											<li><button onclick={action}>{label}</button></li>
										{/if}
									{/each}
								</ul>
							</div>
						{/if}
					</div>
				</li>
			{/if}
		{/each}
	</ul>
</div>

{#if dialog_open && !!new_concept_entity?.concept}
	<ConceptDialog bind:concept={new_concept_entity.concept} onclose={close_concept_dialog} />
{/if}