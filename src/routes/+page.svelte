<script lang="ts">
	import { fetch_target_text, polished_books } from '$lib/lookups'
	import RadioToggle from '$lib/RadioToggle.svelte'
	import { persisted } from '$lib/store.svelte'

	let reference = $state(persisted<Reference>('saved_verse', {
		book: 'Genesis',
		chapter: 1,
		verse: 1,
	}).value)

	let settings = $state(persisted<CopilotSettings>('saved_settings', {
		language_profile: {
			rhetorical_questions: true,
			clusivity: true,
			passive: true,
			dual: true,
			trial: true,
			honorifics: true,
			indirect_speech: true,
		},
		lwc: 'English',
		mtt_level: 'high_school',
		max_cautions: -1,
	}).value)

	let fetching_english = $state(false)
	let english_text: TargetApiResult|undefined = $state(undefined)

	let fetching_cautions = $state(false)
	let result: CopilotApiResult|null = $state(null)

	const lwcs = ['English', 'Swahili', 'Indonesian', 'Tagalog', 'Spanish', 'French', 'Russian']

	async function get_english_text() {
		fetching_english = true
		english_text = await fetch_target_text(reference, 'English', 'Unchurched Adults')
		fetching_english = false
	}

	async function get_cautions() {
		fetching_cautions = true
		const { book, chapter, verse } = reference
		const params = JSON.stringify(settings)
		const response = await fetch(`/${book}/${chapter}/${verse}?settings=${encodeURIComponent(params)}`)
		result = await response.json() as CopilotApiResult
		fetching_cautions = false
	}

	const NT_index_start = polished_books.findIndex(book => book === 'Matthew')
	const OT_books = polished_books.slice(0, NT_index_start)
	const NT_books = polished_books.slice(NT_index_start)
</script>

<form>
	<section class="py-4 flex gap-4 prose">
		<h3>Verse</h3>
		<select class="select w-60" bind:value={reference.book}>
			<optgroup label="Old Testament">
				{#each OT_books as book}
					<option value={book}>{book}</option>
				{/each}
			</optgroup>
			<optgroup label="New Testament">
				{#each NT_books as book}
					<option value={book}>{book}</option>
				{/each}
			</optgroup>
		</select>
		<input bind:value={reference.chapter} class="input w-20" type="number" />
		<input bind:value={reference.verse} class="input w-20" type="number" />
		<button type="button" class="btn btn-md" onclick={get_english_text}>
			Preview English
		</button>
	</section>

	{#if fetching_english}
		<div class="prose">
			<h4>English Preview</h4>
			<div>Loading...</div>
		</div>
	{:else if english_text}
		<div class="w-full">
			<div class="prose"><h4>English Preview</h4></div>
			<div>({english_text?.audience}) {english_text?.text || ''}</div>
		</div>
	{/if}
	
	<details class="collapse collapse-arrow bg-base-100 border-base-300 border mt-5" open>
		<summary class="collapse-title font-semibold">Options</summary>
		<div class="collapse-content text-sm">
			<div class="mb-2">
				Number of notes
				<select class="select" bind:value={settings.max_cautions}>
					<option value={-1}>No limit</option>
					{#each [1, 2, 3, 4, 5] as num}
						<option value={num}>{num}</option>
					{/each}
				</select>
			</div>
			<div class="mb-2">
				MTT education level
				<select class="select" bind:value={settings.mtt_level}>
					<option value="grade5">Grade 5</option>
					<option value="high_school">High-school</option>
					<option value="undergraduate">Undergraduate</option>
				</select>
			</div>
			<div>
				LWC
				<select class="select" bind:value={settings.lwc}>
					{#each lwcs as lwc}
						<option value={lwc}>{lwc}</option>
					{/each}
				</select>
			</div>
		</div>

		<details class="collapse collapse-arrow bg-base-200 border-base-300 border m-2 w-[80%]">
			<summary class="collapse-title font-semibold">Language Profile</summary>
			<div class="collapse-content text-sm w-1/2">
				<RadioToggle label={'Clusivity'} bind:value={settings.language_profile.clusivity} />
				<RadioToggle label={'Dual'} bind:value={settings.language_profile.dual} />
				<RadioToggle label={'Trial'} bind:value={settings.language_profile.trial} />
				<RadioToggle label={'Passive'} bind:value={settings.language_profile.passive} />
				<RadioToggle label={'Rhetorical Questions'} bind:value={settings.language_profile.rhetorical_questions} />
				<RadioToggle label={'Honorifics'} bind:value={settings.language_profile.honorifics} />
				<RadioToggle label={'Indirect Speech'} bind:value={settings.language_profile.indirect_speech} />
			</div>
		</details>
	</details>

	<button type="button" class="btn btn-md mt-5" onclick={get_cautions} disabled={fetching_cautions}>
		Get notes
	</button>
</form>

{#if fetching_cautions}
	<div class="prose"><h2>Notes for {reference.book} {reference.chapter}:{reference.verse}</h2></div>
	<p>Loading...</p>
{:else if result}
	<div class="w-full">
		<div class="prose"><h2>Notes for {result.verse.book} {result.verse.chapter}:{result.verse.verse}</h2></div>

		<div class="mt-5">
			<div class="prose"><h4>English Text</h4></div>
			<p class="text-sm">{result.english_text}</p>
		</div>

		{#if result.translated_text && settings.lwc !== 'English'}
			<div class="mt-5">
				<div class="prose"><h4>LWC Text ({settings.lwc})</h4></div>
				<p>{result.translated_text}</p>
			</div>
		{/if}

		<div class="mt-5">
			<div class="prose"><h4>Notes/Cautions</h4></div>
			<ul class="list list-disc text-md">
				{#each result.cautions as caution}
					<li>{caution}</li>
				{/each}
			</ul>
		</div>
	</div>
{/if}

