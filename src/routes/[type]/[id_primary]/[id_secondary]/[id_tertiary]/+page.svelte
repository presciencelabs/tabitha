<script>
	import { SourceEntities } from '$lib'

	/** @type {PageData} */
	export let data
	const { source, parsed_encoding, nav_data } = data
	
	/**
	 * @param {Reference} reference
	 */
	function create_reference_string({ id_primary, id_secondary, id_tertiary }) {
		return `${id_primary} ${id_secondary}:${id_tertiary}`
	}

	/**
	 * @param {Reference} reference
	 */
	function create_url({ type, id_primary, id_secondary, id_tertiary }) {
		return `/${type}/${id_primary}/${id_secondary}/${id_tertiary}`
	}
</script>

<div class="flex justify-center max-w-full pb-5 join">
	{#if nav_data.previous}
		<a class="btn btn-md join-item text-xl" href="{create_url(nav_data.previous)}" title="{create_reference_string(nav_data.previous)}" target="_self" >
			«
		</a>
	{/if}

	<!--'content-center' gets overwritten by 'prose', so use the element style to prioritize its effect-->
	<div class="join-item px-5 prose bg-base-200 border border-base-300" style="align-content: center">
		<h2>{create_reference_string(source)}</h2>
	</div>

	{#if nav_data.next}
		<a class="btn btn-md join-item text-xl" href="{create_url(nav_data.next)}" title="{create_reference_string(nav_data.next)}" target="_self">
			»
		</a>
	{/if}
</div>

{#if parsed_encoding.length > 0}
	<SourceEntities source_entities={parsed_encoding} />
{:else}
	<div class="flex justify-center prose max-w-full">
		<p>No source data yet for this verse.</p>
	</div>
{/if}
