<script lang="ts">
	import Features from './Features.svelte'
	import OntologyResult from './OntologyResult.svelte'

	export let source_entity: SourceEntity
	const concept = source_entity.concept!	// will always be non-null at this point
</script>

<span class="inline-flex border-solid border-base-content px-1 py-2 text-lg tracking-normal">
	<table>
		<tr>
			<td>
				<OntologyResult data={concept} />
			</td>
			{#if source_entity.pairing_concept !== null}
				<td>/</td>
				<td><OntologyResult data={source_entity.pairing_concept} /></td>
			{/if}
		</tr>
		<tr>
			<td>
				<Features {source_entity} classes={'ps-2'} />
			</td>
		</tr>
	</table>
</span>
