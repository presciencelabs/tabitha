<script>
	import Features from './Features.svelte'

	/** @type {SourceEntity} */
	export let source_entity
</script>

<span class="inline-flex pe-1 tracking-widest">
	<span class="text-lg font-thin">
		{source_entity.value}
	</span>
	<Features {source_entity} classes={'self-center'}>
		<span class="text-sm tracking-tight">
			<!-- For Noun Phrases, show the Semantic Role. For everything else, show no codes -->
			{#if source_entity.category === 'Noun Phrase'}
				{source_entity.category_abbr}-{source_entity.feature_codes[1]}
			{:else}
				{source_entity.category_abbr}
			{/if}
		</span>
	</Features>
</span>
