<script lang="ts">
	import Punctuation from './Punctuation.svelte'

	let { source_entity }: { source_entity: PageSourceEntity } = $props()

	let bracket_entity = $derived({ ...source_entity, value: ']' })
</script>

<div class="inline-flex entity-{source_entity.boundary_category}">
	<Punctuation source_entity={bracket_entity} classes={source_entity.value === '}' ? 'text-7xl' : ''} />
</div>
