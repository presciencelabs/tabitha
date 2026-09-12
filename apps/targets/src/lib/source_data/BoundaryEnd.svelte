<script lang="ts">
	import { Punctuation } from '@tabitha/ui'
	import type { SourceEntity } from '@tabitha/types'

	let { source_entity }: { source_entity: SourceEntity } = $props()
</script>

<Punctuation {source_entity} size="sm" />
