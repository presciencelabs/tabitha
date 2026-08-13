<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { SourceEntity } from '$lib/types'
	import { get_features_to_display } from './features_helpers'

	let {
		source_entity,
		classes = '',
		children,
	}: {
		source_entity: SourceEntity
		classes?: string
		children?: Snippet
	} = $props()

	let category = $derived(source_entity.category)
	let features = $derived(source_entity.features ?? [])

	let features_to_display = $derived(features.filter(get_features_to_display))
</script>

{#if features.length}
	<div class="dropdown dropdown-hover dropdown-bottom {classes}">
		<div class="dropdown-content text-sm text-nowrap shadow-xl rounded-box bg-info text-info-content tracking-normal">
			<ul class="list-none not-prose p-2">
				<li class="font-semibold">{category}</li>
				{#each features_to_display as feature}
					<li>
						<span class="font-semibold">{feature.name}</span> = {feature.value}
					</li>
				{/each}
			</ul>
		</div>
		<div role="button">
			{@render children?.()}
		</div>
	</div>
{/if}
