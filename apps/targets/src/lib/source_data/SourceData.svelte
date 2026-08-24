<script lang="ts">
	import { PUBLIC_SOURCES_API_HOST } from '$env/static/public'
	import SourceEntities from './SourceEntities.svelte'
	import Icon from '@iconify/svelte'
	import type { SourceReference } from '$lib/types'
	import { fetch_source_data, get_sources_url } from './source_data_helpers'

	let { reference }: { reference: SourceReference } = $props()

	let sources_url = $derived(get_sources_url({ reference, sources_api_host: PUBLIC_SOURCES_API_HOST }))
	let source_data_promise = $derived(fetch_source_data({ reference, sources_api_host: PUBLIC_SOURCES_API_HOST }))
</script>

<h4 class="flex justify-between">
	Semantic encoding (Phase 2)

	<a href={sources_url} target="_blank" rel="noreferrer" class="link link-accent link-hover text-sm flex items-end">
		all source details
		<Icon icon="fe:link-external" class="h-6 w-6" />
	</a>
</h4>

{#await source_data_promise}
	<p>
		<span class="loading loading-spinner text-warning"></span>
		getting the source data...
	</p>
{:then source}
	<p>
		<SourceEntities source_entities={source.parsed_semantic_encoding} />
	</p>
{/await}