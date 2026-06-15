<script lang="ts">
	import Icon from '@iconify/svelte'
	import type { PageProps } from './$types'
	import { Category } from '$lib/card/categorization/edit'
	import { levels } from '$lib/lookups'
	import Header from '$lib/card/Header.svelte'

	let { data, form }: PageProps = $props()

	let concept_data = $state(data.concept_data)
	let initial_data = $state.snapshot(concept_data)
	let is_dirty = $derived(!deep_equal(concept_data, initial_data))
	let concept_for_header: Concept = $derived({ ...concept_data, categorization: '', curated_examples: [], curated_examples_raw: '', occurrences: 0, status: 'not used', how_to_hints: [], examples: '', id: '' })

	function deep_equal(obj1: ConceptUpdateData, obj2: ConceptUpdateData): boolean {
		return JSON.stringify(obj1) === JSON.stringify(obj2)
	}

	function concept_key(): string {
		const { stem, sense, part_of_speech } = concept_data
		return `${stem}-${sense}-${part_of_speech}`
	}
</script>

<article class="card bg-base-200 mx-auto w-[80%]">
	<main class="card-body">
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

		<section class="prose card-title max-w-none justify-between">
			<Header concept={concept_for_header} />
		</section>

		<form method="POST" action="?/update&concept={encodeURIComponent(concept_key())}">
			<section class="flex flex-col gap-4">
				<label>
					Level
					<br />
					<select name="level" bind:value={concept_data.level} class="select w-20">
						{#each levels.keys() as level}
							<option value={level}>{level}</option>
						{/each}
					</select>
				</label>

				<label>
					Gloss
					<textarea name="gloss" bind:value={concept_data.gloss} class="textarea field-sizing-content w-full"></textarea>
				</label>
			</section>

			<section class="py-4 flex flex-col gap-4">
				<label>
					Brief gloss
					<br />
					<input name="brief_gloss" bind:value={concept_data.brief_gloss} class="input" />
					<br />
					<span class="text-xs text-accent">optional - for stems with lots of senses</span>
				</label>

				<Category part_of_speech={concept_data.part_of_speech} bind:categories={concept_data.categories} />

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

	</main>
</article>
