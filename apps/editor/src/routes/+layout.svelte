<script lang="ts">
	import '$lib/app.css'

	import { Header, Footer } from '@tabitha/ui'
	import type { Snippet } from 'svelte'
	import { useRegisterSW } from 'virtual:pwa-register/svelte'

	type Props = {
		children: Snippet
	}

	let { children }: Props = $props()

	const { needRefresh, updateServiceWorker } = useRegisterSW()
</script>

<!-- layout not handled by daisyUI, https://daisyui.com/docs/layout-and-typography -->
<Header app="Editor" />

<main class="mx-8 mt-8">
	{@render children()}
</main>

<Footer needs_refresh={$needRefresh} on_refresh={() => updateServiceWorker(true)} />
