<script lang="ts">
	import Features from './Features.svelte'
	import OntologyResult from './OntologyResult.svelte'

	export let source_entity: SourceEntity
	const concept = source_entity.concept!	// will always be non-null at this point
</script>

<span class="inline-flex border-solid border-base-content px-1 py-2 text-lg tracking-normal">
	<table>
		<tbody>
			<tr>
				<td>
					{#if source_entity.pairing_concept === null}
						<OntologyResult data={concept} />
					{:else}
						<div class="join">
							<OntologyResult data={concept} classes={'join-item'} />
							<span class="badge border-base-content py-4 px-1.5 text-lg join-item">/</span>
							<OntologyResult data={source_entity.pairing_concept} classes={'join-item'}/>
						</div>
					{/if}
				</td>
			</tr>
			<tr>
				<td>
					<Features {source_entity} classes={'ps-2'} />
				</td>
			</tr>
		</tbody>
	</table>
</span>
