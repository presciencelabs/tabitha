<script lang="ts">
	import { default_settings, fetch_target_text, lwc_info } from '$lib/lookups'
	import { persisted } from '$lib/store.svelte'
	import BookSelect from '$lib/BookSelect.svelte'
	import Settings from '$lib/Settings.svelte'

	let reference = $state(persisted<VerseReference>('saved_verse', {
		book: 'Genesis',
		chapter: 1,
		verse: 1,
	}).value)
	let submitted_reference: VerseReference = $state($state.snapshot(reference))

	let settings = $state(persisted<CopilotSettings>('saved_settings@1.5', default_settings).value)

	let fetching_english = $state(false)
	let english_text: TargetApiResult|undefined = $state(undefined)

	let fetching_notes = $state(false)
	let result: CopilotApiResult|null = $state(null)

	let error_text = $state('')

	async function get_english_text() {
		fetching_english = true
		english_text = await fetch_target_text(reference, 'English', 'Unchurched Adults')
		fetching_english = false
	}

	async function get_notes() {
		fetching_notes = true
		error_text = ''
		
		const { book, chapter, verse } = reference
		submitted_reference = { book, chapter, verse }
		const params = JSON.stringify(settings)
		const response = await fetch(`/${book}/${chapter}/${verse}?settings=${encodeURIComponent(params)}`)

		if (response.ok) {
			result = await response.json() as CopilotApiResult
			error_text = result.error || ''
		} else {
			error_text = (await response.json())?.message as string || 'Unexpected error occurred'
			console.error(error_text)
		}

		fetching_notes = false
	}
</script>

<form>
	<section class="py-4 flex gap-4 items-center">
		<h3 class="text-lg font-bold">Verse</h3>
		<BookSelect bind:book={reference.book} />
		<input type="number" bind:value={reference.chapter} class="input w-20" />
		<input type="number" bind:value={reference.verse} class="input w-20" />
		<button type="button" onclick={get_english_text} class="btn btn-md">
			Preview English
		</button>
	</section>

	{#if fetching_english}
		<div class="prose mb-5">
			<h4>English Preview</h4>
			<div>Loading...</div>
		</div>
	{:else if english_text}
		<div class="w-full mb-5">
			<div class="prose"><h4>English Preview</h4></div>
			<div>({english_text?.audience}) {english_text?.text || ''}</div>
		</div>
	{/if}
	
	<Settings bind:settings={settings} />

	<button type="button" onclick={get_notes} disabled={fetching_notes} class="btn btn-md my-4">
		Get notes
	</button>
</form>

{#if fetching_notes}
	<div class="prose"><h2>Notes for {submitted_reference.book} {submitted_reference.chapter}:{submitted_reference.verse}</h2></div>
	<p>Loading...</p>
{:else if error_text.length}
	<div class="prose"><h2>Notes for {submitted_reference.book} {submitted_reference.chapter}:{submitted_reference.verse}</h2></div>
	<div>{error_text}</div>
{:else if result}
	<div class="w-full pb-8">
		<div class="prose"><h2>Notes for {result.verse.book} {result.verse.chapter}:{result.verse.verse}</h2></div>

		{#if settings.lwc === 'English' || settings.show_english}
			<div class="mt-3">
				<div class="prose"><h4>English Text</h4></div>
				<p>{result.english_text}</p>
			</div>
		{/if}

		{#if result.lwc_text && settings.lwc !== 'English'}
			<div class="mt-3">
				<div class="prose"><h4>LWC Text ({settings.lwc})</h4></div>
				<p>{result.lwc_text}</p>
			</div>
		{/if}

		<div class="mt-3">
			<div class="prose"><h4>Notes/Cautions</h4></div>
			<ul class="list list-disc text-base ms-5">
				{#if result.notes.length > 0}
					{#each result.notes as note}
						<li>
							{#if note.quoted_text}
								"...{note.quoted_text}..." -
							{/if}
							{note.meaning}
							{#if settings.mode === 'discern'}
								{note.check}
							{/if}
							{#if settings.show_note_sources}
								<ul class="list ms-5">
									<li>- {JSON.stringify(note.trigger.flags)}</li>
								</ul>
							{/if}
						</li>
					{/each}
				{:else}
					<li>{lwc_info[settings.lwc].no_notes_text || lwc_info['English'].no_notes_text}</li>
				{/if}
			</ul>
		</div>
	</div>
{/if}
