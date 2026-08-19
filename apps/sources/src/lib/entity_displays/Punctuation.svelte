<script lang="ts">
	import type { PageSourceEntity } from '$lib/types'

	let { source_entity, classes = '' }: { source_entity: PageSourceEntity, classes?: string } = $props()
</script>

<span class="-mt-4 text-6xl font-thin {classes}">
	{source_entity.category === 'Paragraph' ? '¶' : source_entity.value}
</span>
