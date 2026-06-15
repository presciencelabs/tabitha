<script lang="ts">
	import Icon from '@iconify/svelte'
	import type { PageProps } from './$types'
	import { Category } from '$lib/card/categorization/edit'
	import { levels, parts_of_speech } from '$lib/lookups'
	import Header from '$lib/card/Header.svelte'

	let { data }: PageProps = $props()

	let concept_data = $state(data.concept_data)
	let can_save = $derived(concept_data.stem && concept_data.sense && concept_data.part_of_speech)

	let debounced_stem_pos = $state({ stem: concept_data.stem, part_of_speech: concept_data.part_of_speech })
	let debouce_delay = 500
	let fetching_sense = $state(false)

	$effect(() => {
		// the timer prevents a fetch request from being sent on every keystroke
		debounced_stem_pos = { stem: concept_data.stem, part_of_speech: concept_data.part_of_speech }
		const timer = setTimeout(() => {
			const { stem, part_of_speech } = debounced_stem_pos
			if (stem && part_of_speech) {
				fetching_sense = true
				fetch(`/protected/concept/create/next-sense?stem=${stem}&part_of_speech=${part_of_speech}`).then(response => {
					response.json().then(data => {
						concept_data.sense = data.next_sense
					}).finally(() => {
						fetching_sense = false
					})
				}).finally(() => {
					fetching_sense = false
				})
			} else {
				fetching_sense = false
			}
		}, debouce_delay)

		return () => clearTimeout(timer)
	})
</script>

<article class="card bg-base-200 mx-auto w-[80%]">
	<main class="card-body">
		<div class="prose pb-4">
			<h2>Add a new concept</h2>
		</div>

		{#if concept_data.sense}
			{@const concept_for_header: Concept = { ...concept_data, categorization: '', curated_examples: [], curated_examples_raw: '', occurrences: 0, status: 'not used', how_to_hints: [], examples: '', id: '' }}
			<section class="prose card-title max-w-none justify-between">
				<Header concept={concept_for_header} />
			</section>
		{:else if fetching_sense}
			<div>
				<Icon icon="line-md:loading-twotone-loop" class="h-5 w-5 text-warning" />
			</div>
		{/if}

		<form method="POST" action="?/create">
			<section class="flex gap-4 w-full">
				<label>
					Stem
					<input name="stem" bind:value={concept_data.stem} class="input" required />
				</label>

				<label>
					Part of speech
					<select name="part_of_speech" bind:value={concept_data.part_of_speech} class="select" required>
						{#each parts_of_speech as pos}
							<option value={pos}>{pos}</option>
						{/each}
					</select>
				</label>

				<label>
					Level
					<br />
					<select name="level" bind:value={concept_data.level} class="select w-20">
						{#each levels.keys() as level}
							<option value={level}>{level}</option>
						{/each}
					</select>
				</label>

				{#if concept_data.sense && concept_data.sense !== 'A'}
					<a href={`/?q=${concept_data.stem}&category=${concept_data.part_of_speech}`} target="_blank" class="link link-accent link-hover text-sm flex items-end">
						view other senses
						<Icon icon="fe:link-external" class="h-6 w-6" />
					</a>
				{/if}
			</section>

			<section class="py-4 flex flex-col gap-4">
				<div>
					<label>
						Gloss
						<textarea name="gloss" bind:value={concept_data.gloss} class="textarea field-sizing-content w-full"></textarea>
					</label>
				</div>
				<div>
					<label>
						Brief gloss
						<br />
						<input name="brief_gloss" bind:value={concept_data.brief_gloss} class="input" />
						<br />
						<span class="text-xs text-accent">optional - for stems with lots of senses</span>
					</label>
				</div>
			</section>

			<section class="py-4 flex flex-col gap-4">
				<Category part_of_speech={concept_data.part_of_speech} bind:categories={concept_data.categories} />
			</section>

			<button class="btn btn-primary" type="submit" disabled={!can_save}>Save</button>
			<!--TODO return_to-->
			<a href="/" class="btn">Cancel</a>
		</form>

	</main>
</article>
