<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		children?: Snippet
		classes?: string
		variant?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'error' | 'ghost' | 'soft'
		size?: 'xs' | 'sm' | 'md' | 'lg'
	}

	let { children, classes = '', variant, size = 'lg' }: Props = $props()

	const variantClass = $derived(variant ? `badge-${variant}` : 'border-base-content')
	const sizeClass = $derived(`badge-${size}`)
</script>

<span class="badge {sizeClass} {variantClass} {classes}">
	{#if children}
		{@render children()}
	{/if}
</span>
