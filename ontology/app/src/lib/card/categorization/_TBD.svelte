<script>
	/** @type {Concept['categories']} */
	export let categories
</script>

<pre data-tip="TBD: still needs to be decoded" class="indicator tooltip tooltip-right inline whitespace-normal">
	{categories.length ? categories : '–'}
	<span class="badge indicator-item badge-warning badge-xs" />
</pre>
