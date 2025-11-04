<script>
	import '$lib/app.css'
	import { Brand, Search } from '$lib'

	let { data, children } = $props()
	let project = $derived(data.project)
</script>

<!-- layout not handled by daisyUI, https://daisyui.com/docs/layout-and-typography -->

<header class="grid grid-cols-[auto_1fr] mx-8 mt-8">
	<Brand />

	<Search {project} />
</header>

<main class="mx-8 mt-8">
	{@render children?.()}
</main>