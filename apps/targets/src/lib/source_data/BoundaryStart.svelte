<script lang="ts">
	import Features from './Features.svelte'
	import type { SourceEntity } from '@tabitha/types'

	let { source_entity }: { source_entity: SourceEntity } = $props()

	// clause boundaries read bigger than phrase ones, so the nesting depth is visible at a glance
	const boundary_size_map: Record<string, string> = {
		'{': 'text-2xl',
		'[': 'text-xl',
		'(': 'text-xl',
	}
</script>

<span class="inline-flex pe-1 tracking-widest">
	<span class="{boundary_size_map[source_entity.value] || 'text-xl'} font-thin">
		{'['}
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
