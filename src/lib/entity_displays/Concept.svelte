<script lang="ts">
	import Features from './Features.svelte'
	import HoverPopup from './HoverPopup.svelte'
	import OntologyResult from './OntologyResult.svelte'

	export let source_entity: PageSourceEntity
	const concept = source_entity.concept!	// will always be non-null at this point
</script>

<div class="badge badge-lg rounded-full border-base-content badge-outline mx-1 py-5 text-md entity-{source_entity.category_abbr}">
	<HoverPopup>
		{#snippet button_content()}
			<span class="pe-2 my-4">
				{source_entity.category_abbr}
				{#if source_entity.category === 'Noun'}
					<sub class="-bottom-1.5 -left-1 italic">{source_entity.feature_codes[0]}</sub>
				{/if}
			</span>
		{/snippet}
		{#snippet dropdown_content()}
			<Features {source_entity} classes="text-base-content" />
		{/snippet}
	</HoverPopup>

	<div class="py-4">
		{#if source_entity.pairing_concept === null}
			<OntologyResult data={concept} />
		{:else}
			<div class="join">
				<OntologyResult data={concept} />
				<span class="px-1">{source_entity.pairing_type}</span>
				<OntologyResult data={source_entity.pairing_concept} />
			</div>
		{/if}
	</div>
</div>
