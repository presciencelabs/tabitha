<script>
	/** @type {Concept['categories']} */
	export let categories

	$: name = categories[0]
</script>

<fieldset class="border rounded-lg p-4">
	<legend class="px-2 bg-base-200 rounded-lg">
		{'Semantic categorization'}
	</legend>

	<p class="text-xl font-bold tracking-widest mt-0 ms-4">
		{name}
	</p>
</fieldset>
