<script>
	import Punctuation from './Punctuation.svelte'

	/** @type {SourceEntity} */
	export let source_entity

		// TODO change character and size based on boundary type
</script>

<Punctuation {source_entity} />
