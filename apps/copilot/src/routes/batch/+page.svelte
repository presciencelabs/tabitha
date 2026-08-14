<script lang="ts">
	import { persisted } from '$lib/store.svelte'
	import BookSelect from '$lib/BookSelect.svelte'
	import Settings from '$lib/Settings.svelte'
	import { default_settings, fetch_verses_for_chapter, lwc_info, mtt_level_info, usfm_book_codes } from '$lib/lookups'

	let reference = $state(persisted<ChapterReference>('saved_verse', {
		book: 'Genesis',
		chapter: 1,
	}).value)
	let start_verse = $state(1)
	let end_verse = $state(0)

	let settings = $state(persisted<CopilotSettings>('saved_settings@1.5', default_settings).value)

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
			const params = JSON.stringify(settings)
			const response = await fetch(`/${book}/${chapter}?v0=${start_verse}&v1=${end_verse}&settings=${encodeURIComponent(params)}`)

			if (!response.ok || !response.body) {
				const message = await response.text() || 'Unexpected error occurred'
				throw new Error(message)
			}

			const reader = response.body.getReader()
			const decoder = new TextDecoder()
			let sfm_text = ''

			while (true) {
				const { done, value } = await reader.read()
				if (done) break

				const chunk_text = decoder.decode(value, { stream: true })
				sfm_text += chunk_text

				const matches = chunk_text.match(/\\v\s+\d+/g)
				if (matches) {
					completed_verses += matches.length
				}
			}

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
		<input bind:value={reference.chapter} class="input w-20" type="number" disabled={fetching_cautions} />

		{#if !verse_count}
			<div class="prose mt-1">
				Invalid chapter
			</div>
		{:else}
			<div class="divider divider-horizontal"></div>
			<div class="flex gap-4">
				<div class="prose"><h3>Verses</h3></div>
				<input bind:value={start_verse} class="input w-20" type="number" disabled={fetching_cautions} />
				<div class="mt-1">to</div>
				<input bind:value={end_verse} class="input w-20" type="number" disabled={fetching_cautions} />
				<div class="mt-1">({verse_count} verses in chapter)</div>
			</div>
		{/if}
	</section>

	<Settings bind:settings={settings} />

	<button type="button" class="btn btn-md my-4" onclick={download_cautions} disabled={fetching_cautions || fetching_verse_count}>
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

