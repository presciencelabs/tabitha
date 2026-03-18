<script>
	import { polished_books } from '$lib/lookups'

	/** @type {{ book: string, disabled?: boolean }}*/
	let { book = $bindable(), disabled = false } = $props()

	const NT_index_start = polished_books.findIndex(book => book === 'Matthew')
	const OT_books = polished_books.slice(0, NT_index_start)
	const NT_books = polished_books.slice(NT_index_start)
</script>

<select class="select w-60" bind:value={book} {disabled}>
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
	<!--TODO add info popup explaining the limitation-->
</select>
