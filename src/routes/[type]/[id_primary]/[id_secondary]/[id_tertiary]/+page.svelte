<script>
	import { SourceEntities } from '$lib'

	/** @type {Source} */
	export let data

	const reference = `${data.id_primary} ${data.id_secondary}:${data.id_tertiary}`
</script>

<div class="flex justify-center prose max-w-full">
	<h2>{reference}</h2>
</div>

<SourceEntities source_entities={data.parsed_semantic_encoding} />
