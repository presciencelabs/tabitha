<script lang="ts">
	import type { Snippet } from 'svelte'
	import Icon from '@iconify/svelte'

	type Props = {
		children?: Snippet
	}

	let { children }: Props = $props()
</script>

<div class="border border-info bg-info/5 text-info text-sm p-1 rounded-md flex flex-row items-center gap-1">
	<span class="tooltip" data-tip="Pending change...">
		<Icon icon="mdi:clock-outline" class="h-4 w-4" />
	</span>
	{@render children?.()}
</div>
