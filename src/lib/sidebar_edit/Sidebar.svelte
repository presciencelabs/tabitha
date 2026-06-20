<script lang="ts">
	import Icon from '@iconify/svelte'
	import SidebarDetail from '$lib/sidebar/SidebarDetail.svelte'
	import SidebarEntityDisplay from '$lib/sidebar/SidebarEntityDisplay.svelte'
	import ConceptDetails from '$lib/sidebar/ConceptDetails.svelte'
	import AllSenseDetails from '$lib/sidebar_edit/AllSenseDetails.svelte'
	import FeaturesDetails from '$lib/sidebar_edit/FeaturesDetails.svelte'
	import NounListDetails from '$lib/sidebar_edit/NounListDetails.svelte'

	interface Props {
		selected_entity: PageSourceEntity|null
		is_open: boolean
		close_sidebar: () => void
		noun_list: NounListEntry[]
		all_features: FeatureMap
	}
	let { selected_entity = $bindable(), is_open, close_sidebar, noun_list, all_features }: Props = $props()
</script>

<div
	class="fixed top-0 right-0 h-full w-100 bg-base-100 border-l border-base-300 shadow-xl transform transition-transform duration-300 flex flex-col"
	style="transform: translateX({is_open ? '0' : '100%'})"
	>
	<button class="btn btn-circle btn-ghost btn-sm absolute right-3 top-5" onclick={close_sidebar} >
		<Icon icon="material-symbols:close" class="h-4 w-4" />
	</button>

	{#if selected_entity}
		<div class="p-4 flex-1 overflow-auto">
			<h3 class="text-2xl font-bold">Constituent Inspector</h3>

			<!--Entity Display-->
			<section class="my-5">
				<SidebarEntityDisplay selected_entity={selected_entity} />
			</section>

			<section>
				<!--Ontology Details (if present)-->
				{#if selected_entity.concept !== null}
					<SidebarDetail summary_title="Concept Details">
						{#snippet details_content()}
							<ConceptDetails data={selected_entity!.concept!} />
						{/snippet}
					</SidebarDetail>
					<SidebarDetail summary_title="All Senses">
						{#snippet details_content()}
							<AllSenseDetails bind:data={selected_entity!.concept!} />
						{/snippet}
					</SidebarDetail>
				{/if}

				<!--Ontology Details for Pairing (if present)-->
				{#if selected_entity.pairing_concept !== null}
					<SidebarDetail summary_title="Concept Details - Pairing">
						{#snippet details_content()}
							<ConceptDetails data={selected_entity!.pairing_concept!} />
						{/snippet}
					</SidebarDetail>
					<SidebarDetail summary_title="All Senses - Pairing">
						{#snippet details_content()}
							<AllSenseDetails bind:data={selected_entity!.pairing_concept!} />
						{/snippet}
					</SidebarDetail>
				{/if}

				<!--Noun List Index-->
				{#if selected_entity.category === 'Noun'}
					<SidebarDetail summary_title="Noun List Index">
						{#snippet details_content()}
							<NounListDetails bind:data={selected_entity!} {noun_list} />
						{/snippet}
					</SidebarDetail>
				{/if}

				<!--Features-->
				{#if selected_entity.features.length > 0}
					<SidebarDetail summary_title="Features" start_open={true}>
						{#snippet details_content()}
							<FeaturesDetails bind:data={selected_entity!} {all_features}/>
						{/snippet}
					</SidebarDetail>
				{/if}
			</section>
		</div>
	{:else}
		<div>
			<p>No item selected.</p>
		</div>
	{/if}
	
</div>