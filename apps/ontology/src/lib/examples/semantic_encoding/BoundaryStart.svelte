<script lang="ts">
	import Features from './Features.svelte'
	import type { SourceEntity } from '$lib/types'

	interface Props {
		source_entity: SourceEntity
	}

	let { source_entity }: Props = $props()

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
			<!-- For Noun Phrases, show the Semantic Role. For everything else, show no codes -->
			{#if source_entity.category === 'Noun Phrase'}
				{source_entity.category_abbr}-{source_entity.feature_codes[1]}
			{:else}
				{source_entity.category_abbr}
			{/if}
		</span>
	</Features>
</span>
