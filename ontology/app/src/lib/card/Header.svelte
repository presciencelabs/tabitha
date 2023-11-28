<script>
	/** @type {Concept} */
	export let concept
</script>

<h2 class="relative whitespace-nowrap pb-6">
	{concept.roots}
	<sup class="-top-4 font-mono text-sm text-neutral-500">{concept.sense}</sup>
	<sub class="-bottom-4 -left-4 font-light italic text-neutral-500">{concept.part_of_speech}</sub>
</h2>

<aside class="flex flex-col items-center gap-1 self-start">
	<span class="badge badge-primary badge-lg">
		L{concept.level}
	</span>

	<span class="badge badge-success badge-md tooltip tooltip-right font-mono" data-tip="Occurrences">
		{concept.occurrences}
	</span>
</aside>
