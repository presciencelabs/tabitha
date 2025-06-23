<script>
	import Features from './Features.svelte'
	import Punctuation from './Punctuation.svelte'

	/** @type {SourceEntity} */
	export let source_entity

		// TODO change character and size based on boundary type
</script>

<span class="inline-flex border-solid border-base-content pe-1 py-2 text-lg tracking-widest">
	<Punctuation {source_entity} />
	<Features {source_entity} classes={'self-center'} />
</span>
