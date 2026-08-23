<script lang="ts">
	import Icon from '@iconify/svelte'
	import type { PageProps } from './$types'
	import type { PartOfSpeech } from '$lib/types'
	import { Category } from '$lib/card/categorization/edit'
	import { default_categories, levels, parts_of_speech } from '$lib/lookups'
	import { create_fallback_concept } from '$lib/transformers'
	import Header from '$lib/card/Header.svelte'
	import { Toast } from '@tabitha/ui'

	let { data }: PageProps = $props()

	// svelte-ignore state_referenced_locally
	let concept_data = $state(data.concept_data)
	let can_save = $derived(concept_data.stem && concept_data.sense && concept_data.part_of_speech)

	let debounced_stem_pos = $state({ stem: concept_data.stem, part_of_speech: concept_data.part_of_speech })
	let debounce_delay = 500
	let fetching_sense = $state(false)

	let saving = $state(false)
	let error_message = $state('')
	let save_result: 'applied' | 'pending' | null = $state(null)
	let toast_timeout: ReturnType<typeof setTimeout> | undefined

	function dismiss_toast() {
		clearTimeout(toast_timeout)
		error_message = ''
		save_result = null
	}

	async function handle_submit(event: SubmitEvent) {
		event.preventDefault()
		saving = true
		dismiss_toast()

		try {
			const res = await fetch('create/submit', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(concept_data),
			})

			if (!res.ok) {
				const body = await res.json().catch(() => ({}))
				error_message = body.message || 'Failed to create the concept.'
				return
			}

			const { applied } = await res.json()
			save_result = applied ? 'applied' : 'pending'

			if (applied) {
				// success is good news and doesn't need to linger; pending/error stay until dismissed, since they carry more to act on
				toast_timeout = setTimeout(dismiss_toast, 4000)
			}
		} catch (err: unknown) {
			error_message = err instanceof Error ? err.message : 'Failed to create the concept.'
		} finally {
			saving = false
		}
	}

	$effect(() => {
		concept_data.categories = default_categories[concept_data.part_of_speech as PartOfSpeech]?.slice() ?? []
	})

	$effect(() => {
		// the timer prevents a fetch request from being sent on every keystroke
		debounced_stem_pos = { stem: concept_data.stem, part_of_speech: concept_data.part_of_speech }
		fetching_sense = true

		const timer = setTimeout(() => {
			const { stem, part_of_speech } = debounced_stem_pos
			if (stem && part_of_speech) {
				fetch(`create/next-sense?stem=${stem}&part_of_speech=${part_of_speech}`).then(async res => {
					const { sense } = await res.json()
					concept_data.sense = sense
				}).catch(err => {
					console.error({
						err,
					})
				}).finally(() => {
					fetching_sense = false
				})
			} else {
				fetching_sense = false
			}
		}, debounce_delay)

		return () => clearTimeout(timer)
	})
</script>

{#if error_message}
	<Toast variant="error" on_dismiss={dismiss_toast}>{error_message}</Toast>
{:else if save_result === 'applied'}
	<Toast variant="success" on_dismiss={dismiss_toast}>Saved — your change is live now.</Toast>
{:else if save_result === 'pending'}
	<Toast variant="info" on_dismiss={dismiss_toast}>
		Saved — couldn't apply automatically, so it's pending in the <a href="/protected/changes" class="link">changes queue</a>.
	</Toast>
{/if}

<article class="card bg-base-200 mx-auto w-[80%]">
	<div class="card-body">
		<div class="prose pb-4">
			<h2>Add a new concept</h2>
		</div>

		{#if concept_data.sense}
			{@const concept_for_header = create_fallback_concept(concept_data)}
			<section class="card-title justify-between">
				<Header concept={concept_for_header} />
			</section>
		{:else if fetching_sense}
			<div>
				<Icon icon="line-md:loading-twotone-loop" class="h-5 w-5 text-warning" />
			</div>
		{/if}

		<form onsubmit={handle_submit} class="flex flex-col gap-6">
			<section class="flex flex-wrap gap-4 items-end">
				<fieldset class="fieldset">
					<legend class="fieldset-legend font-semibold">Stem</legend>
					<input name="stem" bind:value={concept_data.stem} class="input input-bordered" required />
				</fieldset>

				<fieldset class="fieldset">
					<legend class="fieldset-legend font-semibold">Part of speech</legend>
					<select name="part_of_speech" bind:value={concept_data.part_of_speech} class="select select-bordered" required>
						{#each parts_of_speech as pos}
							<option value={pos}>{pos}</option>
						{/each}
					</select>
				</fieldset>

				<input name="sense" type="hidden" bind:value={concept_data.sense} />

				<fieldset class="fieldset">
					<legend class="fieldset-legend font-semibold">Level</legend>
					<select name="level" bind:value={concept_data.level} class="select select-bordered w-24">
						{#each levels.keys() as level}
							<option value={level}>{level}</option>
						{/each}
					</select>
				</fieldset>

				{#if concept_data.sense && concept_data.sense !== 'A'}
					<a href={`/?q=${concept_data.stem}&category=${concept_data.part_of_speech}`} target="_blank" class="link link-accent link-hover text-sm flex items-center gap-1 pb-2">
						view other senses
						<Icon icon="fe:link-external" class="h-4 w-4" />
					</a>
				{/if}
			</section>

			<section class="flex flex-col gap-4">
				<fieldset class="fieldset">
					<legend class="fieldset-legend font-semibold">Gloss</legend>
					<textarea name="gloss" bind:value={concept_data.gloss} class="textarea textarea-bordered field-sizing-content w-full" rows="2"></textarea>
				</fieldset>

				<fieldset class="fieldset">
					<legend class="fieldset-legend font-semibold">Brief gloss</legend>
					<input name="brief_gloss" bind:value={concept_data.brief_gloss} class="input input-bordered w-full max-w-md" />
					<p class="label text-xs text-accent">optional - for stems with lots of senses</p>
				</fieldset>
			</section>

			<section>
				<Category part_of_speech={concept_data.part_of_speech} bind:categories={concept_data.categories} />
			</section>

			<div class="flex gap-2">
				<button type="submit" disabled={!can_save || saving} class="btn btn-primary">
					{#if saving}
						<span class="loading loading-spinner loading-xs"></span>
					{/if}
					Save
				</button>
				<a href="/" class="btn btn-ghost">Cancel</a>
			</div>
		</form>

	</div>
</article>
