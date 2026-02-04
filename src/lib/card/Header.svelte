<script>
	import { Level, Occurrences, ConceptKey } from '$lib'

	/** @type {Concept} */
	export let concept
</script>

<ConceptKey {concept} />

<aside class="flex flex-col items-center gap-1 self-start">
	<Level level={concept.level} />

	<Occurrences {concept} />
</aside>
