<script lang="ts">
	import { Badge } from '@tabitha/ui'
	import type { Snippet } from 'svelte'

	type Props = {
		children?: Snippet
		classes?: string
	}

	let { children, classes = '' }: Props = $props()
</script>

<Badge {classes}>
	{#if children}
		{@render children()}
	{/if}
</Badge>
