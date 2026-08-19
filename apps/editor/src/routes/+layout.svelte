<script lang="ts">
	import '$lib/app.css'

	import { Header, Footer } from '@tabitha/ui'
	import type { Snippet } from 'svelte'

	type Props = {
		children: Snippet
	}

	let { children }: Props = $props()
</script>

<!-- layout not handled by daisyUI, https://daisyui.com/docs/layout-and-typography -->
<Header app="Editor" />

<main class="mx-8 mt-8">
	{@render children()}
</main>

<Footer />
