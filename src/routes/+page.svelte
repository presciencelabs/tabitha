<script lang="ts">
	import { fetch_target_text, lwc_info } from '$lib/lookups'
	import { persisted } from '$lib/store.svelte'
	import BookSelect from '$lib/BookSelect.svelte'
	import Settings from '$lib/Settings.svelte'

	let reference = $state(persisted<Reference>('saved_verse', {
		book: 'Genesis',
		chapter: 1,
		verse: 1,
	}).value)
	let submitted_reference: Reference = $state($state.snapshot(reference))

	let settings = $state(persisted<CopilotSettings>('saved_settings', {
		language_profile: {
			rhetorical_questions: true,
			clusivity: true,
			passive: false,
			dual: true,
			trial: true,
			honorifics: true,
			indirect_speech: false,
			closing_quotation_frame: true,
		},
		lwc: 'English',
		mtt_level: 'high_school',
		max_cautions: -1,
	}).value)

	let fetching_english = $state(false)
	let english_text: TargetApiResult|undefined = $state(undefined)

	let fetching_cautions = $state(false)
	let result: CopilotApiResult|null = $state(null)

	let error_text = $state('')

	async function get_english_text() {
		fetching_english = true
		english_text = await fetch_target_text(reference, 'English', 'Unchurched Adults')
		fetching_english = false
	}

	async function get_cautions() {
		fetching_cautions = true
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

		fetching_cautions = false
	}
</script>

<form>
	<section class="py-4 flex gap-4 prose">
		<h3>Verse</h3>
		<BookSelect bind:book={reference.book} />
		<input bind:value={reference.chapter} class="input w-20" type="number" />
		<input bind:value={reference.verse} class="input w-20" type="number" />
		<button type="button" class="btn btn-md" onclick={get_english_text}>
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

	<button type="button" class="btn btn-md my-4" onclick={get_cautions} disabled={fetching_cautions}>
		Get notes
	</button>
</form>

{#if fetching_cautions}
	<div class="prose"><h2>Notes for {submitted_reference.book} {submitted_reference.chapter}:{submitted_reference.verse}</h2></div>
	<p>Loading...</p>
{:else if error_text.length}
	<div class="prose"><h2>Notes for {submitted_reference.book} {submitted_reference.chapter}:{submitted_reference.verse}</h2></div>
	<div>{error_text}</div>
{:else if result}
	<div class="w-full pb-8">
		<div class="prose"><h2>Notes for {result.verse.book} {result.verse.chapter}:{result.verse.verse}</h2></div>

		<div class="mt-3">
			<div class="prose"><h4>English Text</h4></div>
			<p>{result.english_text}</p>
		</div>

		{#if result.translated_text && settings.lwc !== 'English'}
			<div class="mt-3">
				<div class="prose"><h4>LWC Text ({settings.lwc})</h4></div>
				<p>{result.translated_text}</p>
			</div>
		{/if}

		<div class="mt-3">
			<div class="prose"><h4>Notes/Cautions</h4></div>
			<ul class="list list-disc text-base ms-5">
				{#if result.cautions.length > 0}
					{#each result.cautions as caution}
						<li>{caution}</li>
					{/each}
				{:else}
					<li>{lwc_info[settings.lwc].no_notes_text || lwc_info['English'].no_notes_text}</li>
				{/if}
			</ul>
		</div>
	</div>
{/if}
