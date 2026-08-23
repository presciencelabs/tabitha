<script lang="ts">
	import type { PageProps } from './$types'
	import { Category } from '$lib/card/categorization/edit'
	import { levels } from '$lib/lookups'
	import { create_fallback_concept } from '$lib/transformers'
	import Header from '$lib/card/Header.svelte'
	import { Toast } from '@tabitha/ui'
	import type { Concept } from '$lib/types'
	import type { ConceptUpdateData } from '$lib/server/types'

	let { data }: PageProps = $props()

	// svelte-ignore state_referenced_locally
	let concept_data = $state(data.concept_data)
	let initial_data = $state.snapshot(concept_data)
	let is_dirty = $derived(!deep_equal(concept_data, initial_data))
	let concept_for_header: Concept = $derived(create_fallback_concept(concept_data))

	let saving = $state(false)
	let error_message = $state('')
	let save_result: 'applied' | 'pending' | null = $state(null)
	let toast_timeout: ReturnType<typeof setTimeout> | undefined

	function deep_equal(obj1: ConceptUpdateData, obj2: ConceptUpdateData): boolean {
		return JSON.stringify(obj1) === JSON.stringify(obj2)
	}

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
			const res = await fetch('update/submit', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(concept_data),
			})

			if (!res.ok) {
				const body = await res.json().catch(() => ({}))
				error_message = body.message || 'Failed to save the concept.'
				return
			}

			const { applied } = await res.json()
			save_result = applied ? 'applied' : 'pending'
			initial_data = $state.snapshot(concept_data)

			if (applied) {
				// success is good news and doesn't need to linger; pending/error stay until dismissed, since they carry more to act on
				toast_timeout = setTimeout(dismiss_toast, 4000)
			}
		} catch (err: unknown) {
			error_message = err instanceof Error ? err.message : 'Failed to save the concept.'
		} finally {
			saving = false
		}
	}
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
		<section class="card-title justify-between">
			<Header concept={concept_for_header} />
		</section>

		<form onsubmit={handle_submit} class="flex flex-col gap-6">
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
				<button type="submit" disabled={!is_dirty || saving} class="btn btn-primary">
					{#if saving}
						<span class="loading loading-spinner loading-xs"></span>
					{/if}
					Save
				</button>
				<a href="/?q={concept_data.stem}" class="btn btn-ghost">Cancel</a>
			</div>
		</form>

	</div>
</article>
