<script lang="ts">
	import type { Snippet } from 'svelte'
	import ThemeSelector from './themes/ThemeSelector.svelte'
	import UpdateToast from './UpdateToast.svelte'

	type Props = {
		colors?: string
		children?: Snippet
		needs_refresh?: boolean
		on_refresh?: () => void
	}

	let { colors = '', children, needs_refresh, on_refresh }: Props = $props()
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

<!-- Footer is the one layout piece every app includes, so it's the single place to mount
     this; the toast is fixed-positioned by daisyUI so where it's mounted in the DOM doesn't matter. -->
<UpdateToast {needs_refresh} {on_refresh} />
