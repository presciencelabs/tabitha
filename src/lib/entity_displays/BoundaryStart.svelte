<script>
	import Features from './Features.svelte'
	import HoverPopup from './HoverPopup.svelte'
	import Punctuation from './Punctuation.svelte'

	/** @type {PageSourceEntity} */
	export let source_entity

	const feature_codes_to_display = get_feature_codes_to_display()
	const feature_code_display = feature_codes_to_display.length ? '-' + feature_codes_to_display.join('') : ''

	function get_feature_codes_to_display() {
		if (source_entity.category === 'Noun Phrase') {
			return [source_entity.feature_codes[1]]
		}
		return []
	}

	const bracket_entity = { ...source_entity, value: '[' }
</script>

<div class="inline-flex items-center pe-2 entity-{source_entity.boundary_category}">
	<Punctuation source_entity={bracket_entity} classes={source_entity.value === '{' ? 'text-7xl' : ''} />
	<HoverPopup>
		{#snippet button_content()}
			<span class="font-semibold -ms-1">{source_entity.category_abbr}{feature_code_display}</span>
		{/snippet}
		{#snippet dropdown_content()}
			<Features {source_entity} />
		{/snippet}
	</HoverPopup>
</div>
