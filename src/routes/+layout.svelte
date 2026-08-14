<script lang="ts">
	import '$lib/app.css'

	import { Brand } from '$lib'
	import { Selector } from '$lib/theme'
	import type { Snippet } from 'svelte'

	interface Props {
		children: Snippet
	}

	let { children }: Props = $props()
</script>

<!-- layout not handled by daisyUI, https://daisyui.com/docs/layout-and-typography -->
<header class="mx-8 mt-8">
	<Brand />
</header>

<main class="mx-8 mt-8">
	{@render children()}
</main>

<!-- https://daisyui.com/components/footer -->
<footer class="footer footer-horizontal mt-20 max-w-none bg-base-200 p-10 text-base-content">
	<nav>
		<h6 class="footer-title">Theme</h6>

		<Selector colors="btn-outline" />
	</nav>
</footer>
