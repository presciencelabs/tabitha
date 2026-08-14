<script lang="ts">
	import Features from './Features.svelte'
	import type { SourceEntity } from '$lib/types'

	let { source_entity }: { source_entity: SourceEntity } = $props()
</script>

<span class="inline-flex pe-1 tracking-widest">
	<span class="text-lg font-thin">
		{source_entity.value}
	</span>
	<Features {source_entity} classes={'self-center'}>
		<span class="text-sm tracking-tight">
			{#if source_entity.category === 'Noun Phrase'}
				{@const semantic_role = source_entity.feature_codes[1]}
				{source_entity.category_abbr}-{semantic_role}
			{:else}
				{source_entity.category_abbr}
			{/if}
		</span>
	</Features>
</span>
