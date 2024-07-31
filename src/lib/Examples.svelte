<script>
	import { transform_example, display_context_arguments } from './examples'
	import SourceData from './SourceData.svelte'
	import TargetData from './TargetData.svelte'

	/** @type {Concept} */
	export let concept

	$: transformed_examples = concept.examples.reduce(transform_example, {})

	$: sources = Object.keys(transformed_examples)

	/** @param {string} source */
	function book_count(source) {
		return Object.keys(transformed_examples[source]).length
	}
	let selected_source = ''

	$: books = Object.keys(transformed_examples[selected_source] || [])
	/** @param {string} book */
	function verse_count(book) {
		return Object.keys(transformed_examples[selected_source][book]).length
	}
	let selected_book = ''

	$: verses = transformed_examples[selected_source]?.[selected_book] || {}
	let selected_verse_json_encoded = ''

	$: selected_source && source_changed()
	$: selected_book && book_changed()

	function source_changed() {
		selected_book = ''
		selected_verse_json_encoded = ''
	}
	function book_changed() {
		selected_verse_json_encoded = ''
	}

	$: [selected_chapter, selected_verse] = decode(selected_verse_json_encoded)
	/** @param {string} encoding */
	function decode(encoding) {
		return encoding && JSON.parse(encoding).split(':') || ['', '']
	}

	$: selected_reference = {
		source: selected_source,
		book: selected_book,
		chapter: selected_chapter,
		verse: selected_verse,
	}
</script>

<article class="bg-base-200 p-4 flex flex-col gap-4 prose max-w-none">
	{#if sources.length}
		<form class="flex gap-4">
			<!-- https://daisyui.com/components/select -->
			<select bind:value={selected_source} class="select">
				<option value="" disabled>Select a source</option>
				{#each sources.toSorted() as source}
					<option value={source}>{source} ({book_count(source)})</option>
				{/each}
			</select>

			<select bind:value={selected_book} disabled={! selected_source} class="select">
				<option value="" disabled>Select a book</option>
				{#each books as book}
					<option value={book}>{book} ({verse_count(book)})</option>
				{/each}
			</select>

			<select bind:value={selected_verse_json_encoded} disabled={! selected_book} class="select">
				<option value="" disabled>Select a reference</option>
				{#each Object.entries(verses) as verse}
					{#each verse[1] as occurrence}
						<option value={JSON.stringify(verse[0])}>{verse[0]} {display_context_arguments(concept, occurrence)}</option>
					{/each}
				{/each}
			</select>
		</form>
	{:else}
		None recorded at this time.
	{/if}

	{#if selected_reference.verse}
		<SourceData reference={selected_reference} />

		<h4>
			Generated English text
		</h4>
		<p>
			<TargetData reference={selected_reference} />
		</p>
	{/if}
</article>