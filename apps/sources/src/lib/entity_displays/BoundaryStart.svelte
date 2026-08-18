<script lang="ts">
	import Features from './Features.svelte'
	import HoverPopup from './HoverPopup.svelte'
	import Punctuation from './Punctuation.svelte'

	let { source_entity }: { source_entity: PageSourceEntity } = $props()

	let feature_code_display = $derived(source_entity.category === 'Noun Phrase' ? `-${source_entity.feature_codes[1]}` : '')

	let bracket_entity = $derived({ ...source_entity, value: '[' })
</script>

<div class="inline-flex items-center entity-{source_entity.boundary_category}">
	<Punctuation source_entity={bracket_entity} classes="pe-1 {source_entity.value === '{' ? 'text-7xl' : ''}" />
	<HoverPopup>
		{#snippet button_content()}
			<span class="font-semibold -ms-1">{source_entity.category_abbr}{feature_code_display}</span>
		{/snippet}
		{#snippet dropdown_content()}
			<Features {source_entity} />
		{/snippet}
	</HoverPopup>
</div>
