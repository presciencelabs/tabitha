<script lang="ts">
	import { onMount } from 'svelte'
	import { PUBLIC_SOURCES_API_HOST } from '$env/static/public'
	import { SourceEntities } from '$lib/examples'
	import Icon from '@iconify/svelte'
	import type { Reference, SourceConcept, SourceData } from '$lib/types'

	interface Props {
		reference: Reference
		selected_concept: SourceConcept
	}

	let { reference, selected_concept }: Props = $props()

	let loading = $state(true)
	let source = $state<SourceData | null>(null)

	async function get_source_data(ref: Reference): Promise<SourceData> {
		const response = await fetch(get_sources_url(ref))
		return await response.json()
	}

	function get_sources_url({ type, id_primary, id_secondary, id_tertiary }: Reference): string {
		return `${PUBLIC_SOURCES_API_HOST}/${type}/${id_primary}/${id_secondary}/${id_tertiary}`
	}

	onMount(async () => {
		try {
			source = await get_source_data(reference)
		} finally {
			loading = false
		}
	})
</script>

{#if loading}
	<p>
		<span class="loading loading-spinner text-warning"></span>
		getting the source data...
	</p>
{:else if source}
	<h4 class="flex justify-between">
		Phase 1 encoding (may be out of date)
	</h4>
	<p>
		{source.phase_1_encoding}
	</p>

	<h4 class="flex justify-between">
		Semantic encoding (Phase 2)

		<a href={get_sources_url(reference)} target="_blank" rel="noreferrer" class="link link-accent link-hover text-sm flex items-end">
			all source details
			<Icon icon="fe:link-external" class="h-6 w-6" />
		</a>
	</h4>

	{#if source.status !== 'Ready to Translate'}
		<div role="alert" class="alert alert-warning alert-soft">
			<Icon icon="mdi:alert-outline" class="h-6 w-6" />
			<span>Source data for this verse is still being reviewed, so this usage may not be accurate.</span>
		</div>
	{/if}

	<div class="my-2">
		<SourceEntities source_entities={source.parsed_semantic_encoding} {selected_concept} />
	</div>
{/if}
