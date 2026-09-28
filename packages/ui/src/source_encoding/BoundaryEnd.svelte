<script lang="ts">
	import type { SourceEntity } from '@tabitha/types'

	let { source_entity }: { source_entity: SourceEntity } = $props()

	// mirrors BoundaryStart's sizing, so an opening and closing bracket of the same nesting depth match
	const boundary_size_map: Record<string, string> = {
		'}': 'text-2xl',
		']': 'text-xl',
		')': 'text-xl',
	}
</script>

<span class="{boundary_size_map[source_entity.value] || 'text-xl'} font-thin pe-1">
	{']'}
</span>
