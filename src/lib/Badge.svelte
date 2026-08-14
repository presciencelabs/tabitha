<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		children?: Snippet
		classes?: string
	}

	let { children, classes = '' }: Props = $props()
</script>

<span class="badge badge-lg border-base-content {classes}">
	{#if children}
		{@render children()}
	{/if}
</span>
