<script lang="ts">
	import type { PageProps } from './$types'
	import { Category } from '$lib/card/categorization/edit'
	import { levels } from '$lib/lookups'
	import Header from '$lib/card/Header.svelte'

	let { data }: PageProps = $props()

	// svelte-ignore state_referenced_locally
	let concept_data = $state(data.concept_data)
	let initial_data = $state.snapshot(concept_data)
	let is_dirty = $derived(!deep_equal(concept_data, initial_data))
	let concept_for_header: Concept = $derived({ ...concept_data, categorization: '', curated_examples: [], curated_examples_raw: '', occurrences: 0, status: 'not used', how_to_hints: [], pending_changes: [], examples: '', id: '' })

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
		<!--TODO show error from server (db, validation, or other)-->

		<section class="prose card-title max-w-none justify-between">
			<Header concept={concept_for_header} />
		</section>

		<form method="POST" action="?/update&concept={encodeURIComponent(concept_key())}" class="flex flex-col gap-6">
			<section class="flex flex-col gap-4">
				<fieldset class="fieldset">
					<legend class="fieldset-legend font-semibold">Level</legend>
					<select name="level" bind:value={concept_data.level} class="select select-bordered w-24">
						{#each levels.keys() as level}
							<option value={level}>{level}</option>
						{/each}
					</select>
				</fieldset>

				<fieldset class="fieldset">
					<legend class="fieldset-legend font-semibold">Gloss</legend>
					<textarea name="gloss" bind:value={concept_data.gloss} class="textarea textarea-bordered field-sizing-content w-full" rows="2"></textarea>
				</fieldset>
			</section>

			<section class="flex flex-col gap-4">
				<fieldset class="fieldset">
					<legend class="fieldset-legend font-semibold">Brief gloss</legend>
					<input name="brief_gloss" bind:value={concept_data.brief_gloss} class="input input-bordered w-full max-w-md" />
					<p class="label text-xs text-accent">optional - for stems with lots of senses</p>
				</fieldset>

				<Category part_of_speech={concept_data.part_of_speech} bind:categories={concept_data.categories} />

				<fieldset class="fieldset">
					<legend class="fieldset-legend font-semibold">Curated examples</legend>
					<textarea name="curated_examples" bind:value={concept_data.curated_examples} class="textarea textarea-bordered field-sizing-content w-full" rows="3"></textarea>
				</fieldset>
			</section>

			<div class="flex gap-2">
				<button class="btn btn-primary" type="submit" disabled={!is_dirty}>Save</button>
				<a href="/?q={concept_data.stem}" class="btn btn-ghost">Cancel</a>
			</div>
		</form>

	</main>
</article>
