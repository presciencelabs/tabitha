<script>
	/** @type {Concept['categories']} */
	export let categories

	$: name = categories[0]
</script>

<fieldset class="fieldset border border-base-300 rounded-box p-2">
	<legend class="fieldset-legend font-semibold ms-2">Semantic categorization</legend>

	<p class="ms-4 mt-0 mb-3 text-lg font-semibold tracking-widest">
		{name}
	</p>
</fieldset>
