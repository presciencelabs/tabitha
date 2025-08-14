<script>
	import { Level, Occurrences } from '$lib'

	/** @type {Concept} */
	export let concept
</script>

<h2 class="relative whitespace-nowrap pb-6">
	{concept.stem}
	<sup class="-top-4 font-mono text-sm text-neutral-500">{concept.sense}</sup>
	<sub class="-bottom-4 -left-4 font-light italic text-neutral-500">{concept.part_of_speech}</sub>
</h2>

<aside class="flex flex-col items-center gap-1 self-start">
	<Level {concept} />

	<Occurrences {concept} />
</aside>
