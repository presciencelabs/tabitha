<script lang="ts">
	import Icon from '@iconify/svelte'
	import type { PageProps } from './$types'
	import { Level } from '$lib'
	import { transform_categorization } from '$lib/transformers'
	import { Category } from '$lib/card/categorization'
	import { levels, parts_of_speech } from '$lib/lookups'

	let { data }: PageProps = $props()

	let concept_data = $state(data.concept_data)
	let can_save = $derived(concept_data.stem && concept_data.sense && concept_data.part_of_speech)
	let categories = $derived(transform_categorization(concept_data.part_of_speech, concept_data.categorization))

	let debounced_stem_pos = $state({ stem: concept_data.stem, part_of_speech: concept_data.part_of_speech })
	let debouce_delay = 500
	let fetching_sense = $state(false)

	$effect(() => {
		// the timer prevents a fetch request from being sent on every keystroke
		debounced_stem_pos = { stem: concept_data.stem, part_of_speech: concept_data.part_of_speech }
		fetching_sense = true
		const timer = setTimeout(() => {
			const { stem, part_of_speech } = debounced_stem_pos
			if (stem && part_of_speech) {
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

<form method="POST" action="?/create">
	<section class="py-4 flex flex-col gap-4">
		<div>
			<label>
				Stem
				<input name="stem" bind:value={concept_data.stem} class="input" required />
			</label>
		</div>

		<div>
			<label>
				Part of speech
				<select name="part_of_speech" bind:value={concept_data.part_of_speech} class="select" required>
					{#each parts_of_speech as pos}
						<option value={pos}>{pos}</option>
					{/each}
				</select>
			</label>
		</div>

		<div class="flex items-center">
			<label>
				Sense
				<input name="sense" bind:value={concept_data.sense} class="input w-15" readonly />
			</label>
			{#if fetching_sense}
				<div class="">
					<Icon icon="line-md:loading-twotone-loop" class="h-5 w-5 text-warning" />
				</div>
			{/if}
		</div>
	</section>

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

	<button class="btn btn-primary" type="submit" disabled={!can_save}>Save</button>
	<!--TODO return_to-->
	<a href="/" class="btn">Cancel</a>
</form>
