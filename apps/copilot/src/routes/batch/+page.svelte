<script lang="ts">
	import { persisted } from '$lib/store.svelte'
	import BookSelect from '$lib/BookSelect.svelte'
	import Settings from '$lib/Settings.svelte'
	import { default_settings, fetch_batch_cautions, fetch_verses_for_chapter, lwc_info, mtt_level_info, usfm_book_codes } from '$lib/lookups'

	let reference = $state(persisted<ChapterReference>({ key: 'saved_verse', defaultValue: {
		book: 'Genesis',
		chapter: 1,
	} }).value)
	let start_verse = $state(1)
	let end_verse = $state(0)

	let settings = $state(persisted<CopilotSettings>({ key: 'saved_settings@1.5', defaultValue: default_settings }).value)

	let fetching_verse_count = $state(false)
	let verse_count: number|undefined = $state(-1)

	let fetching_cautions = $state(false)
	let completed_verses = $state(0)
	let error_text = $state('')

	$effect(() => {
		fetching_verse_count = true
		fetch_verses_for_chapter(reference)
			.then(result => {
				verse_count = result
				end_verse = verse_count || start_verse
			})
			.finally(() => {
				fetching_verse_count = false
			})
	})
	
	async function download_cautions() {
		fetching_cautions = true
		completed_verses = 0
		error_text = ''
		try {
			const { book, chapter } = reference
			const book_code = usfm_book_codes[book] || book

			const sfm_text = await fetch_batch_cautions({
				reference,
				start_verse,
				end_verse,
				settings,
				on_progress: completed_delta => completed_verses += completed_delta,
			})

			// Create blob from response
			const blob = new Blob([sfm_text], { type: 'text/plain;charset=utf-8' })
			
			// Create link and trigger download
			const url = window.URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			const ref_string = `${book_code} ${chapter} ${start_verse}-${end_verse}`
			const setting_codes = `${lwc_info[settings.lwc].code} ${mtt_level_info[settings.mtt_level].code}`
			a.download = `${ref_string} - TaBiThA ${settings.mode} notes - ${setting_codes}.sfm` // File name
			document.body.appendChild(a)
			a.click()
			
			// Cleanup
			window.URL.revokeObjectURL(url)
			a.remove()
		} catch (error) {
			error_text = 'Download failed: ' + (error instanceof Error ? error.message : String(error))
			console.error(error)
		} finally {
			fetching_cautions = false
		}
	}
</script>

<form>
	<section class="py-4 flex gap-4">
		<div class="prose"><h3>Chapter</h3></div>
		
		<BookSelect bind:book={reference.book} disabled={fetching_cautions} />
		<input type="number" bind:value={reference.chapter} disabled={fetching_cautions} class="input w-20" />

		{#if !verse_count}
			<div class="prose mt-1">
				Invalid chapter
			</div>
		{:else}
			<div class="divider divider-horizontal"></div>
			<div class="flex gap-4">
				<div class="prose"><h3>Verses</h3></div>
				<input type="number" bind:value={start_verse} disabled={fetching_cautions} class="input w-20" />
				<div class="mt-1">to</div>
				<input type="number" bind:value={end_verse} disabled={fetching_cautions} class="input w-20" />
				<div class="mt-1">({verse_count} verses in chapter)</div>
			</div>
		{/if}
	</section>

	<Settings bind:settings={settings} />

	<button type="button" onclick={download_cautions} disabled={fetching_cautions || fetching_verse_count} class="btn btn-md my-4">
		Get notes
	</button>
</form>

{#if fetching_cautions}
	{@const mode_label = settings.mode === 'brief' ? 'brief' : 'notes'}
	<p>
		{#if completed_verses && completed_verses > 0}
			Loading {mode_label}: {completed_verses} / {verse_count} verses completed...
		{:else}
			Loading {mode_label}... This may take a while.
		{/if}
	</p>
{:else if error_text.length}
	<p>{error_text}</p>
{/if}

