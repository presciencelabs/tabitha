<script lang="ts">
	import type { SourceEntity } from '$lib/types'

	interface Props {
		source_entity: SourceEntity
		classes?: string
	}

	let { source_entity, classes = '' }: Props = $props()
</script>

<span class="text-lg font-thin {classes} pe-1">
	{source_entity.value}
</span>
