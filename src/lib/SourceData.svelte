<script>
	import Icon from '@iconify/svelte'
	import { PUBLIC_SOURCES_API_HOST } from '$env/static/public'
	import SemanticEncoding from './SemanticEncoding.svelte'

	/** @type {Reference} */
	export let reference

	/**
	 * @param {Reference} reference
	 *
	 * @returns {Promise<SourceData>}
	 */
	async function get_source_data(reference) {
		const response = await fetch(get_sources_url(reference))

		return await response.json()
	}

	/**
	 * @param {Reference} reference
	 *
	 * @returns {string} fully-qualified URL to the sources API
	 */
	function get_sources_url({ source, book, chapter, verse }) {
		return `${PUBLIC_SOURCES_API_HOST}/${source}/${book}/${chapter}/${verse}`
	}
</script>

{#await get_source_data(reference)}
	<span class="loading loading-spinner text-warning" />
	getting the source data...
{:then source}
	<h4 class="flex justify-between">
		Phase 1 encoding

		<a href={get_sources_url(reference)} target="_blank" class="link link-accent link-hover text-sm flex items-end">
			all source details
			<Icon icon="fe:link-external" class="h-6 w-6" />
		</a>
	</h4>
	<p>
		{source.phase_1_encoding}
	</p>

	<SemanticEncoding semantic_encoding={source.semantic_encoding} />
{/await}
