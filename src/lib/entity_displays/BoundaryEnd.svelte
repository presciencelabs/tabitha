<script>
	import Punctuation from './Punctuation.svelte'

	/** @type {PageSourceEntity} */
	export let source_entity

	const bracket_entity = { ...source_entity, value: ']' }
</script>

<div class="inline-flex entity-{source_entity.boundary_category}">
	<Punctuation source_entity={bracket_entity} classes={source_entity.value === '}' ? 'text-7xl' : ''} />
</div>
