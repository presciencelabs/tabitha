<script>
	import '$lib/app.css'
	import { Search } from '$lib'
	import { Header, Footer } from '@tabitha/ui'
	import { useRegisterSW } from 'virtual:pwa-register/svelte'

	let { data, children } = $props()
	let project = $derived(data.project)

	const { needRefresh, updateServiceWorker } = useRegisterSW()
</script>

<!-- layout not handled by daisyUI, https://daisyui.com/docs/layout-and-typography -->

<Header app="Targets">
	<Search {project} />
</Header>

<main class="mx-8 mt-6">
	{@render children?.()}
</main>

<Footer needs_refresh={$needRefresh} on_refresh={() => updateServiceWorker(true)} />
