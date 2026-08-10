<script>
	/** @type {Concept['categories']} */
	export let categories

	$: name = categories[0]
</script>

<fieldset class="fieldset border border-base-300 rounded-box p-4">
	<legend class="fieldset-legend font-semibold">Semantic categorization</legend>

	<p class="ms-4 mt-0 text-xl font-bold tracking-widest">
		{name}
	</p>
</fieldset>
