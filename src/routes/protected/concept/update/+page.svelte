<script lang="ts">
	import Icon from '@iconify/svelte'
	import type { PageProps } from './$types'
	import { ConceptKey, Level } from '$lib'
	import { transform_categorization } from '$lib/transformers'
	import { Category } from '$lib/card/categorization'
	import { levels } from '$lib/lookups'

	let { data, form }: PageProps = $props()

	let concept_data = $state(data.concept_data)
	let initial_data = $state($state.snapshot(concept_data))
	let is_dirty = $derived(!deep_equal(concept_data, initial_data))
	let categories = $derived(transform_categorization(concept_data.part_of_speech, concept_data.categorization))

	function deep_equal(obj1: ConceptUpdateData, obj2: ConceptUpdateData): boolean {
		return JSON.stringify(obj1) === JSON.stringify(obj2)
	}

	function concept_key(): string {
		const { stem, sense, part_of_speech } = concept_data
		return `${stem}-${sense}-${part_of_speech}`
	}
</script>

{#if form?.success}
	<!-- this message is ephemeral; it exists because the page was rendered in
	       response to a form submission. it will vanish if the user reloads -->
	<div class="pb-6">
		<div role="alert" class="alert alert-success">
			<Icon icon="mdi:check-circle-outline" class="h-6 w-6" />
			<span class="font-semibold">Successfully updated!</span>
		</div>
	</div>
{/if}

<div class="prose">
	<ConceptKey concept={concept_data} />
</div>

<form method="POST" action="?/update&concept={encodeURIComponent(concept_key())}">
	<section class="py-4 flex flex-col gap-4">
		<div>
			<label class="pe-3">
				Level
				<select name="level" bind:value={concept_data.level} class="select w-20">
					{#each levels.keys() as level}
						<option value={level}>{level}</option>
					{/each}
				</select>
			</label>
			<Level level={concept_data.level} tooltip_dir={'tooltip-right'} />
		</div>
		<div>
			<label>
				Gloss
				<textarea name="gloss" bind:value={concept_data.gloss} class="textarea field-sizing-content w-1/2"></textarea>
			</label>
		</div>
	</section>

	<section class="py-4 flex flex-col gap-4">
		<div>
			<label>
				Brief gloss
				<input name="brief_gloss" bind:value={concept_data.brief_gloss} class="input" />
			</label>
		</div>
		<div>
			<label>
				Categorization
				<input name="categorization" bind:value={concept_data.categorization} class="input" />
			</label>
			<div class="mt-2 ms-4">
				<Category part_of_speech={concept_data.part_of_speech} {categories} />
			</div>
		</div>
		<div>
			<label>
				Curated examples
				<textarea name="curated_examples" bind:value={concept_data.curated_examples} class="textarea field-sizing-content w-full" rows="3"></textarea>
			</label>
		</div>
	</section>

	<button class="btn btn-primary" type="submit" disabled={!is_dirty}>Save</button>
	<a href="/?q={concept_data.stem}" class="btn">Cancel</a>
</form>
