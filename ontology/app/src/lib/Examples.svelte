<script>
	/** @type {Concept['exhaustive_examples']} */
	export let examples


	$: transformed_examples = examples.reduce(transform, {})

	// TODO: maybe this belongs in the data layer...need to consider
	/**
	 * Transforms a list of examples with "flat" References into a nested structure
	 *
	 * 	{
	 * 		{											{
	 * 			source: string							source: {
	 *				book: string				=>					book: {
	 *				chapter: number								'chapter:verse': unknown_encoding,
	 *				verse: number								},
	 * 		},												},
	 *			unknown_encoding: string,			}
	 *		}
	 *
	 * @param {Record<string, Record<string, Record<string, string>>>} transformed_examples
	 * @param {Concept['exhaustive_examples'][0]} example
	 */
	function transform(transformed_examples, {reference, unknown_encoding}) {
		const {source, book, chapter, verse} = reference

		transformed_examples[source] ??= {}
		transformed_examples[source][book] ??= {}
		transformed_examples[source][book][`${chapter}:${verse}`] = unknown_encoding

		return transformed_examples
	}

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
</script>

<article class="bg-base-200 p-4 flex flex-col gap-4">
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
				<option value={JSON.stringify(verse)}>{verse[0]} {verse[1]}</option>
			{/each}
		</select>
	</form>

	{#if selected_verse_json_encoded}
		{@const [key, unknown_encoding] = JSON.parse(selected_verse_json_encoded)}

		<blockquote>
			TBD: full verse once integrated with the Bible database

			<cite class="block w-fit text-start text-xs">
				({selected_book} {key})
			</cite>
		</blockquote>

		<span class="indicator font-mono">
			{unknown_encoding}
			<span data-tip="TBD: still needs to be decoded" class="badge indicator-item badge-warning badge-xs tooltip tooltip-top" />
		</span>
	{/if}
</article>