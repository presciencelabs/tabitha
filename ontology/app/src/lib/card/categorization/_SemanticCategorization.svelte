<script>
	/** @type {Concept['categories']} */
	export let categories

	$: name = categories[0]
</script>

<fieldset class="rounded-lg border p-4">
	<legend class="rounded-lg bg-base-200 px-2"> Semantic categorization </legend>

	<p class="ms-4 mt-0 text-xl font-bold tracking-widest">
		{name}
	</p>
</fieldset>
