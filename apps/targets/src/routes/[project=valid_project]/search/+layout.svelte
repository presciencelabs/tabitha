<script>
	import '$lib/app.css'
	import { Search } from '$lib'
	import { Header, Footer } from '@tabitha/ui'

	let { data, children } = $props()
	let project = $derived(data.project)
</script>

<!-- layout not handled by daisyUI, https://daisyui.com/docs/layout-and-typography -->

<Header app="Targets">
	<Search {project} />
</Header>

<main class="mx-8 mt-6">
	{@render children?.()}
</main>

<Footer />
