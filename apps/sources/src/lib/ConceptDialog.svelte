<script lang="ts">
	import { fetch_all_concepts_for_part_of_speech } from '$lib/data/api_lookups'
	import Icon from '@iconify/svelte'
	import { onMount } from 'svelte'

	let { concept = $bindable(), onclose }: { concept: SourceConcept, onclose: () => void } = $props()

	let dialog: HTMLDialogElement
	let concept_list: OntologyResult[] = $state([])

	onMount(() => {
		dialog.showModal()
		
		fetch_all_concepts_for_part_of_speech(concept.part_of_speech).then(fetched_concepts => {
			concept_list = fetched_concepts
		})
	})

	let selected_index = $state(-1)
	let is_selected = $derived(selected_index > -1)

	function set_concept() {
		const selected_concept = concept_list[selected_index]
		const { stem, sense, part_of_speech } = selected_concept
		concept = {
			stem,
			sense,
			part_of_speech,
			ontology_data: selected_concept,
		}

		dialog.close()
	}

</script>

<!-- https://daisyui.com/components/modal -->
<dialog bind:this={dialog} {onclose} class="modal">
	<section class="modal-box max-w-none w-3/4">
		<form method="dialog">
			<button class="btn btn-circle btn-ghost btn-sm absolute right-2 top-2">
				<Icon icon="material-symbols:close" class="h-4 w-4" />
			</button>
		</form>

		<article class="card">
			<main class="card-body">
				<section class="prose card-title max-w-none justify-between">
					<h2>Select a {concept.part_of_speech}</h2>
				</section>

				<section class="prose max-w-none">
					<select class="select w-full" bind:value={selected_index}>
						{#each concept_list as { stem, sense, gloss }, i}
							<option value={i}>
								{stem}-{sense} - {gloss}
							</option>
						{/each}
					</select>
				</section>

				<section class="card-actions mt-4 justify-end">
					<button onclick={set_concept} class="btn btn-primary btn-md" disabled={!is_selected}>
						SELECT
					</button>
					<form method="dialog">
						<button class="btn btn-secondary btn-md">
							CANCEL
						</button>
					</form>
				</section>
			</main>
		</article>
	</section>

	<form method="dialog" class="modal-backdrop">
		<button>Close</button>
	</form>
</dialog>