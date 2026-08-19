<script lang="ts">
	import type { Snippet } from 'svelte'
	import ThemeSelector from './ThemeSelector.svelte'

	interface Props {
		colors?: string
		children?: Snippet
	}

	let { colors = '', children }: Props = $props()
</script>

<footer class="footer footer-horizontal mt-20 max-w-none bg-neutral p-10 text-neutral-content">
	<nav>
		<ThemeSelector {colors} />
	</nav>

	{#if children}
		<nav class="justify-self-end">
			{@render children()}
		</nav>
	{/if}
</footer>
