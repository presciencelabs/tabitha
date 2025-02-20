<script>
	import { PUBLIC_SOURCES_API_HOST } from '$env/static/public'
	import { SourceEntities } from '$lib/examples'
	import Icon from '@iconify/svelte'

	/** @type {Reference} */
	export let reference

	/** @type {SourceConcept}*/
	export let selected_concept

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
	function get_sources_url({ type, id_primary, id_secondary, id_tertiary }) {
		return `${PUBLIC_SOURCES_API_HOST}/${type}/${id_primary}/${id_secondary}/${id_tertiary}`
	}
</script>

{#await get_source_data(reference)}
	<p>
		<span class="loading loading-spinner text-warning"></span>
		getting the source data...
	</p>
{:then source}
	<h4 class="flex justify-between">
		Phase 1 encoding (may be out of date)
	</h4>
	<p>
		{source.phase_1_encoding}
	</p>

	<h4 class="flex justify-between">
		Semantic encoding (Phase 2)

		<a href={get_sources_url(reference)} target="_blank" class="link link-accent link-hover text-sm flex items-end">
			all source details
			<Icon icon="fe:link-external" class="h-6 w-6" />
		</a>
	</h4>
	<p>
		<SourceEntities source_entities={source.parsed_semantic_encoding} {selected_concept} />
	</p>
{/await}
