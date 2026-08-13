<script lang="ts">
	import Punctuation from './Punctuation.svelte'
	import type { SourceEntity } from '$lib/types'

	let { source_entity }: { source_entity: SourceEntity } = $props()
</script>

<Punctuation {source_entity} />
