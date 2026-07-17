<script lang="ts">
	import { persisted } from '$lib/store.svelte'
	import BookSelect from '$lib/BookSelect.svelte'
	import Settings from '$lib/Settings.svelte'
	import { default_settings, fetch_verses_for_chapter, lwc_info, mtt_level_info } from '$lib/lookups'

	let reference = $state(persisted<Reference>('saved_verse', {
		book: 'Genesis',
		chapter: 1,
		verse: 1,
	}).value)

	let settings = $state(persisted<CopilotSettings>('saved_settings@1.5', default_settings).value)

	let fetching_verse_count = $state(false)
	let verse_count: number|undefined = $state(-1)

	let fetching_cautions = $state(false)
	let error_text = $state('')

	$effect(() => {
		fetching_verse_count = true
		fetch_verses_for_chapter(reference.book, reference.chapter)
			.then(result => {
				verse_count = result
			})
			.finally(() => {
				fetching_verse_count = false
			})
	})
	
	async function download_cautions() {
		fetching_cautions = true
		error_text = ''
		try {
			const { book, chapter } = reference
			const params = JSON.stringify(settings)
			const response = await fetch(`/${book}/${chapter}?settings=${encodeURIComponent(params)}`)

			if (!response.ok) {
				const message = (await response.json())?.message as string || 'Unexpected error occurred'
				throw new Error(message)
			}

			// Create blob from response
			const blob = await response.blob()
			
			// Create link and trigger download
			const url = window.URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = `${book} ${chapter} - TBTA Copilot Notes ${lwc_info[settings.lwc].code} ${mtt_level_info[settings.mtt_level].code}.sfm` // File name
			document.body.appendChild(a)
			a.click()
			
			// Cleanup
			window.URL.revokeObjectURL(url)
			a.remove()
		} catch (error: any) {
			error_text = 'Download failed: ' + error.message
			console.error(error)
		} finally {
			fetching_cautions = false
		}
	}
</script>

<form>
	<section class="py-4 flex gap-4 prose">
		<h3>Chapter</h3>
		<BookSelect bind:book={reference.book} disabled={fetching_cautions} />
		<input bind:value={reference.chapter} class="input w-20" type="number" disabled={fetching_cautions} />

		<div class="mt-1">
			{#if !verse_count}
				Invalid chapter
			{:else if verse_count > 0}
				{verse_count} verses
			{/if}
		</div>
	</section>

	<Settings bind:settings={settings} />

	<button type="button" class="btn btn-md my-4" onclick={download_cautions} disabled={fetching_cautions || fetching_verse_count}>
		Get notes
	</button>
</form>

{#if fetching_cautions}
	<p>Loading notes for {verse_count} verses... This may take a while.</p>
{:else if error_text.length}
	<p>{error_text}</p>
{/if}
