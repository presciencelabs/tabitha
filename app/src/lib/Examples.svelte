<script>
	import Icon from "@iconify/svelte"
	import { PUBLIC_SOURCES_API_HOST } from '$env/static/public'
	import SemanticEncoding from "./SemanticEncoding.svelte"
	import { transform_example, display_context_arguments } from "./examples"

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

	/**
	 * @param {Reference} reference
	 *
	 * @returns {Promise<SourceData>}
	 */
	async function get_source_data(reference) {
		const response = await fetch(get_sources_url(reference))

		return await response.json()
	}

	/**
	 * @param {Reference} reference
	 *
	 * @returns {string} fully-qualified URL to the sources API
	 */
	function get_sources_url({source, book, chapter, verse}) {
		return `${PUBLIC_SOURCES_API_HOST}/${source}/${book}/${chapter}/${verse}`
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

	{#if selected_verse_json_encoded}
		{@const key = JSON.parse(selected_verse_json_encoded)}
		{@const [selected_chapter, selected_verse] = key.split(':')}
		{@const selected_reference = {source: selected_source, book: selected_book, chapter: selected_chapter, verse: selected_verse}}

		{#await get_source_data(selected_reference)}
			loading... <!-- TODO: add a spinner? -->
		{:then source}
			<h4 class="flex justify-between">
				Phase 1 encoding

				<a href={get_sources_url(selected_reference)} target="_blank" class="link link-accent link-hover text-sm flex items-end">
					all source details
					<Icon icon="fe:link-external" class="h-6 w-6" />
				</a>
			</h4>
			<p>
				{source.phase_1_encoding}
			</p>

			<SemanticEncoding phase_2_encoding={source.phase_2_encoding} />
			<!-- TODO: need errorhandling here, i.e., :catch? -->
		{/await}
	{/if}
</article>