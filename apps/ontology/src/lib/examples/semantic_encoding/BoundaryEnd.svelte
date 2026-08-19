<script lang="ts">
	import type { SourceEntity } from '$lib/types'

	type Props = {
		source_entity: SourceEntity
	}

	let { source_entity }: Props = $props()

	const boundary_size_map: Record<string, string> = {
		'}': 'text-2xl',
		']': 'text-xl',
		')': 'text-xl',
	}
</script>

<span class="{boundary_size_map[source_entity.value] || 'text-xl'} font-thin pe-1">
	{']'}
</span>
