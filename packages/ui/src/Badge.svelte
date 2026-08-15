<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		children?: Snippet
		classes?: string
		variant?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'error' | 'ghost' | 'soft'
		size?: 'xs' | 'sm' | 'md' | 'lg'
	}

	let { children, classes = '', variant, size = 'lg' }: Props = $props()

	const variant_class = $derived(variant ? `badge-${variant}` : 'border-base-content')
	const size_class = $derived(`badge-${size}`)
</script>

<span class="badge {size_class} {variant_class} {classes}">
	{#if children}
		{@render children()}
	{/if}
</span>
