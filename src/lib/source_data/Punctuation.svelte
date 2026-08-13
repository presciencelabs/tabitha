<script lang="ts">
	import type { SourceEntity } from '$lib/types'

	let { source_entity }: { source_entity: SourceEntity } = $props()
</script>

<span class="inline-flex tracking-widest text-lg font-thin">
	{source_entity.value}
</span>
