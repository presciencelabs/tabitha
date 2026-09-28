<script>
	import '$lib/app.css'
	import { Search } from '$lib'
	import { onMount } from 'svelte'
	import { Header, Footer, theme_state } from '@tabitha/ui'
	import { report_active_theme } from '@tabitha/usage/client'
	import { useRegisterSW } from 'virtual:pwa-register/svelte'

	let { data, children } = $props()
	let project = $derived(data.project)

	const { needRefresh, updateServiceWorker } = useRegisterSW()

	onMount(() => report_active_theme(theme_state.current))
</script>

<!-- layout not handled by daisyUI, https://daisyui.com/docs/layout-and-typography -->

<Header app="Targets">
	<Search {project} />
</Header>

<main class="mx-8 mt-6">
	{@render children?.()}
</main>

<Footer needs_refresh={$needRefresh} on_refresh={() => updateServiceWorker(true)} />
